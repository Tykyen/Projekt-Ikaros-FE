# Implementační plán 2.4 — Detail světa + join flow

**Status:** ✅ Implementováno
**Spec:** [spec-2.4.md](./spec-2.4.md)
**Větev:** `feat/krok-2.4-world-detail-join` (vznikne až po souhlasu)
**Odhad:** ~350 ř. BE + ~1000 ř. FE + ~400 ř. testů

---

## Pořadí kroků

Postup BE → FE, aby šlo průběžně testovat. Každá fáze končí commitem (lint + test ✓).

### Fáze A — BE základ (schema + DTO + service stub)

#### A1. Nová schema `WorldAccessRequest`

**Nový soubor:** `Projekt-ikaros/backend/src/modules/worlds/schemas/world-access-request.schema.ts` (~40 ř.)

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
  collection: 'world_access_requests',
  timestamps: { createdAt: 'requestedAt', updatedAt: false },
})
export class WorldAccessRequestSchemaClass {
  @Prop({ type: Types.ObjectId, ref: 'World', required: true, index: true })
  worldId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: Date.now })
  requestedAt: Date;
}

export type WorldAccessRequestDocument = HydratedDocument<WorldAccessRequestSchemaClass>;
export const WorldAccessRequestSchema = SchemaFactory.createForClass(WorldAccessRequestSchemaClass);

// Compound unique index: 1 pending request per (worldId, userId)
WorldAccessRequestSchema.index({ worldId: 1, userId: 1 }, { unique: true });
```

#### A2. Interface `WorldAccessRequestListItem`

**Refactor:** `Projekt-ikaros/backend/src/modules/worlds/interfaces/world-join-request.interface.ts` → rename na `world-access-request.interface.ts`:

```ts
export interface WorldAccessRequestListItem {
  accessRequestId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  requestedAt: string;
  requester: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}
```

#### A3. Registrace v `WorldsModule`

**Edit:** `Projekt-ikaros/backend/src/modules/worlds/worlds.module.ts`

- Přidat `MongooseModule.forFeature([{ name: WorldAccessRequestSchemaClass.name, schema: WorldAccessRequestSchema }])`
- Export `WorldAccessRequestProvider` (po refactoru v B2)

#### A4. Commit

```
feat(world): A. WorldAccessRequest schema + interface

- new MongoDB collection world_access_requests
- unique compound index (worldId, userId)
- rename WorldJoinRequest* → WorldAccessRequest*
```

---

### Fáze B — BE: service mutations + provider rename

#### B1. `worlds.service` — 6 nových metod

**Edit:** `Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts` (~150 ř.)

```ts
async joinPublic(worldId: string, userId: string): Promise<WorldMembership> {
  const world = await this.findById(worldId);
  if (world.accessMode !== 'public') throw new BadRequestException('WORLD_NOT_PUBLIC');
  const existing = await this.membershipsModel.findOne({ worldId, userId });
  if (existing) throw new ConflictException('ALREADY_MEMBER');
  const ar = await this.accessRequestsModel.findOne({ worldId, userId });
  if (ar) throw new ConflictException('PENDING_ACCESS_REQUEST');
  const membership = await this.membershipsModel.create({
    worldId, userId, role: WorldRole.Ctenar, joinedAt: new Date()
  });
  this.events.emit('world:membership:changed', { worldId, userId, role: WorldRole.Ctenar });
  return membership.toObject();
}

async requestAccess(worldId: string, userId: string): Promise<WorldAccessRequest> {
  const world = await this.findById(worldId);
  if (!['open', 'private'].includes(world.accessMode)) throw new BadRequestException('WRONG_MODE');
  const member = await this.membershipsModel.findOne({ worldId, userId });
  if (member) throw new ConflictException('ALREADY_MEMBER');
  try {
    const ar = await this.accessRequestsModel.create({ worldId, userId });
    this.events.emit('world:access-requested', {
      accessRequestId: ar._id.toString(),
      worldId, worldName: world.name, worldSlug: world.slug,
      requester: { id: userId, username: ..., avatarUrl: ... },
      requestedAt: ar.requestedAt.toISOString(),
      ownerId: world.ownerId.toString(),
    });
    return ar.toObject();
  } catch (e: any) {
    if (e.code === 11000) throw new ConflictException('PENDING_ACCESS_REQUEST');
    throw e;
  }
}

async cancelAccessRequest(worldId: string, userId: string): Promise<void> {
  const ar = await this.accessRequestsModel.findOneAndDelete({ worldId, userId });
  if (!ar) throw new NotFoundException('AR_NOT_FOUND');
  const world = await this.findById(worldId);
  this.events.emit('world:access-cancelled', {
    accessRequestId: ar._id.toString(), worldId, ownerId: world.ownerId.toString()
  });
}

async approveAccessRequest(requestId: string, approverId: string): Promise<WorldMembership> {
  const ar = await this.accessRequestsModel.findById(requestId);
  if (!ar) throw new NotFoundException('AR_NOT_FOUND');
  const world = await this.findById(ar.worldId.toString());
  await this.assertPjOrAdmin(world, approverId);

  // Atomická transakce: smaž AR + vytvoř membership.
  const session = await this.connection.startSession();
  let membership: WorldMembership;
  try {
    await session.withTransaction(async () => {
      await this.accessRequestsModel.deleteOne({ _id: ar._id }, { session });
      const m = await this.membershipsModel.create([{
        worldId: ar.worldId, userId: ar.userId, role: WorldRole.Ctenar, joinedAt: new Date()
      }], { session });
      membership = m[0].toObject();
    });
  } finally {
    await session.endSession();
  }

  this.events.emit('world:access-approved', {
    worldId: ar.worldId.toString(), worldName: world.name, worldSlug: world.slug,
    requesterId: ar.userId.toString(),
  });
  this.events.emit('world:membership:changed', {
    worldId: ar.worldId.toString(), userId: ar.userId.toString(), role: WorldRole.Ctenar
  });
  return membership!;
}

async rejectAccessRequest(requestId: string, rejecterId: string): Promise<void> {
  const ar = await this.accessRequestsModel.findById(requestId);
  if (!ar) throw new NotFoundException('AR_NOT_FOUND');
  const world = await this.findById(ar.worldId.toString());
  await this.assertPjOrAdmin(world, rejecterId);
  await this.accessRequestsModel.deleteOne({ _id: ar._id });
  this.events.emit('world:access-rejected', {
    worldId: ar.worldId.toString(), worldName: world.name,
    requesterId: ar.userId.toString(),
  });
}

async findMyAccessRequests(userId: string): Promise<MyWorldAccessRequest[]> {
  const ars = await this.accessRequestsModel.find({ userId }).lean();
  // Eager-load world summary pro každý AR
  return Promise.all(ars.map(async (ar) => ({
    accessRequest: ar,
    world: await this.worldsModel.findById(ar.worldId, 'id name slug accessMode').lean(),
  })));
}

// Helper:
private async assertPjOrAdmin(world: World, userId: string): Promise<void> {
  const user = await this.usersService.findById(userId);
  const isPj = world.ownerId.toString() === userId;
  const isAdmin = user.role <= UserRole.Admin;
  if (!isPj && !isAdmin) throw new ForbiddenException('NOT_AUTHORIZED');
}
```

#### B2. Refactor providera

**Rename:** `world-join-request.provider.ts` → `world-access-request.provider.ts`
**Změny:**
- Class `WorldJoinRequestProvider` → `WorldAccessRequestProvider`
- `type` getter vrací `'world_access_request'` (ne `'world_join_request'`)
- Implementace čte z `accessRequestsModel` místo `membershipsModel` s filtrem `role: Zadatel`
- Mapping na `WorldAccessRequestListItem`: `accessRequestId` = `_id.toString()` místo `membershipId`

#### B3. `WorldsModule` doplnit `EventEmitter`/Gateway

**Edit:** `worlds.module.ts` — injekce `EventEmitter2` nebo dedicated `WorldsGateway` (pattern z existujících `world:updated` eventů). Použít existující pattern.

#### B4. Commit

```
feat(world): B. service mutations (join, requestAccess, cancel, approve, reject)

- POST /worlds/:id/join → Ctenar membership (public only)
- POST /worlds/:id/access-request → AR (open/private only)
- DELETE /worlds/:id/access-request → cancel
- POST /worlds/:id/access-requests/:id/approve → atomic AR delete + Ctenar membership
- POST /worlds/:id/access-requests/:id/reject → AR delete
- GET /worlds/my-access-requests → pending AR with world summary
- WS: world:access-requested / approved / rejected / cancelled
- WorldJoinRequestProvider → WorldAccessRequestProvider
```

---

### Fáze C — BE: controller + private 404

#### C1. `worlds.controller` — 6 endpointů

**Edit:** `Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts` (~80 ř.)

```ts
@Post(':id/join')
@UseGuards(JwtAuthGuard)
joinPublic(@Param('id') id: string, @Req() req) {
  return this.service.joinPublic(id, req.user.id);
}

@Post(':id/access-request')
@UseGuards(JwtAuthGuard)
requestAccess(@Param('id') id: string, @Req() req) {
  return this.service.requestAccess(id, req.user.id);
}

@Delete(':id/access-request')
@UseGuards(JwtAuthGuard)
@HttpCode(204)
cancelAccessRequest(@Param('id') id: string, @Req() req) {
  return this.service.cancelAccessRequest(id, req.user.id);
}

@Post(':id/access-requests/:requestId/approve')
@UseGuards(JwtAuthGuard)
approveAccessRequest(@Param('requestId') requestId: string, @Req() req) {
  return this.service.approveAccessRequest(requestId, req.user.id);
}

@Post(':id/access-requests/:requestId/reject')
@UseGuards(JwtAuthGuard)
@HttpCode(204)
rejectAccessRequest(@Param('requestId') requestId: string, @Req() req) {
  return this.service.rejectAccessRequest(requestId, req.user.id);
}

@Get('my-access-requests')
@UseGuards(JwtAuthGuard)
myAccessRequests(@Req() req) {
  return this.service.findMyAccessRequests(req.user.id);
}
```

#### C2. Private 404 v `GET /worlds/:id`

**Edit:** `worlds.controller.ts` + `worlds.service.findById` — pokud `accessMode === 'private'` a `req.user` není member/Zadatel s pending AR/Admin → throw `NotFoundException`.

```ts
async findByIdScoped(id: string, requestingUserId: string | null): Promise<World> {
  const world = await this.worldsModel.findById(id).lean();
  if (!world) throw new NotFoundException();
  if (world.accessMode !== 'private') return world;

  if (!requestingUserId) throw new NotFoundException(); // anon = 404
  const isMember = await this.membershipsModel.exists({ worldId: id, userId: requestingUserId });
  const hasAr = await this.accessRequestsModel.exists({ worldId: id, userId: requestingUserId });
  const user = await this.usersService.findById(requestingUserId);
  const isAdmin = user.role <= UserRole.Admin;
  if (!isMember && !hasAr && !isAdmin) throw new NotFoundException();
  return world;
}
```

Volat z `GET /worlds/:id` controller handleru.

#### C3. Commit

```
feat(world): C. controller endpoints + private 404 scoping

- 6 new endpoints on worlds.controller
- GET /worlds/:id throws 404 for non-member non-AR-author on private worlds
```

---

### Fáze D — BE: testy

#### D1. `worlds.service.spec.ts` — 7 nových testů

**Edit:** `Projekt-ikaros/backend/src/modules/worlds/worlds.service.spec.ts` (~200 ř.)

- `joinPublic` happy → Ctenar membership; 400 non-public; 409 duplicate
- `requestAccess` happy → AR vznikne; 409 duplicate AR; 409 already-member
- `cancelAccessRequest` happy; 404 chybí AR
- `approveAccessRequest` happy → AR pryč + Ctenar membership; 403 non-PJ; 404 chybí AR
- `rejectAccessRequest` happy; 403 non-PJ
- `findMyAccessRequests` → pending AR s embedded world summary
- `findByIdScoped` (controller integration) → private 404 pro non-member

#### D2. Commit

```
test(world): D. service + controller tests for join/access flow (7 cases)
```

---

### Fáze E — FE: typy + hooks

#### E1. Typy

**Edit:** `src/shared/types/index.ts`:
```ts
export interface WorldAccessRequest {
  id: string;
  worldId: string;
  userId: string;
  requestedAt: string;
}

export interface MyWorldAccessRequest {
  accessRequest: WorldAccessRequest;
  world: Pick<World, 'id' | 'name' | 'slug' | 'accessMode'>;
}

export interface WorldAccessRequestListItem {
  accessRequestId: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  requestedAt: string;
  requester: { id: string; username: string; avatarUrl?: string };
}
```

**Edit:** `PendingActionType` union (najít aktuální definici a rozšířit):
```ts
type PendingActionType = 'friend_request' | 'world_access_request';
```

#### E2. Hooks — nový soubor `src/features/world/api/useWorldJoin.ts` (~80 ř.)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership, WorldAccessRequest } from '@/shared/types';

export function useJoinWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) => api.post<WorldMembership>(`/worlds/${worldId}/join`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}

export function useRequestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) => api.post<WorldAccessRequest>(`/worlds/${worldId}/access-request`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    },
  });
}

export function useCancelAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) => api.delete(`/worlds/${worldId}/access-request`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    },
  });
}

export function useApproveAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worldId, requestId }: { worldId: string; requestId: string }) =>
      api.post(`/worlds/${worldId}/access-requests/${requestId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useRejectAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worldId, requestId }: { worldId: string; requestId: string }) =>
      api.delete(`/worlds/${worldId}/access-requests/${requestId}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}
```

#### E3. `useMyAccessRequests` — `src/features/world/api/useMyAccessRequests.ts` (~20 ř.)

```ts
export function useMyAccessRequests() {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['worlds', 'my-access-requests'],
    queryFn: () => api.get<MyWorldAccessRequest[]>('/worlds/my-access-requests'),
    enabled: !!token,
    staleTime: 60_000,
  });
}
```

#### E4. `useWorldStatus` combinator — `src/features/world/api/useWorldStatus.ts` (~30 ř.)

```ts
export type WorldStatus = 'non-member' | 'pending-access' | 'member';

export function useWorldStatus(worldId: string): {
  status: WorldStatus;
  membership: WorldMembership | null;
  pendingAccessRequest: WorldAccessRequest | null;
  isLoading: boolean;
} {
  const my = useMyWorlds();
  const myAr = useMyAccessRequests();
  const membership = my.data?.find(w => w.world.id === worldId)?.membership ?? null;
  const pending = myAr.data?.find(r => r.world.id === worldId)?.accessRequest ?? null;
  const status: WorldStatus = membership ? 'member' : pending ? 'pending-access' : 'non-member';
  return { status, membership, pendingAccessRequest: pending, isLoading: my.isLoading || myAr.isLoading };
}
```

#### E5. Testy

**Nové soubory:**
- `src/features/world/api/__tests__/useJoinWorld.spec.ts` — 2 case (mutation calls, invaliduje key)
- `src/features/world/api/__tests__/useWorldStatus.spec.ts` — 2 case (member detected, pending detected)

#### E6. Commit

```
feat(world): E. FE types + hooks (join, access-request, cancel, status)

- WorldAccessRequest / WorldAccessRequestListItem types
- 5 mutation hooks + useMyAccessRequests query + useWorldStatus combinator
```

---

### Fáze F — FE: WorldLayout light/full split

#### F1. Edit `WorldLayout.tsx`

**Edit:** `src/app/layout/WorldLayout/WorldLayout.tsx` (~30 ř.)

```tsx
const { status, isLoading: statusLoading } = useWorldStatus(worldId);
const isMember = status === 'member';
const showFullNav = isMember || isGlobalAdmin;

return (
  <WorldContext.Provider value={ctxValue}>
    <div className={s.shell}>
      <header className={s.header}>
        <Link to="/" className={s.exitBtn}>EXIT</Link>
        <Link to={`/svet/${worldId}`} className={s.worldName}>
          {world?.name ?? '...'}
        </Link>
        {world?.genre && <span className={s.genreBadge}>{world.genre}</span>}

        {showFullNav && (
          <>
            <nav className={s.nav}>...</nav>
            <div className={s.actions}>...</div>
          </>
        )}
        {showFullNav && <button className={s.hamburger}>☰</button>}
      </header>
      {/* Drawer jen pro showFullNav */}
      <main><Outlet /></main>
    </div>
  </WorldContext.Provider>
);
```

#### F2. Sub-route guard — reuse `WorldMembershipGuard`

**Edit:** `src/app/router.tsx` — wrap všechny sub-routes (`chat`, `stranky`, `nova-stranka`, `edit`, `postavy`, `moje-postava`, `mapa`, `takticka-mapa`, `kalendar`, `timeline`, `pocasi`, `sprava-udalosti`, `pavucina`, `scenare`, `obchod`, `zvuky`, `prevodnik-men`, `nastaveni`, `skupiny`, `pravidla`, wiki catch-all) do `<WorldMembershipGuard minWorldRole={WorldRole.Ctenar} fallback={navigate(`/svet/:worldId`)}>`.

**Pokud `WorldMembershipGuard` má jen `fallbackGlobalRoles`:** zkontrolovat, jestli umí redirect fallback. Pokud ne, rozšířit nebo přidat `redirect` prop. Mrknout na D-053b spec.

#### F3. Testy

- `src/app/layout/WorldLayout/__tests__/WorldLayout.spec.tsx` — 2 case (light header pro non-member, full header pro member)

#### F4. Commit

```
feat(world): F. WorldLayout light/full header split

- non-member / pending-access vidí jen EXIT + název + accessMode badge
- member vidí plný header s navigací
- sub-routes chráněné WorldMembershipGuard(minWorldRole=Ctenar)
```

---

### Fáze G — FE: WorldDashboardPage rozvětvení + komponenty

#### G1. Adresářová struktura

**Nový adresář:** `src/features/world/pages/WorldDashboardPage/`

Stávající `src/features/world/pages/WorldDashboardPage.tsx` (stub) → smazat. Nahradit:

```
src/features/world/pages/WorldDashboardPage/
├── WorldDashboardPage.tsx
├── WorldDashboardPage.module.css
├── index.ts                       ← default export
└── __tests__/
    └── WorldDashboardPage.spec.tsx
```

#### G2. Orchestrator komponenta

**Nový soubor:** `WorldDashboardPage.tsx` (~60 ř.)

```tsx
import { useParams } from 'react-router-dom';
import { useWorld } from '@/features/world/api/useWorlds';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { WorldDetailHero } from '@/features/world/components/WorldDetailHero';
import { WorldDetailInfo } from '@/features/world/components/WorldDetailInfo';
import { JoinCTA } from '@/features/world/components/JoinCTA';
import { AccessRequestPending } from '@/features/world/components/AccessRequestPending';
import { MemberDashboardStub } from '@/features/world/components/MemberDashboardStub';
import { WorldNotFound } from '@/features/world/components/WorldNotFound';
import s from './WorldDashboardPage.module.css';

export default function WorldDashboardPage() {
  const { worldId = '' } = useParams<{ worldId: string }>();
  const { data: world, isLoading, isError } = useWorld(worldId);
  const { status, pendingAccessRequest } = useWorldStatus(worldId);

  if (isLoading) return <div className={s.skeleton}>…</div>;
  if (isError || !world) return <WorldNotFound />;

  return (
    <div className={s.page}>
      <WorldDetailHero world={world} />
      <div className={s.contentGrid}>
        <WorldDetailInfo world={world} />
        <aside className={s.ctaCol}>
          {status === 'non-member' && <JoinCTA world={world} />}
          {status === 'pending-access' && pendingAccessRequest && (
            <AccessRequestPending worldId={world.id} requestedAt={pendingAccessRequest.requestedAt} />
          )}
          {status === 'member' && <MemberDashboardStub worldId={world.id} />}
        </aside>
      </div>
    </div>
  );
}
```

#### G3. Komponenty `WorldDetailHero` + `WorldDetailInfo`

**Nový adresář:** `src/features/world/components/WorldDetailHero/`
- `WorldDetailHero.tsx` (~50 ř.): hero image (16:9), overlay s name + accessMode badge + genre

**Nový adresář:** `src/features/world/components/WorldDetailInfo/`
- `WorldDetailInfo.tsx` (~80 ř.): description prose + chips (tóny, kostky) + stats (playerCount/maxPlayers, owner) + playersWanted callout

#### G4. Komponenty `JoinCTA` + `AccessRequestPending`

**Nový adresář:** `src/features/world/components/JoinCTA/`
- `JoinCTA.tsx` (~70 ř.):
```tsx
export function JoinCTA({ world }: { world: World }) {
  const joinPublic = useJoinWorld();
  const requestAccess = useRequestAccess();
  const isPending = joinPublic.isPending || requestAccess.isPending;

  if (world.accessMode === 'public') {
    return (
      <div className={s.card}>
        <h3>Otevřený svět</h3>
        <p>Vstupem se staneš čtenářem světa.</p>
        <button
          className={s.primary}
          disabled={isPending}
          onClick={() => joinPublic.mutate(world.id, {
            onSuccess: () => toast.success(`Vstoupil jsi do světa ${world.name}.`),
          })}
        >
          {isPending ? 'Vstupuji…' : 'Vstoupit do světa →'}
        </button>
      </div>
    );
  }

  // open / private — žádost
  const accessLabel = world.accessMode === 'open' ? 'Veřejný se schválením' : 'Soukromý svět';
  const description = world.accessMode === 'open'
    ? 'Tento svět vyžaduje schválení PJ. Po žádosti počkej na odpověď.'
    : 'Soukromý svět. Po žádosti rozhodne PJ.';

  return (
    <div className={s.card}>
      <h3>{accessLabel}</h3>
      <p>{description}</p>
      <button
        className={s.primary}
        disabled={isPending}
        onClick={() => requestAccess.mutate(world.id, {
          onSuccess: () => toast.success('Žádost o vstup byla odeslána.'),
        })}
      >
        {isPending ? 'Odesílám…' : 'Požádat o vstup →'}
      </button>
    </div>
  );
}
```

**Nový adresář:** `src/features/world/components/AccessRequestPending/`
- `AccessRequestPending.tsx` (~50 ř.):
```tsx
export function AccessRequestPending({ worldId, requestedAt }: Props) {
  const cancel = useCancelAccessRequest();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formattedDate = new Date(requestedAt).toLocaleDateString('cs-CZ');

  return (
    <div className={s.card}>
      <div className={s.icon}>⏳</div>
      <h3>Žádost čeká na schválení</h3>
      <p>Podáno {formattedDate}. PJ světa o tvé žádosti byl informován.</p>
      <button className={s.secondary} onClick={() => setConfirmOpen(true)}>
        Zrušit žádost
      </button>
      {confirmOpen && (
        <ConfirmDialog
          title="Zrušit žádost?"
          message="Žádost se smaže. Můžeš poslat novou."
          onConfirm={() => cancel.mutate(worldId, {
            onSuccess: () => toast.info('Žádost zrušena.'),
          })}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
```

> 💡 **ConfirmDialog:** Najít existující v `src/shared/ui/`. Pokud neexistuje, použít `window.confirm()` jako MVP fallback (dluh **D-NEW-confirm-dialog**).

#### G5. `MemberDashboardStub` + `WorldNotFound`

**Nový adresář:** `src/features/world/components/MemberDashboardStub/`
- `MemberDashboardStub.tsx` (~60 ř.): grid karet s linky na sub-routes (Stránky, Postavy, Mapa, Kalendář, Chat, Settings-pokud-PJ)

**Nový adresář:** `src/features/world/components/WorldNotFound/`
- `WorldNotFound.tsx` (~30 ř.): friendly message + tlačítko zpět

#### G6. Testy

- `WorldDashboardPage.spec.tsx` — 4 case (non-member public, pending-access, member, WorldNotFound)
- `JoinCTA.spec.tsx` — 3 case (public/open/private renders + click triggers correct mutation)
- `AccessRequestPending.spec.tsx` — 2 case (renders date, cancel → mutation)

#### G7. Commit

```
feat(world): G. WorldDashboardPage 3-state rendering + components

- WorldDetailHero / WorldDetailInfo / JoinCTA / AccessRequestPending / MemberDashboardStub / WorldNotFound
- 4 stavy: non-member / pending-access / member / not-found
- useJoinWorld + useRequestAccess + useCancelAccessRequest wired
```

---

### Fáze H — FE: Zpracovat tab renderer

#### H1. `WorldAccessRequestRenderer`

**Nový adresář:** `src/features/world/components/WorldAccessRequestRenderer/`
- `WorldAccessRequestRenderer.tsx` (~70 ř.) — implementuje `PendingActionRenderer<WorldAccessRequestListItem>`

```tsx
export const WorldAccessRequestRenderer: PendingActionRenderer<WorldAccessRequestListItem> = ({ item }) => {
  const approve = useApproveAccessRequest();
  const reject = useRejectAccessRequest();
  const isPending = approve.isPending || reject.isPending;

  return (
    <div className={s.card}>
      <Avatar src={item.requester.avatarUrl} name={item.requester.username} />
      <div className={s.body}>
        <p>
          <strong>{item.requester.username}</strong> žádá o vstup do světa{' '}
          <Link to={`/svet/${item.worldId}`}>{item.worldName}</Link>
        </p>
        <time>{new Date(item.requestedAt).toLocaleString('cs-CZ')}</time>
      </div>
      <div className={s.actions}>
        <button
          className={s.primary}
          disabled={isPending}
          onClick={() => approve.mutate({ worldId: item.worldId, requestId: item.accessRequestId }, {
            onSuccess: () => toast.success(`Žádost přijata.`),
          })}
        >Přijmout</button>
        <button
          className={s.ghost}
          disabled={isPending}
          onClick={() => reject.mutate({ worldId: item.worldId, requestId: item.accessRequestId }, {
            onSuccess: () => toast.info('Žádost odmítnuta.'),
          })}
        >Odmítnout</button>
      </div>
    </div>
  );
};
```

#### H2. Registrace v `rendererRegistry`

**Edit:** `src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx`:
```diff
+ import { WorldAccessRequestRenderer } from '@/features/world/components/WorldAccessRequestRenderer';

  export const PENDING_ACTION_RENDERERS: Record<PendingActionType, PendingActionRenderer> = {
    friend_request: FriendRequestRenderer,
+   world_access_request: WorldAccessRequestRenderer,
  };
```

#### H3. Testy

- `WorldAccessRequestRenderer.spec.tsx` — 2 case (render + approve click + reject click)

#### H4. Commit

```
feat(world): H. WorldAccessRequestRenderer for Zpracovat tab

- new renderer + registration in rendererRegistry
- PJ vidí žádosti ve Zpracovat tabu
```

---

### Fáze I — FE: WS handlery

#### I1. `useWorldAccessEvents` hook

**Nový soubor:** `src/features/world/ws/useWorldAccessEvents.ts` (~70 ř.)

```ts
export function useWorldAccessEvents() {
  const qc = useQueryClient();
  const currentUser = useAtomValue(currentUserAtom);

  useWsEvent('world:access-requested', (payload: WsAccessRequestedPayload) => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    toast.info(`Nová žádost o vstup do ${payload.worldName}`);
  });

  useWsEvent('world:access-approved', (payload: WsAccessApprovedPayload) => {
    qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    toast.success(`Tvá žádost o vstup do ${payload.worldName} byla přijata.`);
  });

  useWsEvent('world:access-rejected', (payload: WsAccessRejectedPayload) => {
    qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    toast.info(`Tvá žádost o vstup do ${payload.worldName} byla odmítnuta.`);
  });

  useWsEvent('world:access-cancelled', () => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
  });
}
```

#### I2. Mount v root

**Edit:** root komponenta (IkarosLayout nebo App) — zavolat `useWorldAccessEvents()` jednou. Najít, kde je `useFriendRequestEvents` (pokud existuje) a přidat vedle.

#### I3. Commit

```
feat(world): I. WS handlers for world access events

- world:access-requested/approved/rejected/cancelled toasts + query invalidation
```

---

### Fáze J — Help page update + dluhy + roadmap

#### J1. Aktualizovat Help

Spustit skill `napoveda`. Sekce „Role" v Help page (3.6a, `RoleCards`):
- **Žadatel** popis: změnit z „Požádal o přístup do uzavřeného světa, čeká na PJ. Zatím není členem." na „Člen světa, čeká na přidělení postavy od PJ. (Funkční ve fázi 5+.)"
- Pre-membership stav („Žádost o vstup") — přidat poznámku k sekci „Vstup do světů" v tabu Stránky.

> ⚠️ Pokud aktualizace 3.6a popisu Žadatele matoucně koliduje s dnes hotovou stránkou — vyřešit oddělením: 3.6a popis = role po vstupu, 2.4 popis = pre-membership flow (= access request, mimo role).

#### J2. Aktualizace `roadmap-fe.md`

**Edit:** zaškrtnout krok 2.4:
```diff
- ### - [ ] 2.4 Detail světa + join flow (`/svet/:worldId`)
- - [ ] Informace o světě
- - [ ] Join tlačítko (public = přímé, private = žádost)
- - [ ] **Žádost o vstup do private světa** → queue typ `world_join_request` ...
+ ### - [x] 2.4 Detail světa + join flow (`/svet/:worldId`) ✅ (YYYY-MM-DD)
+ - [x] Informace o světě
+ - [x] Join tlačítko (public = přímé, open/private = žádost)
+ - [x] WorldAccessRequest entita + Zpracovat tab queue (`world_access_request`)
+ 
+ **Spec:** [spec-2.4.md](arch/phase-2/spec-2.4.md), **Plán:** [plan-2.4.md](arch/phase-2/plan-2.4.md)
+ 
+ **Mimo rozsah (samostatné fáze):**
+ - Žádost o postavu (Čtenář → Žadatel role upgrade) — fáze 5+
+ - Anon viewing — D-NEW-anon-world-detail
+ - Odejít ze světa — D-NEW-leave-world
+ - Promote Čtenář → Hráč — D-NEW-promote-role
```

#### J3. Dluhy

Použít skill `dluh` pro:
- D-NEW-character-request
- D-NEW-anon-world-detail
- D-NEW-leave-world
- D-NEW-promote-role
- D-NEW-world-invites
- D-NEW-bulk-pending
- D-NEW-confirm-dialog (pokud ConfirmDialog komponenta neexistuje)

#### J4. Commit

```
chore(world): J. roadmap + help + debts update

- roadmap 2.4 ✅
- help page: Žadatel popis upraven
- 7 new tracked debts
```

---

### Fáze K — Final validation

#### K1. Validation pipeline

V projektovém rootu (FE i BE separátně):

```powershell
# FE
npm run lint
npm run lint:colors
npx tsc --noEmit
npm run build
npm run test:run

# BE
cd ../Projekt-ikaros
npm run lint
npm run test
npm run build
```

Všechny musí projít.

#### K2. Skill `mobil-desktop`

Po dokončení UI vrstvy spustit skill `mobil-desktop` pro každou novou stránku:
- `/svet/:worldId` (member view)
- `/svet/:worldId` (non-member view)
- `/svet/:worldId` (pending-access view)
- Zpracovat tab s WorldAccessRequest kartou

#### K3. Smoke test manual

1. Vytvořit `public` svět seedem nebo přes 2.3 — non-member → vidí pre-join → vstoupit → member view.
2. Vytvořit `open` svět — non-member → požádat → AR vznikne → PJ approve ve Zpracovat → member view.
3. `private` svět — pokus jiného usera → 404. PJ pošle URL → AR funguje.
4. Cancel AR — zmizí ze Zpracovat tabu PJ.

#### K4. PR creation

Push branch + `gh pr create`. Title: `feat(world): krok 2.4 — detail světa + join flow`. Body podle template.

---

## Sumarizace souborů

### Backend (~12 souborů)

**Nové:**
1. `backend/src/modules/worlds/schemas/world-access-request.schema.ts`
2. `backend/src/modules/worlds/interfaces/world-access-request.interface.ts` (rename z world-join-request.interface.ts)
3. `backend/src/modules/worlds/world-access-request.provider.ts` (rename z world-join-request.provider.ts)

**Edited:**
4. `backend/src/modules/worlds/worlds.module.ts` — schema + provider registrace
5. `backend/src/modules/worlds/worlds.service.ts` — 6 nových metod
6. `backend/src/modules/worlds/worlds.controller.ts` — 6 endpointů + scoped findById
7. `backend/src/modules/worlds/worlds.service.spec.ts` — 7 nových testů
8. `Projekt-ikaros/docs/websocket-api.md` — 4 nové eventy

### Frontend (~20 souborů)

**Nové:**
1. `src/features/world/api/useWorldJoin.ts`
2. `src/features/world/api/useMyAccessRequests.ts`
3. `src/features/world/api/useWorldStatus.ts`
4. `src/features/world/api/__tests__/useJoinWorld.spec.ts`
5. `src/features/world/api/__tests__/useWorldStatus.spec.ts`
6. `src/features/world/ws/useWorldAccessEvents.ts`
7. `src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx`
8. `src/features/world/pages/WorldDashboardPage/WorldDashboardPage.module.css`
9. `src/features/world/pages/WorldDashboardPage/index.ts`
10. `src/features/world/pages/WorldDashboardPage/__tests__/WorldDashboardPage.spec.tsx`
11. `src/features/world/components/WorldDetailHero/` (.tsx + .module.css)
12. `src/features/world/components/WorldDetailInfo/` (.tsx + .module.css)
13. `src/features/world/components/JoinCTA/` (.tsx + .module.css + .spec.tsx)
14. `src/features/world/components/AccessRequestPending/` (.tsx + .module.css + .spec.tsx)
15. `src/features/world/components/MemberDashboardStub/` (.tsx + .module.css)
16. `src/features/world/components/WorldNotFound/` (.tsx + .module.css)
17. `src/features/world/components/WorldAccessRequestRenderer/` (.tsx + .module.css + .spec.tsx)

**Edited:**
18. `src/shared/types/index.ts` — typy + PendingActionType union
19. `src/app/router.tsx` — sub-route guards
20. `src/app/layout/WorldLayout/WorldLayout.tsx` — light/full split
21. `src/app/layout/WorldLayout/__tests__/WorldLayout.spec.tsx`
22. `src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx` — registrace
23. Root komponenta (IkarosLayout?) — mount `useWorldAccessEvents`
24. `docs/roadmap-fe.md` — zaškrtnutí 2.4
25. `docs/dluhy.md` — 7 nových dluhů
26. Help page sekce (3.6a Žadatel popis)

**Smazané:**
- `src/features/world/pages/WorldDashboardPage.tsx` (stub) — nahrazen složkou

---

## Validation gates

Před každým commitem:
- `npm run lint` ✓
- `npm run lint:colors` ✓ (žádné hardcoded barvy)
- `npx tsc --noEmit` ✓
- `npm run test:run` ✓ (jen relevantní suite — full ke konci)

Před PR:
- `npm run build` (FE + BE)
- Full `npm run test:run` (FE + BE)
- Smoke test podle K3
- `skill: mobil-desktop` ✓
- `skill: napoveda` ✓

---

## Rizika v plánu

1. **BE existující `WorldJoinRequestProvider`** — pokud je už registrovaný a používaný, refactor (rename) může vyžadovat opatrný diff. **Mitigace:** grep `world_join_request` napříč BE + FE před commit.
2. **`WorldMembershipGuard`** — pokud nepodporuje redirect fallback, musíme ho rozšířit (D-053b). **Mitigace:** přečíst spec D-053b a komponentu nejprve, případně doplnit `redirectTo` prop.
3. **MongoDB transakce** — vyžaduje replica set / standalone s replSet. **Mitigace:** ověřit, že dev MongoDB má replicu (Mongoose `session.withTransaction` na standalone Mongo selže). Fallback: sekvenční operace + cleanup (méně bezpečné, ale OK pro MVP).
4. **`ConfirmDialog` komponenta** — nemusí existovat. Použít `window.confirm` fallback, sledovat jako dluh.
5. **WS `useWsEvent` API** — předpoklad existence z fáze 1.5/1.4. Pokud má jiný shape, adaptovat.

---

## Odhady času (LLM)

| Fáze | Obsah | Odhad |
|---|---|---|
| A | BE schema + interface + module registrace | 15 min |
| B | BE service mutations (6 metod) | 60 min |
| C | BE controller + private 404 | 30 min |
| D | BE testy (7) | 45 min |
| E | FE typy + hooks (5 + status combinator) | 45 min |
| F | WorldLayout split + guards | 30 min |
| G | WorldDashboardPage + 6 komponent | 90 min |
| H | Zpracovat renderer + registrace | 30 min |
| I | WS handlers | 20 min |
| J | Help + roadmap + dluhy | 30 min |
| K | Validation + smoke + PR | 30 min |
| **Total** | | **~7 h** |

Reálně to bude víc kvůli debug + lint fixes + iterace s tebou. Realistický odhad: **1–2 pracovní dny** kalendářní.
