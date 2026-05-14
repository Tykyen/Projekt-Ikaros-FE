# Implementační plán 2.4 — Detail světa + join flow

**Status:** Návrh — čeká na potvrzení
**Spec:** [spec-2.4.md](./spec-2.4.md)
**Design audit:** [design-2.4.md](./design-2.4.md) — zvolen **Směr A „Almanach"** (default + hero fallback `var(--surface-2)` + lucide ikony + drop cap desktop-only)
**Větev:** `feat/krok-2.4-world-detail-join` (vznikne až po souhlasu)
**Odhad:** ~700 ř. FE + ~150 ř. BE + ~250 ř. testů

---

## Pořadí kroků (BE → FE, vrstva po vrstvě, aby šlo průběžně testovat)

### Krok 1 — BE: typ `WorldJoinRequestListItem` + payload provideru

**Nový soubor:** `Projekt-ikaros/backend/src/modules/worlds/interfaces/world-join-request.interface.ts` (~25 ř.)

```ts
export interface WorldJoinRequestListItem {
  membershipId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  requestedAt: string; // ISO
  requester: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}
```

### Krok 2 — BE: `WorldJoinRequestProvider`

**Nový soubor:** `Projekt-ikaros/backend/src/modules/worlds/world-join-request.provider.ts` (~100 ř.)

```ts
@Injectable()
export class WorldJoinRequestProvider implements IPendingActionProvider<WorldJoinRequestListItem> {
  readonly type = PendingActionType.WorldJoinRequest;

  constructor(
    private readonly worldsRepo: WorldsRepository,
    private readonly membershipRepo: WorldMembershipsRepository,
    private readonly usersService: UsersService,
  ) {}

  canHandle(_userId: string, role: UserRole): boolean {
    // Owner check je per-žádost; canHandle reaguje na *roli* (kdo *vůbec* vidí queue).
    // PJ-able role = každý logged-in. Filtr ownership je v countForUser/listForUser.
    return role !== undefined; // všichni logged-in vidí (queue je prázdná pokud nejsou owner)
  }

  async countForUser(userId: string, role: UserRole): Promise<number> {
    const ownedWorldIds = await this.worldsRepo.findIdsByOwnerId(userId);
    if (ownedWorldIds.length === 0 && role > UserRole.Admin) return 0;
    const scope = role <= UserRole.Admin ? undefined : ownedWorldIds;
    return this.membershipRepo.countByRole(WorldRole.Zadatel, { worldIds: scope });
  }

  async listForUser(userId, role, page, limit): Promise<{ items, total }> {
    const ownedWorldIds = await this.worldsRepo.findIdsByOwnerId(userId);
    const scope = role <= UserRole.Admin ? undefined : ownedWorldIds;
    const { items: memberships, total } = await this.membershipRepo.findPaginated({
      role: WorldRole.Zadatel,
      worldIds: scope,
      sort: { joinedAt: -1 },
      page,
      limit,
    });
    const worldMap = new Map((await this.worldsRepo.findByIds(memberships.map(m => m.worldId))).map(w => [w.id, w]));
    const userMap = new Map((await this.usersService.findManyByIds(memberships.map(m => m.userId))).map(u => [u.id, u]));
    return {
      items: memberships.map(m => ({
        membershipId: m.id,
        worldId: m.worldId,
        worldName: worldMap.get(m.worldId)?.name ?? '?',
        worldSlug: worldMap.get(m.worldId)?.slug ?? '',
        requestedAt: m.joinedAt.toISOString(),
        requester: {
          id: m.userId,
          username: userMap.get(m.userId)?.username ?? '?',
          avatarUrl: userMap.get(m.userId)?.avatarUrl,
        },
      })),
      total,
    };
  }
}
```

**Pozor:** `WorldsRepository.findIdsByOwnerId` a `WorldMembershipsRepository.countByRole({ worldIds })` + `findPaginated({ worldIds })` — pokud neexistují, doplnit (cca 30 ř.).

### Krok 3 — BE: registrace providera

**Soubor:** `Projekt-ikaros/backend/src/modules/worlds/worlds.module.ts`

```diff
+ import { WorldJoinRequestProvider } from './world-join-request.provider';
+ import { PendingActionsModule } from '../pending-actions/pending-actions.module';

  @Module({
    imports: [
      // …
+     forwardRef(() => PendingActionsModule),
    ],
    providers: [
      WorldsService,
+     WorldJoinRequestProvider,
    ],
    exports: [WorldsService],
  })
- export class WorldsModule {}
+ export class WorldsModule implements OnModuleInit {
+   constructor(
+     private readonly pendingActions: PendingActionsService,
+     private readonly provider: WorldJoinRequestProvider,
+   ) {}
+   onModuleInit() {
+     this.pendingActions.registerProvider(this.provider);
+   }
+ }
```

### Krok 4 — BE: resolve endpointy

**Soubor:** `worlds.controller.ts` — přidat 2 endpointy:

```ts
@Post(':worldId/join-requests/:membershipId/accept')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'PJ schválí žádost o vstup (Zadatel → Hrac)' })
acceptJoinRequest(
  @Param('worldId') worldId: string,
  @Param('membershipId') membershipId: string,
  @CurrentUser() user: RequestUser,
) {
  return this.worldsService.acceptJoinRequest(worldId, membershipId, user);
}

@Post(':worldId/join-requests/:membershipId/reject')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'PJ zamítne žádost o vstup (delete membership)' })
rejectJoinRequest(
  @Param('worldId') worldId: string,
  @Param('membershipId') membershipId: string,
  @CurrentUser() user: RequestUser,
) {
  return this.worldsService.rejectJoinRequest(worldId, membershipId, user);
}
```

**Soubor:** `worlds.service.ts` — implementace (cca 60 ř.):

```ts
async acceptJoinRequest(worldId: string, membershipId: string, requester: RequestUser) {
  const world = await this.findById(worldId);
  this.assertCanModerateJoinRequests(world, requester); // owner OR Admin/Superadmin
  const m = await this.membershipRepo.findById(membershipId);
  if (!m || m.worldId !== worldId) throw new NotFoundException({ code: 'JOIN_REQUEST_NOT_FOUND' });
  if (m.role !== WorldRole.Zadatel) throw new BadRequestException({ code: 'NOT_PENDING' });
  await this.membershipRepo.updateRole(membershipId, WorldRole.Hrac);
  await this.worldsRepo.increment(worldId, 'playerCount', 1);
  this.eventEmitter.emit('world.join.accepted', { worldId, membershipId, userId: m.userId });
  return { ok: true };
}

async rejectJoinRequest(worldId: string, membershipId: string, requester: RequestUser) {
  const world = await this.findById(worldId);
  this.assertCanModerateJoinRequests(world, requester);
  const m = await this.membershipRepo.findById(membershipId);
  if (!m || m.worldId !== worldId) throw new NotFoundException({ code: 'JOIN_REQUEST_NOT_FOUND' });
  if (m.role !== WorldRole.Zadatel) throw new BadRequestException({ code: 'NOT_PENDING' });
  await this.membershipRepo.delete(membershipId);
  this.eventEmitter.emit('world.join.rejected', { worldId, membershipId, userId: m.userId });
  return { ok: true };
}

private assertCanModerateJoinRequests(world: World, requester: RequestUser) {
  const isOwner = world.ownerId === requester.id;
  const isAdmin = requester.role === UserRole.Admin || requester.role === UserRole.Superadmin;
  if (!isOwner && !isAdmin) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Nedostatečná oprávnění' });
}
```

### Krok 5 — BE: `GET /worlds/:id` populate owner

**Soubor:** `worlds.service.ts` — upgrade `findById`:

```diff
async findById(id: string): Promise<World & { owner?: PublicUserSummary }> {
  const world = await this.worldsRepo.findById(id);
  if (!world) throw new NotFoundException({ code: 'WORLD_NOT_FOUND' });
+ const owner = await this.usersService.findPublicSummary(world.ownerId);
- return world;
+ return { ...world, owner };
}
```

`PublicUserSummary` = `{ id, username, avatarUrl }` (vytvořit pokud neexistuje v `users.interface.ts`).

⚠️ **Auth-leak policy** ([rules/auth-leak-policy.md](../../../../Projekt-ikaros/.claude/rules/auth-leak-policy.md)): pro `accessMode='private'` musí `findById` při anon/non-member volajícím vrátit **404**, ne data. Existující chování ověřit a doplnit pokud chybí.

### Krok 6 — BE: testy (+5)

**Soubor:** `worlds.service.spec.ts`:
1. `acceptJoinRequest` — owner promote Zadatel→Hrac + playerCount++.
2. `acceptJoinRequest` — non-owner Hrac → ForbiddenException.
3. `rejectJoinRequest` — owner delete membership.
4. `findById` — populate owner (mock UsersService).

**Soubor:** `world-join-request.provider.spec.ts` (nový):
5. `countForUser` — PJ s 2 vlastními světy a 3 Zadately → vrátí 3.

---

### Krok 7 — FE: typ `WorldJoinRequestListItem` + sync `World.owner`

**Soubor:** `src/shared/types/index.ts` — přidat:

```diff
  export interface World {
    // …
+   owner?: { id: string; username: string; avatarUrl?: string };
  }

+ export interface WorldJoinRequestListItem {
+   membershipId: string;
+   worldId: string;
+   worldName: string;
+   worldSlug: string;
+   requestedAt: string;
+   requester: { id: string; username: string; avatarUrl?: string };
+ }
```

### Krok 8 — FE: hooks

**Nový:** `src/features/world/api/useJoinWorld.ts` (~25 ř.)

```ts
export function useJoinWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<{ membership: WorldMembership }>(`/worlds/${worldId}/join`, {}),
    onSuccess: (_, worldId) => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
      qc.invalidateQueries({ queryKey: ['worlds', worldId] });
    },
  });
}
```

**Nový:** `src/features/world/api/useWorldJoinRequestActions.ts` (~30 ř.)

```ts
export function useAcceptWorldJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worldId, membershipId }: { worldId: string; membershipId: string }) =>
      api.post(`/worlds/${worldId}/join-requests/${membershipId}/accept`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-actions'] }),
  });
}

export function useRejectWorldJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worldId, membershipId }: { worldId: string; membershipId: string }) =>
      api.post(`/worlds/${worldId}/join-requests/${membershipId}/reject`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-actions'] }),
  });
}
```

**Nový:** `src/features/world/hooks/useWorldLink.ts` (~15 ř.)

```ts
import { useMemo } from 'react';
import { useMyWorlds } from '../api/useWorlds';
import { WorldRole } from '@/shared/types';

export function useWorldLink(worldId: string): string {
  const { data: myWorlds } = useMyWorlds();
  return useMemo(() => {
    const entry = myWorlds?.find((m) => m.world.id === worldId);
    const isMember = entry && entry.membership.role !== WorldRole.Zadatel;
    return isMember ? `/svet/${worldId}` : `/svet/${worldId}/info`;
  }, [myWorlds, worldId]);
}
```

### Krok 9 — FE: `WorldDetailPage` (Almanach kompozice)

**Adresář:** `src/features/world/pages/WorldDetailPage/`

Soubory (viz spec §4.5):
- `WorldDetailPage.tsx` (~80 ř.) — orchestrator, loading/error
- `WorldDetailPage.module.css` (~120 ř.) — grid + spacing + media queries
- `index.ts` (re-export)
- `components/WorldDetailTopBar.tsx` (~30 ř.) — back link + Sdílet button (clipboard `/info` URL)
- `components/WorldDetailMasthead.tsx` (~60 ř.) — indicia stripe + H1 + meta single-line
- `components/WorldDetailContent.tsx` (~80 ř.) — 2col grid: popis (drop cap desktop) + meta sidebar (sticky)
- `components/WorldDetailOwner.tsx` (~40 ř.) — avatar + username + plain text (link disabled dokud 1.1+)
- `components/WorldDetailJoinCTA.tsx` (~100 ř.) — 5 stavů, useJoinWorld integrace
- `components/WorldDetailMeta.tsx` (~50 ř.) — labels + chips/values pro tóny/kostky/systém/kapacita
- `components/WorldDetailSkeleton.tsx` (~30 ř.) — placeholder s shimmer

**Almanach scale (CSS):**
```css
.h1 { font-size: clamp(48px, 8vw, 96px); font-family: var(--font-display); line-height: 0.95; letter-spacing: -0.02em; }
.indicia { font-size: 12px; text-transform: uppercase; letter-spacing: 0.25em; color: var(--text-muted); }
.metaLabel { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted); margin-bottom: 4px; }
.body { font-size: 16px; line-height: 1.65; font-family: var(--font-body); }
.body p::first-letter { /* drop cap — only desktop */ }
@media (min-width: 1024px) {
  .body p:first-of-type::first-letter {
    font-size: 64px; float: left; padding-right: 12px; line-height: 0.9;
    font-family: var(--font-display); color: var(--accent);
  }
}
```

**Grid desktop:**
```css
.content { display: grid; grid-template-columns: 1fr 320px; gap: 64px; max-width: 1200px; margin: 0 auto; padding: 0 80px; }
.sidebar { position: sticky; top: 24px; align-self: start; }
@media (max-width: 1023px) { .content { grid-template-columns: 1fr; padding: 0 20px; gap: 32px; } .sidebar { position: static; } }
```

**Motion:**
```css
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.indicia, .h1, .metaLine, .body, .sidebar { opacity: 0; animation: fadeUp 0.5s ease forwards; }
.indicia { animation-delay: 0ms; } .h1 { animation-delay: 100ms; }
.metaLine { animation-delay: 200ms; } .body { animation-delay: 300ms; } .sidebar { animation-delay: 400ms; }
@media (prefers-reduced-motion: reduce) { .indicia, .h1, .metaLine, .body, .sidebar { opacity: 1; animation: none; } }
```

### Krok 10 — FE: route + `WorldLayout` guard

**Soubor:** `src/app/router.tsx` — přidat **PŘED** existující `/svet/:worldId` blok:

```diff
+ {
+   path: '/svet/:worldId/info',
+   element: p(WorldDetailPage),
+   errorElement: <ErrorPage />,
+ },
  {
    path: '/svet/:worldId',
    element: <WorldLayout />,
    loader: requireAuth,
    // …
  },
```

**Soubor:** `src/app/layout/WorldLayout/WorldLayout.tsx` — přidat non-member guard:

```diff
  export function WorldLayout() {
    const { worldId = '' } = useParams<{ worldId: string }>();
+   const { data: myWorlds, isLoading: myWorldsLoading } = useMyWorlds();
+   const { data: world, isLoading } = useWorld(worldId);
+
+   const myMembership = useMemo(
+     () => myWorlds?.find((m) => m.world.id === worldId)?.membership,
+     [myWorlds, worldId],
+   );
+   const isFullMember = myMembership && myMembership.role !== WorldRole.Zadatel;
+
+   if (!myWorldsLoading && !isFullMember) {
+     return <Navigate to={`/svet/${worldId}/info`} replace />;
+   }
    // … zbytek beze změny
  }
```

### Krok 11 — FE: `WorldDashboardPage` upgrade na welcome view

**Soubor:** `src/features/world/pages/WorldDashboardPage.tsx` — přepsat z 3 ř. stubu na ~60 ř.:

```tsx
import { useContext } from 'react';
import { MessageSquare, BookOpen, Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorldContext } from '@/features/world/context/WorldContext';
import s from './WorldDashboardPage.module.css';

export default function WorldDashboardPage() {
  const { worldId, world } = useContext(WorldContext);
  return (
    <div className={s.welcome}>
      <header className={s.hero}>
        <h1 className={s.title}>Vítej zpět v {world?.name ?? '...'}</h1>
        <hr className={s.divider} />
        <p className={s.subtitle}>Vyber, kam se chceš vrátit.</p>
      </header>

      <nav className={s.tiles} aria-label="Hlavní sekce světa">
        <Tile to={`/svet/${worldId}/chat`}    Icon={MessageSquare} label="Chat" />
        <Tile to={`/svet/${worldId}/stranky`} Icon={BookOpen}      label="Stránky" />
        <Tile to={`/svet/${worldId}/mapa`}    Icon={Map}           label="Mapa" />
        <Tile to={`/svet/${worldId}/postavy`} Icon={Users}         label="Postavy" />
      </nav>

      <footer className={s.placeholder}>
        <p>Aktivita ve světě a kalendář událostí přibyde brzy.</p>
      </footer>
    </div>
  );
}

function Tile({ to, Icon, label }) {
  return (
    <Link to={to} className={s.tile} aria-label={label}>
      <Icon size={32} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
```

**Nový soubor:** `WorldDashboardPage.module.css` (~80 ř.) — 2x2 grid tiles, hover lift, theme tokens.

### Krok 12 — FE: link dispatch ve všech kartách

**Editovat (přes `useWorldLink` hook):**

1. [`src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx`](../../src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx) — řádek 24: `to={`/svet/${world.id}`}` → `to={useWorldLink(world.id)}`.
2. [`src/features/ikaros/pages/DashboardPage/components/EventCard.tsx`](../../src/features/ikaros/pages/DashboardPage/components/EventCard.tsx) — řádek 31: stejně.
3. [`src/features/profile/components/WorldsSection.tsx`](../../src/features/profile/components/WorldsSection.tsx) — řádek 38.
4. [`src/app/layout/IkarosLayout/IkarosLayout.tsx`](../../src/app/layout/IkarosLayout/IkarosLayout.tsx) — řádek 139 + 225 (Moje světy + Veřejné světy v sidebaru). Moje světy = vždy member → `/svet/:id` (zachovat). Veřejné světy = vždy nečlen → `/svet/:id/info` (změnit napevno).
5. Vesmíry (2.2) — pokud používá vlastní card, najít a opravit (grep `to={\`/svet/`).

**Po-úprava:** smoke test, že dashboard WorldCard test (`WorldCard.spec.tsx:97`) stále zelený — bude potřeba mock `useMyWorlds` ve spec testu.

### Krok 13 — FE: `WorldJoinRequestRenderer` + registrace

**Nový adresář:** `src/features/world/components/WorldJoinRequestRenderer/`
- `WorldJoinRequestRenderer.tsx` (~100 ř.) — exporty Left/Mid/Actions (viz spec §4.6).
- `WorldJoinRequestRenderer.module.css` (~50 ř.).
- `index.ts`.

**Reject confirm modal:** reuse `ConfirmDialog` komponentu z `shared/ui/` pokud existuje, jinak inline.

**Edit:** [`src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx`](../../src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx):

```diff
+ import {
+   WorldJoinRequestActions,
+   WorldJoinRequestLeft,
+   WorldJoinRequestMid,
+ } from '@/features/world/components/WorldJoinRequestRenderer';

+ const worldJoinRequestRenderer: PendingActionRenderer<WorldJoinRequestListItem> = {
+   type: PendingActionType.WorldJoinRequest,
+   renderLeft: (item) => <WorldJoinRequestLeft item={item} />,
+   renderMid: (item) => <WorldJoinRequestMid item={item} />,
+   renderActions: (item, helpers) => (
+     <WorldJoinRequestActions item={item} onResolve={helpers.onResolve} isLoading={helpers.isLoading} />
+   ),
+ };

  export const PENDING_ACTION_RENDERERS = {
    [PendingActionType.UsernameRequest]: usernameRequestRenderer as PendingActionRenderer<unknown>,
    [PendingActionType.FriendRequest]: friendRequestRenderer as PendingActionRenderer<unknown>,
+   [PendingActionType.WorldJoinRequest]: worldJoinRequestRenderer as PendingActionRenderer<unknown>,
  };
```

### Krok 14 — FE: testy (+17)

**Nové spec soubory:**

1. `WorldDetailPage.spec.tsx` (4):
   - render world data smoke
   - render pro anon → JoinCTA „Vstoupit" → mock LoginModal opened
   - render pro logged-in member → CTA „Vstoupit do hry"
   - error state „nenalezen"

2. `WorldDetailJoinCTA.spec.tsx` (5 — 5 stavů z spec §AC 15)

3. `WorldJoinRequestRenderer.spec.tsx` (3): renderLeft/Mid + Accept volá mutation + Reject otevře confirm modal

4. `useJoinWorld.spec.ts` (2): success invaliduje queries; error → propagate

5. `useWorldLink.spec.ts` (2): member → `/svet/:id`; non-member → `/svet/:id/info`

6. `WorldDashboardPage.spec.tsx` (1): render dlaždic + nadpis s názvem světa

**Edit existujících (mock `useMyWorlds`):**
- `WorldCard.spec.tsx` — řádek 97: `expect(link.getAttribute('href')).toBe('/svet/w1/info')` (pro nečlena) nebo zachovat `/svet/w1` pokud mock vrací membership.
- `EventCard.spec.tsx` — analogicky.

### Krok 15 — verifikace

```bash
# FE
cd c:/Matrix/ProjektIkaros/Projekt-ikaros-FE
npm run lint
npm run lint:colors  # žádný hardcoded literál
npx tsc --noEmit
npm run test:run
npm run build

# BE
cd C:/Matrix/ProjektIkaros/Projekt-ikaros
npm run lint
npm run test
npm run build
```

**Smoke test (manual):**
1. Anon na `/svet/w1/info` → vidí Detail public světa (žádný redirect).
2. Anon na `/svet/w1/info` (private svět) → 404 (auth-leak policy).
3. Anon klik „Vstoupit" → LoginModal.
4. Logged-in nečlen na `/svet/w1` (private) → redirect na `/svet/w1/info`.
5. Logged-in nečlen na public světě → „Vstoupit" → mutation → toast → navigate `/svet/w1` (welcome).
6. Logged-in PJ owner v ZpracovatTabu → vidí pending Zadatela → Přijmout → karta zmizí + playerCount++.
7. Hráč po Reject → refresh `/info` → znovu vidí „Požádat o vstup".
8. Mobile resize → CTA sticky bottom bar, hero 200px, meta wrap.

### Krok 16 — uzavření

1. Zaškrtnout 2.4 v [`docs/roadmap-fe.md`](../../roadmap-fe.md) (řádek 477-480).
2. Uzavřít dluhy pokud spec vyřešil (1.4 D-NEW: žádný pravděpodobně).
3. Doplnit `feedback_*` memory pokud něco padlo (např. routing volba B).
4. Spustit skill `napoveda` — aktualizovat Nápovědu o nové stránce `/svet/:id/info` + že detail světa funguje.
5. Spustit skill `mobil-desktop` — manual ověření mobile/desktop variant.

---

## Závislosti mezi kroky

```
Krok 1 (BE types) ─────────────┐
Krok 2 (BE provider) ───────────┼──→ Krok 6 (BE testy)
Krok 3 (BE module wire) ───────┘
Krok 4 (BE resolve endpoints) ─→ Krok 6
Krok 5 (BE owner populate) ────→ Krok 7 (FE types)

Krok 7 (FE types) ─→ Krok 8 (FE hooks) ─→ Krok 9 (WorldDetailPage)
                                       ├→ Krok 11 (WorldDashboardPage)
                                       ├→ Krok 12 (link dispatch)
                                       └→ Krok 13 (renderer)

Krok 9 + 11 ─→ Krok 10 (router + WorldLayout guard)
Krok 13 ─→ Krok 14 (testy)
Vše ─→ Krok 15 (verifikace) ─→ Krok 16 (uzavření)
```

Krok 1–6 (BE) lze udělat **paralelně** s Krok 7–8 (FE typy + hooks), protože FE typy jsou ručně synced — žádná blokující závislost na BE buildu.

---

## Rizika v implementaci (nad rámec spec §8)

- **`MembershipRepo.findIdsByOwnerId` / `countByRole({ worldIds })`** — pokud neexistují, doplnit. Když existují, ale s jinou signaturou, refactor zachovat zpětně kompatibilní.
- **`forwardRef(() => PendingActionsModule)`** — circular dependency risk pokud `PendingActionsModule` už importuje `WorldsModule`. Ověř před implementací.
- **`useWorldLink` ve WorldCard testech** — testy dnes spec přímo render. Nutno mock `useMyWorlds` (přidat do `vi.mock('@/features/world/api/useWorlds')`).
- **Hero fallback** — pokud `world.imageUrl` null a skin neposkytuje `--accent-gradient` token, fallback `var(--surface-2)` je validní (decentní). Test: hero render bez imageUrl → solid surface, žádný broken `<img>`.
- **Drop cap** + multi-paragraph popis — pouze `p:first-of-type::first-letter`. Pokud popis začíná uvozovkou, drop cap chytí ji (browser quirk). Akceptovatelné MVP.

---

## Co NEděláme v 2.4 (potvrzení out-of-scope)

- ❌ Restructure routing existujících gameplay routes
- ❌ Hero image upload (2.5)
- ❌ Owner profile link (1.1+)
- ❌ Anon join-resume po loginu (dluh)
- ❌ OG image pro share link (dluh)
- ❌ Audit log odmítnutých žádostí (dluh)
- ❌ Member real dashboard obsah (fáze 4+)
- ❌ Socket real-time pending updates (polling 30s stačí)

---

## Potvrzení k zahájení

Prosím o `OK` pro spuštění implementace. Spustím kroky 1–16 sekvenčně, commitnu **per logickou jednotku** (BE typy+provider+module = 1 commit, BE resolve+testy = 1 commit, FE typy+hooks = 1 commit, atd.), na konci souhrn + `lint`+`tsc`+`build`+`test:run` zelené.
