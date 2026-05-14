# Spec 2.4 — Detail světa + join flow

**Status:** Draft — čeká na schválení
**Rozsah:** FE (nová public stránka `/svet/:id/info` + upgrade `WorldDashboardPage` na welcome + 3 hooks + renderer Zpracovat + WorldCard dispatch) + BE (1 provider + 2 resolve endpointy, žádná schema změna)
**Větev:** `feat/krok-2.4-world-detail-join`
**Velikost:** ~12 FE souborů (~700 ř.) + ~3 BE soubory (~150 ř.)
**Autor:** PJ + Claude
**Datum:** 2026-05-14
**Souvisí:** [spec-2.2.md](./spec-2.2.md) (Vesmíry — link na detail), [spec-2.3.md](./spec-2.3.md) (CreateWorldPage navigace), [spec-1.4](../phase-1/spec-1.4.md) (Zpracovat queue infra), 2.5 (settings světa)

**Architektonická volba (2026-05-14):** routing migrace **NE**. Public Detail dostane samostatnou URL `/svet/:worldId/info` (mimo `/svet/:worldId` strukturu). `WorldCard` linkuje **dispatch** — member → `/svet/:id` (gameplay welcome), nečlen/anon → `/svet/:id/info` (public detail).

---

## 1. Cíl

Dvě stránky pro dva pohledy na svět:

### A) `/svet/:worldId/info` — **Public Detail světa** (anon-friendly)
- **Anon / nečlen / Zadatel** uvidí info, popis, žánr, tóny, kostky, kapacita, PJ vlastník, počet hráčů, akce **Vstoupit / Požádat o vstup**.
- **Member** sem může přijít (např. ze share linku), ale Join CTA je nahrazena CTA „Vstoupit do hry" → naviguje na `/svet/:id`.

### B) `/svet/:worldId` — **Úvodní stránka světa** (member-only, gameplay shell)
- Existující WorldLayout + requireAuth (beze změny routing).
- `WorldDashboardPage` (index route) upgrade z `[stub]` na **member welcome view**: nadpis „Vítej zpět v {name}", 4 dlaždice (Chat / Stránky / Mapa / Postavy), placeholder „recent activity / brzy přibyde".
- Minimal view úmyslně — fáze 4+ ho přepracuje na real dashboard (calendar widget, online members, recent events).

### Link dispatch (klíčové!)

`WorldCard` (a všechny ostatní karty světů: dashboard 2.1, vesmíry 2.2, profil) linkují **na základě membership**:
- Member tohoto světa → `/svet/:id` (rovnou do welcome / gameplay).
- Nečlen / anon → `/svet/:id/info` (public detail s Join CTA).

`useMyWorlds()` je disabled pro anon (no token) → vždy fallback na `/info`. ✓

### Join flow
- `accessMode='public'` → přímý vstup (Hrac), bez schválení → po success navigate `/svet/:id` (welcome).
- `accessMode='open'` / `'private'` → žádost = `WorldMembership(role=Zadatel)` → karta v **Zpracovat** tabu PJ vlastníka.
- `accessMode='closed'` → CTA disabled, info „Svět je uzavřen".

PJ vlastník v Zpracovat tabu **Přijme** (Zadatel → Hrac) nebo **Odmítne** (delete membership).

---

## 2. Kontext / motivace

- Roadmap 2.4 = poslední chybějící veřejně přístupná stránka v hierarchii světů. Bez ní:
  - link `/svet/:id` z karet ve Vesmírech (2.2), dashboardu (2.1) a po vytvoření světa (2.3) vede do chráněné `WorldLayout`, kterou anon nevidí.
  - Není kam dát „Join" tlačítko pro nečlena.
- BE už má **většinu** potřebné logiky:
  - [`worlds.controller.ts:130-136`](../../../../Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts) — `POST /api/worlds/:id/join` (JwtAuthGuard) implementován.
  - [`worlds.service.ts:225-283`](../../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts) — logika: `public` → `Hrac`, jinak → `Zadatel`; idempotentní, emituje `world.join.requested` event.
  - `GET /api/worlds`, `GET /api/worlds/:id`, `GET /api/worlds/slug/:slug` — všechny `OptionalJwtAuthGuard` (anon-friendly) ✓.
  - `PendingActionType.WorldJoinRequest='world_join_request'` v enumu ✓ (BE i FE).
  - `ZpracovatTab` má `GROUP_TITLES[WorldJoinRequest]='Žádosti o vstup do světa'` ✓.
- **Chybí**: BE provider, resolve endpointy (accept/reject), FE detail view (na nové public route), member welcome upgrade, mutation hook, renderer, link dispatch.
- Routing: `/svet/:worldId` má `requireAuth` loader → anon redirect (zachováno). Pro nečlena/anon přidáme **samostatnou public route** `/svet/:worldId/info` mimo `/svet/:worldId` strukturu.

---

## 3. Audit současného stavu

### BE — co existuje
- [`worlds.controller.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts):
  - `POST /api/worlds/:id/join` ✓
  - `GET /api/worlds/:id` (OptionalJwtAuthGuard) ✓
  - `DELETE /api/worlds/:worldId/members/:membershipId` (leave/remove) — **použitelné pro Reject** (PJ smaže pending Zadatel).
  - `PATCH /api/worlds/:worldId/members/:membershipId/role` — **použitelné pro Accept** (PJ změní role: Zadatel → Hrac).
- [`worlds.service.join`](../../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts) ✓ — viz §2.
- [`PendingActionsService.registerProvider`](../../../../Projekt-ikaros/backend/src/modules/pending-actions/pending-actions.service.ts) ✓ — DI registr.
- [`IPendingActionProvider`](../../../../Projekt-ikaros/backend/src/modules/pending-actions/pending-action-provider.interface.ts) ✓ — interface.

### BE — co chybí
- `WorldJoinRequestProvider implements IPendingActionProvider` — nový soubor `backend/src/modules/worlds/world-join-request.provider.ts`.
- Registrace providera v `WorldsModule.onModuleInit` (analogicky `FriendshipsModule`, `UsersModule`).
- DTO + endpointy pro **Accept** a **Reject** žádosti — viz §4.1.
- Auto-increment `playerCount` při Accept (Zadatel→Hrac).

### FE — co existuje
- [`router.tsx:144`](../../src/app/router.tsx) — route `/svet/:worldId` s WorldLayout + requireAuth.
- [`WorldLayout.tsx`](../../src/app/layout/WorldLayout/WorldLayout.tsx) — header + nav + Outlet.
- [`WorldDashboardPage.tsx`](../../src/features/world/pages/WorldDashboardPage.tsx) — **stub** `<div>[stub] Přehled světa</div>`.
- [`useWorld(worldId)`](../../src/features/world/api/useWorlds.ts) — `GET /worlds/:id` (volá `useQuery`, není přihlášení vázané — funguje pro anon).
- [`useMyWorlds()`](../../src/features/world/api/useWorlds.ts) — list `MyWorldEntry[]` pro logged-in (auth gate uvnitř hooku).
- [`ZpracovatTab.tsx`](../../src/features/users/components/tabs/ZpracovatTab/ZpracovatTab.tsx) + [`rendererRegistry.tsx`](../../src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx) — registr rendererů, group titles, hotová orchestrace.
- `PendingActionType.WorldJoinRequest` v `shared/types/index.ts` ✓.

### FE — co chybí
- `WorldDetailPage` (nová komponenta, public-friendly, vlastní lehký shell — žádný WorldLayout) na nové route `/svet/:worldId/info`.
- Upgrade `WorldDashboardPage` ze stubu na **welcome view** (nadpis + 4 dlaždice + placeholder „brzy přibyde").
- WorldLayout interní guard: non-member logged-in → redirect na `/svet/:id/info` (cca 5 ř.).
- `WorldCard` (a další karty světů) **link dispatch** podle membership: member → `/svet/:id`, jinak → `/svet/:id/info`.
- `useJoinWorld` mutation hook.
- `useAcceptWorldJoinRequest` / `useRejectWorldJoinRequest` mutation hooks.
- `WorldJoinRequestRenderer` (Zpracovat karta) + registrace v `PENDING_ACTION_RENDERERS`.
- Typy `WorldJoinRequestListItem` v `shared/types`.
- Nová route `/svet/:worldId/info` v `router.tsx` (mimo `/svet/:worldId` strukturu, public — žádný `requireAuth`).

---

## 4. Návrh řešení

### 4.1 BE — provider + resolve endpointy

**`world-join-request.provider.ts`** (cca 80 ř.):
```ts
@Injectable()
export class WorldJoinRequestProvider implements IPendingActionProvider<WorldJoinRequestListItem> {
  readonly type = PendingActionType.WorldJoinRequest;
  // ...
  canHandle(userId, role) {
    // PJ vlastník alespoň jednoho světa s pending Zadatel → true.
    // Admin/Superadmin → true (vidí všechny pending žádosti — D-NEW-admin-scope).
    // Ostatní → false.
  }
  countForUser(userId, role) {
    // SUM pending Zadatel memberships ve světech kde user je owner (worlds.ownerId = userId)
    //   nebo Admin/Superadmin (cross-world).
  }
  listForUser(userId, role, page, limit) {
    // Stejný filter + populate { worldId, worldName, requester: { id, username, avatarUrl } }
  }
}
```

Provider se registruje v `WorldsModule.onModuleInit` přes `PendingActionsService.registerProvider(this)`.

**Resolve endpointy** (existující — žádné nové potřeba):
- **Accept** = `PATCH /api/worlds/:worldId/members/:membershipId/role` body `{ role: WorldRole.Hrac }`.
  - Stávající `updateMemberRole` musí povolit přechod `Zadatel → Hrac` (pravděpodobně už povoluje, ověř).
  - **Pozor:** při Accept musí service inkrementovat `playerCount` (dnes increment je jen v `join` při `public`). **Dluh nebo součást 2.4.**
- **Reject** = `DELETE /api/worlds/:worldId/members/:membershipId`.
  - Stávající `leave/remove` smaže membership. OK.
  - **Pozor:** musí povolit majiteli světa smazat `Zadatel` membership (pravděpodobně ano přes `canManageMembership`, ověř).

**Alternativa — dedikovaný endpoint** (čistší API, ale víc kódu):
- `POST /api/worlds/:worldId/join-requests/:membershipId/accept` → atomicky promote + increment + emit event.
- `POST /api/worlds/:worldId/join-requests/:membershipId/reject` → delete + emit event.

**Volba pro 2.4:** **dedikovaný endpoint** (analogie `POST /friends/:id/accept` z 1.8). Důvod: atomicita increment, jasná sémantika v API, snadno se testuje, žádná interpretace generického `updateMemberRole`.

**Event emit:** `world.join.accepted` + `world.join.rejected` (analogicky `world.join.requested`). Slouží pro budoucí toast/notif (out of scope 2.4).

### 4.2 BE — typ payloadu

```ts
export interface WorldJoinRequestListItem {
  membershipId: string;     // pro resolve URL
  worldId: string;
  worldName: string;
  worldSlug: string;
  requestedAt: string;      // ISO
  requester: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}
```

`WorldsModule` exportuje typ; FE ho dostane přes type-sync (skill `type-sync`) jako součást `shared/types`.

### 4.3 FE — routing (žádná migrace existujícího)

**Beze změny:**
```ts
{
  path: '/svet/:worldId',
  element: <WorldLayout />,
  loader: requireAuth,
  children: [
    { index: true, element: p(WorldDashboardPage) },   // upgrade na welcome view
    { path: 'chat', element: p(WorldChatPage) },
    // … všechny ostatní gameplay routes BEZE ZMĚNY
  ],
},
```

**Nová samostatná public route** (přidat v `router.tsx`):
```ts
{
  path: '/svet/:worldId/info',
  element: <WorldDetailPage />,
  errorElement: <ErrorPage />,
},
```

⚠️ **Pozor na pořadí:** musí být **před** `/svet/:worldId` blokem (react-router specificita), aby `/svet/w1/info` matchnul public route, ne gameplay path `info` (které neexistuje, ale bezpečnost first).

### 4.4 FE — `WorldCard` dispatch link

**Existující komponenta** [`src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx`](../../src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx) (+ vesmíry, profil, …) dnes linkuje na `/svet/:id` napevno.

**Upgrade:** dispatch link podle membership.

```diff
+ const { data: myWorlds } = useMyWorlds();
+ const isMember = useMemo(() => {
+   const e = myWorlds?.find((m) => m.world.id === world.id);
+   return e && e.membership.role !== WorldRole.Zadatel;
+ }, [myWorlds, world.id]);
+ const linkTarget = isMember ? `/svet/${world.id}` : `/svet/${world.id}/info`;

- <Link to={`/svet/${world.id}`} className={s.card}>
+ <Link to={linkTarget} className={s.card}>
```

Pro **anon** je `useMyWorlds()` disabled (no token) → `myWorlds = undefined` → `isMember = false` → fallback `/info`. ✓

**Dotčené komponenty:**
- `DashboardPage/components/WorldCard.tsx`
- `DashboardPage/components/EventCard.tsx` (linkuje na svět z eventu)
- `WorldsPage` (vesmíry) — pravděpodobně používá `WorldCard` (ověř)
- `features/profile/components/WorldsSection.tsx`
- `IkarosLayout` sidebar (Moje světy + Veřejné světy) — pravděpodobně **NE**, sidebar je pro logged-in usera, jeho světy = member → `/svet/:id` je správně; veřejné světy = nečlen → musí být `/info`. **Ověř a uprav.**

**Pomocný hook** `useWorldLink(worldId)` v `features/world/hooks/`:
```ts
export function useWorldLink(worldId: string): string {
  const { data: myWorlds } = useMyWorlds();
  const isMember = useMemo(
    () => myWorlds?.some((m) => m.world.id === worldId && m.membership.role !== WorldRole.Zadatel),
    [myWorlds, worldId],
  );
  return isMember ? `/svet/${worldId}` : `/svet/${worldId}/info`;
}
```

Použití: `const to = useWorldLink(world.id);` → DRY pro všech ~5 míst.

### 4.5 FE — `WorldDetailPage` komponenta (public route)

**Struktura:**
```
src/features/world/pages/WorldDetailPage/
├── WorldDetailPage.tsx              ← orchestrator (loading/error/render)
├── WorldDetailPage.module.css
├── index.ts
├── components/
│   ├── WorldDetailHero.tsx          ← banner (imageUrl nebo gradient) + název + žánr
│   ├── WorldDetailMeta.tsx          ← chips: tóny, kostky, systém, kapacita
│   ├── WorldDetailDescription.tsx   ← popis (preserve newlines)
│   ├── WorldDetailOwner.tsx         ← avatar PJ + jméno + link na profil
│   ├── WorldDetailJoinCTA.tsx       ← Join button (5 stavů: anon/public/pending-request/member/closed)
│   ├── WorldDetailStats.tsx         ← počet hráčů / kapacita (volná místa)
│   ├── WorldDetailShareBar.tsx      ← top bar: Zpět + Sdílet (kopíruje `/info` URL)
│   └── *.module.css
├── hooks/
│   └── useJoinWorld.ts              ← POST /worlds/:id/join
└── __tests__/
    ├── WorldDetailPage.spec.tsx
    └── WorldDetailJoinCTA.spec.tsx
```

**Layout — standalone (žádný WorldLayout):**
- Vlastní top bar (back link `←` + název platformy „Ikaros" + Sdílet button vpravo).
- Žádné gameplay nav, žádný world drawer — to je úmyslné pro anon (nemá členství).
- Theme tokens stejné jako IkarosLayout (`var(--surface-1)` background).

### 4.5b FE — `WorldDashboardPage` upgrade (member welcome view)

**Soubor:** [`src/features/world/pages/WorldDashboardPage.tsx`](../../src/features/world/pages/WorldDashboardPage.tsx) — dnes 3 řádky stub, upgrade na cca 60 řádků.

**Obsah (minimal — fáze 4+ to přepracuje):**
```tsx
function WorldDashboardPage() {
  const { worldId, world } = useContext(WorldContext);
  return (
    <div className={s.welcome}>
      <header className={s.hero}>
        <h1>Vítej zpět v {world?.name}</h1>
        {world?.genre && <span className={s.genre}>{world.genre}</span>}
      </header>

      <section className={s.tiles}>
        <Tile to={`/svet/${worldId}/chat`}    icon="💬" label="Chat" />
        <Tile to={`/svet/${worldId}/stranky`} icon="📖" label="Stránky" />
        <Tile to={`/svet/${worldId}/mapa`}    icon="🗺️" label="Mapa" />
        <Tile to={`/svet/${worldId}/postavy`} icon="🎭" label="Postavy" />
      </section>

      <footer className={s.placeholder}>
        <p>Aktivita ve světě a kalendář událostí přibyde brzy.</p>
      </footer>
    </div>
  );
}
```

⚠️ **Pozor:** zde NEvolat `useWorld(worldId)` znovu — `WorldContext` (poskytovaný WorldLayoutem) už `world` má. Zabraňuje dvojímu fetch.

**WorldDetailHero (top, full-width):**
- Pozadí: `world.imageUrl` (pokud existuje) jako `background-image` + theme gradient overlay; jinak skin gradient `var(--accent-gradient)` nebo plain `var(--surface-2)`.
- Hlavička: `<h1>{world.name}</h1>` + `<span>{world.genre}</span>` (pill).
- Vpravo: `[Sdílet]` (clipboard kopírovat URL) + `[Spravovat]` (pouze owner/admin → link `/svet/:id/nastaveni`, placeholder 2.5).
- Mobile: výška 200px, desktop: 320px.

**WorldDetailMeta:**
- Chips řada: `🎲 {dice.join(', ')} · 🎭 {tones.length} tónů · ⚙ {system} · 👥 {playerCount}/{maxPlayers ?? '∞'}`.
- Sekce „Tóny" expand-on-click, ukáže `tones.map(t => <pill>{t}</pill>)`.
- Sekce „Hledám hráče" — pokud `playersWanted`, ukáže text v rámečku s ikonou `🪧`.

**WorldDetailDescription:**
- `<p>` (white-space: pre-wrap) s `world.description`.
- Empty state: „PJ zatím nepřidal popis světa."

**WorldDetailOwner:**
- Avatar + username + link `Link to={`/u/${owner.username}`}` (profil, fáze 1.1).
- Tooltip: „Vlastník světa (PJ)".
- Načítá se přes nový `GET /api/worlds/:id/owner` **NEBO** prostě populate v stávajícím `GET /api/worlds/:id` (přidat owner: { id, username, avatarUrl } do response).
- **Volba pro 2.4:** populate (jednodušší než extra endpoint).

**WorldDetailJoinCTA:**
- **Anon:** „Vstoupit" → otevře LoginModal s intent `?afterLogin=join&worldId=...`.
- **Logged-in, ne-member, public:** „Vstoupit" → `useJoinWorld.mutate()` → toast „Vstoupil/a jsi do {name}." → `navigate('/svet/' + id)` (welcome).
- **Logged-in, ne-member, open/private:** „Požádat o vstup" → `useJoinWorld.mutate()` → toast „Žádost odeslána, čekej na schválení PJ." → CTA přepne na disabled „Žádost odeslána".
- **Logged-in, Zadatel:** disabled „Žádost odeslána" + ikona ⏳.
- **Logged-in, Member (Hrac/PJ/PomocnyPJ):** primary CTA „Vstoupit do hry" → `navigate('/svet/' + id)`.
- **Closed:** disabled „Svět je uzavřen" + ikona 🔒.

💡 Member sem může přijít přes sdílený link — vidí Detail (stejně jako anon), ale CTA ho jedním klikem dovede do gameplay.

### 4.6 FE — `WorldJoinRequestRenderer`

**Soubor:** `src/features/world/components/WorldJoinRequestRenderer.tsx`

```tsx
export function WorldJoinRequestLeft({ item }: { item: WorldJoinRequestListItem }) {
  return (
    <div className={s.left}>
      <Avatar src={item.requester.avatarUrl} username={item.requester.username} />
      <strong>{item.requester.username}</strong>
    </div>
  );
}

export function WorldJoinRequestMid({ item }: { item: WorldJoinRequestListItem }) {
  return (
    <div className={s.mid}>
      žádá o vstup do světa{' '}
      <Link to={`/svet/${item.worldId}`} className={s.worldLink}>
        {item.worldName}
      </Link>
      <time>{formatRelative(item.requestedAt)}</time>
    </div>
  );
}

export function WorldJoinRequestActions({ item, onResolve, isLoading }) {
  const accept = useAcceptWorldJoinRequest();
  const reject = useRejectWorldJoinRequest();
  // … Přijmout / Odmítnout buttons s confirm modal pro Odmítnout
}
```

Registrace v `rendererRegistry.tsx`:
```diff
+ import {
+   WorldJoinRequestActions,
+   WorldJoinRequestLeft,
+   WorldJoinRequestMid,
+ } from '@/features/world/components/WorldJoinRequestRenderer';

  export const PENDING_ACTION_RENDERERS = {
    [PendingActionType.UsernameRequest]: ...,
    [PendingActionType.FriendRequest]: ...,
+   [PendingActionType.WorldJoinRequest]: worldJoinRequestRenderer,
  };
```

### 4.7 FE — hooks

**`useJoinWorld.ts`:**
```ts
export function useJoinWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<{ membership: WorldMembership }>(`/worlds/${worldId}/join`),
    onSuccess: (_, worldId) => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
      qc.invalidateQueries({ queryKey: ['worlds', worldId] });
    },
  });
}
```

**`useAcceptWorldJoinRequest.ts` / `useRejectWorldJoinRequest.ts`:**
```ts
export function useAcceptWorldJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worldId, membershipId }) =>
      api.post(`/worlds/${worldId}/join-requests/${membershipId}/accept`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}
```
(Reject analogicky `.../reject`.)

### 4.8 Vizuální vrstva

- **Žádné hardcoded barvy.** Reuse skin tokenů (`var(--surface-1)`, `var(--surface-2)`, `var(--frame-border)`, `var(--accent)`, …).
- **Hero gradient overlay:** `linear-gradient(180deg, rgba(0,0,0,0) 0%, var(--surface-1) 100%)` přes `imageUrl`.
- **Sticky CTA bar** dole na mobilu (analogie create-world): primary Join button + sekundární „Sdílet".
- **Loading state:** skeleton (hero placeholder + 3 lines text).
- **Error state:** „Svět nenalezen" + back link.
- Design audit (skill `frontend-design`) **bude spuštěn mezi schválením spec a impl. plánem** — viz workflow.

### 4.9 Mobile vs desktop

- Mobile (≤ 768 px):
  - Hero 200px výška.
  - Meta chips wrap, 1 chip per line v rozšířeném view.
  - CTA = sticky bottom bar.
- Tablet (769–1024 px):
  - Hero 280px.
  - Meta chips inline grid.
- Desktop (> 1024 px):
  - Hero 320px.
  - Layout: hero full-width, pak 2 sloupce (popis 2/3, meta+owner+CTA 1/3 sidebar sticky).

---

## 5. Out of scope

- **WorldDashboardPage reálný obsah** (calendar widget, recent events, online members) — pro 2.4 jen **minimální welcome view** (4 dlaždice + placeholder), real obsah fáze 4+.
- **WorldSettings link target** — `/svet/:id/nastaveni` je placeholder (řeší 2.5).
- **Sdílet button real flow** — pro 2.4 stačí `navigator.clipboard.writeText(window.location.origin + '/svet/' + worldId + '/info')` + toast. Žádný OG-image, žádný share-sheet.
- **Owner profil link** (`/u/:username`) — pokud profil page (1.1) neexistuje, link je dead-end → render owner jako plain text s tooltipem.
- **Live update join-requested events** (socket) — pro 2.4 stačí polling staleTime 30s (existující pattern v `usePendingActions`).
- **Pozvánky do private světa** (PJ pozve uživatele) — separate flow, ne 2.4.
- **Anon Join attempt resume** — anon klik na „Vstoupit" → LoginModal → po loginu **se NEaktivuje join automaticky**, user musí kliknout znovu. Dluh.
- **Member auto-redirect** z `/svet/:id` na jejich poslední visited child route — out of scope, welcome view stačí.
- **Audit log žádostí** — žádné perzistentní řešení odmítnutí (uživatel pošle znovu), žádný history. Dluh.
- **Limit počtu pending žádostí per user / per world** — žádný throttle. Dluh.

---

## 6. Acceptance kritéria

### BE
1. `WorldJoinRequestProvider implements IPendingActionProvider` registrován v `WorldsModule.onModuleInit`.
2. `countForUser(userId, role)` vrací sumu pending Zadatel memberships ve světech kde user = owner (+ Admin/Superadmin = cross-world).
3. `listForUser(...)` vrací paginované `WorldJoinRequestListItem[]` populated `requester` + `worldName`.
4. `POST /api/worlds/:worldId/join-requests/:membershipId/accept` — atomicky promote (Zadatel→Hrac) + increment `playerCount` + emit `world.join.accepted`. JWT, jen owner/admin.
5. `POST /api/worlds/:worldId/join-requests/:membershipId/reject` — delete membership + emit `world.join.rejected`. JWT, jen owner/admin.
6. `GET /api/worlds/:id` response **rozšířeno** o `owner: { id, username, avatarUrl }` (populate v service).
7. +5 BE testů: provider canHandle/count/list (3), accept (1), reject (1).
8. Existující testy zelené (`worlds.service.spec`, `pending-actions.service.spec`).

### FE — public Detail (`/svet/:worldId/info`)
9. Route `/svet/:worldId/info` accessible **bez auth** (žádný `requireAuth` loader, žádný WorldLayout).
10. Pořadí routes v `router.tsx`: `/svet/:worldId/info` definován **před** `/svet/:worldId` blokem.
11. `WorldDetailHero` renders: název, žánr, banner (imageUrl nebo gradient).
12. `WorldDetailMeta` chips: dice, tones (count + expand), system, players count.
13. `WorldDetailDescription` renders `world.description` s preserved newlines, empty state pokud null.
14. `WorldDetailOwner` shows owner avatar + username (populate z `world.owner`).
15. `WorldDetailJoinCTA` 5 stavů:
    - Anon → „Vstoupit" → otevře LoginModal.
    - Logged-in + ne-member + public → „Vstoupit" → mutation → toast success → navigate `/svet/:id` (welcome).
    - Logged-in + ne-member + open|private → „Požádat o vstup" → mutation → toast „Žádost odeslána" → CTA disabled „⏳ Žádost odeslána".
    - Logged-in + Zadatel → disabled „⏳ Žádost odeslána".
    - Closed → disabled „🔒 Svět je uzavřen".
    - **Bonus: Logged-in + member** → „Vstoupit do hry" → navigate `/svet/:id`.

### FE — member welcome (`/svet/:worldId` index)
16. `WorldDashboardPage` upgrade na welcome view: nadpis „Vítej zpět v {world.name}" + 4 dlaždice (Chat / Stránky / Mapa / Postavy) + footer placeholder.
17. Welcome view čerpá `world` z `WorldContext` (žádný extra fetch).
18. `WorldDashboardPage` zůstává index route v `WorldLayout` (chráněné, member-only).

### FE — link dispatch
19. `useWorldLink(worldId)` hook vrací `/svet/:id` pokud user je member (`role !== Zadatel`), jinak `/svet/:id/info`.
20. Dotčené karty: `DashboardPage/WorldCard`, `DashboardPage/EventCard`, `WorldsPage`, `profile/WorldsSection`, `IkarosLayout` sidebar (veřejné světy → `/info`). Všechny používají `useWorldLink`.

### FE — Zpracovat tab integrace
21. `useJoinWorld` mutation invaliduje `['worlds','my']` + `['worlds', worldId]`.
22. **ZpracovatTab — PJ owner**: vidí sekci „Žádosti o vstup do světa" s pending Zadatel kartami.
23. `WorldJoinRequestRenderer`:
    - Left: avatar + username žadatele.
    - Mid: „žádá o vstup do světa **{worldName}**" + relativní čas (link na `/svet/:id/info`).
    - Actions: Přijmout (zelený) + Odmítnout (s confirm modal).
24. Po Accept: pending card zmizí, `playerCount` se zvedne v Detail (po queryCache refresh).
25. Po Reject: pending card zmizí, requester při refreshi `/svet/:id/info` vidí znovu „Požádat o vstup" CTA.

### FE — UX & quality
26. Mobile (≤ 768 px): hero 200px, sticky CTA bar, meta chips wrap.
27. Žádný hardcoded barevný literál (`lint:colors` ✓).
28. Anon/nečlen pokus o `/svet/:id/chat` → existující `requireAuth` → login (beze změny).

### Build / lint / test
29. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
30. FE +~17 nových testů (WorldDetailPage 4, WorldDetailJoinCTA 5, WorldJoinRequestRenderer 3, useJoinWorld 2, useWorldLink 2, WorldDashboardPage welcome 1).
31. BE +5 testů (viz §AC 7).

---

## 7. Test plán

### BE
- `WorldJoinRequestProvider.canHandle`: PJ owner → true; běžný Hrac → false; Admin → true.
- `WorldJoinRequestProvider.countForUser`: 2 pending Zadatel ve 2 různých světech kde user = owner → 2.
- `WorldJoinRequestProvider.listForUser`: pagination, sortBy joinedAt DESC, populate requester.
- `POST /api/worlds/:id/join-requests/:membershipId/accept` integration: před = Zadatel + playerCount=3; po = Hrac + playerCount=4.
- `POST /api/worlds/:id/join-requests/:membershipId/reject` integration: před = Zadatel; po = neexistuje.

### FE
- `useJoinWorld` mutation (2): success invaliduje queries, error → propagate.
- `useWorldLink` hook (2): member → `/svet/:id`; non-member/anon → `/svet/:id/info`.
- `WorldDetailJoinCTA` (5 — viz AC 15).
- `WorldDetailPage` (4):
  - render world data smoke,
  - render pro anon (Login CTA),
  - render pro logged-in member („Vstoupit do hry"),
  - error state „nenalezen".
- `WorldDashboardPage` welcome (1): render dlaždic + nadpis.
- `WorldJoinRequestRenderer` (3): renderLeft/Mid/Actions Accept volá mutation; Reject otevře confirm modal.

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| `playerCount` desync (BE atomicita increment) | Nízká | Střední | Dedikovaný `accept` endpoint = jedna transakce; integration test. |
| Private/closed world detail leakuje data anonu | Nízká | Střední | BE `findById` zachovává existující auth-leak policy — anon vidí jen public/open světy, jinak 404 (viz [auth-leak-policy.md](../../../../Projekt-ikaros/.claude/rules/auth-leak-policy.md)). |
| Anon click „Vstoupit" → LoginModal → po loginu se neaktivuje join | Nízká | Nízká | Pro 2.4 bez resume; user klikne znovu. Dluh D-NEW-2.4-join-resume. |
| ZpracovatTab badge nepočítá WorldJoinRequest dokud není provider zaregistrován | Nízká | Nízká | Test `count` endpointu před deploy. |
| `WorldLayout` guard redirect loop (non-member → `/info` → klikne zpátky na `/svet/:id` → loop) | Nízká | Střední | Guard redirect používá `replace: true` (žádné history bobtnání); `/info` neredirektuje nikam. Smoke test. |
| `useWorldLink` špatně vrátí `/svet/:id` pro Zadatela → user uvidí login → /info | Nízká | Nízká | Hook explicitně filtruje `role !== Zadatel`; 2 unit testy v testovém plánu. |
| Pořadí routes v `router.tsx` (`/info` musí být před `/:worldId`) | Nízká | Vysoký | Smoke test po implementaci: navigace `/svet/w1/info` → WorldDetailPage, ne ErrorPage. |

**Rollback:** revert commitu. Změna je **plně aditivní** — gameplay routes netknuté, WorldLayout guard lze odstranit 5řádkovým revertem, BE provider odregistruje se odebráním `registerProvider` volání.

---

## 9. Otázky k autorovi

Žádné — všechny rozhodnuté 2026-05-14:

- **Architektura:** Volba **B (non-migrace)** — separátní public route `/svet/:id/info` mimo gameplay strukturu, žádná restructure existujících routes.
- **Member view:** minimální welcome (4 dlaždice + placeholder) — fáze 4+ to nahradí.
- **BE změny součástí 2.4** (provider + 2 resolve endpointy + owner populate).
- **`open` access mode** = stejný flow jako `private` (žádost, ne přímý vstup).

---

## 10. Mimo rozsah (samostatné fáze / kroky)

- 2.5 World settings (edit world, hero image upload, manage members, member kick)
- 4.x Real WorldDashboardPage obsah (recent events, online members, calendar widget)
- 1.1+ Profile page link (`/u/:username`)
- D-NEW-2.4-join-resume (anon click → login → auto-join po návratu)
- D-NEW-2.4-join-history (audit log odmítnutých žádostí, throttle re-request)
- D-NEW-2.4-member-landing (pro člena `/svet/:id` přesměrovat na poslední visited child route)
- D-NEW-2.4-share-og (OG image pro share link)
