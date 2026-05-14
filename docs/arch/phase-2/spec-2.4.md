# Spec 2.4 — Detail světa + join flow (`/svet/:worldId`)

**Status:** Draft — čeká na schválení (verze 2 — sémantika rolí přepracována dle PJ)
**Rozsah:** FE (pre-join detail view + member dashboard split + 5 mutation hooků + WorldAccessRequest renderer) + BE (nová entita `WorldAccessRequest` + 5 endpointů + 4 WS eventy + úprava existujícího providera)
**Větev:** `feat/krok-2.4-world-detail-join`
**Velikost:** ~20 FE souborů (~1000 ř.) + ~12 BE souborů (~350 ř.)
**Autor:** PJ + Claude
**Datum:** 2026-05-14
**Souvisí:** [spec-2.2.md](./spec-2.2.md), [spec-2.3.md](./spec-2.3.md), [spec-1.4](../phase-1/spec-1.4.md), [spec-3.6a-role-matrix.md](../phase-3/spec-3.6a-role-matrix.md) (sémantika rolí)

---

## 1. Cíl

📚 **Klíčový posun proti původnímu draftu:** Žadatel **není** pre-membership stav. Žadatel je člen světa, který čeká na **přidělení postavy** od PJ (upgrade Čtenář → Žadatel = „chci hrát"). Pre-membership entita = nová samostatná `WorldAccessRequest` (mimo `world_memberships`).

Logged-in uživatel může na `/svet/:worldId` vidět **detail světa** a podle access mode + svého statusu interagovat:

- **Non-member, žádná pending access request** (= nemá ani `WorldMembership`, ani `WorldAccessRequest`):
  - `public` → tlačítko „Vstoupit do světa" → okamžitý join, vznikne `WorldMembership` s rolí **Čtenář (1)**.
  - `open` → tlačítko „Požádat o vstup" → vznikne **`WorldAccessRequest`** (pre-membership entita), PJ vidí žádost ve Zpracovat tabu. Uživatel **zatím není člen**.
  - `private` → totéž co `open`, ale detail je dostupný jen přes přímý URL (skryto v listingu — řeší 2.2).
- **Non-member, has pending `WorldAccessRequest`**: info banner „Tvá žádost o vstup čeká na schválení PJ" + tlačítko „Zrušit žádost".
- **Member** (`Čtenář / Žadatel / Hráč / Korektor / PomocnyPJ / PJ`): zobrazí se **member dashboard stub** (rozšíření současného `WorldDashboardPage`). Plný dashboard = pozdější fáze.
- **PJ vlastník**: jako member + odkaz „Upravit svět" → `/svet/:id/nastaveni` (2.5, mimo rozsah).

**Žádost o postavu** (Čtenář → Žadatel jako role) = **out of scope 2.4**, řeší fáze 5+ (světová vrstva). 2.4 jen zavádí entitu access requestu pro vstup do open/private světů.

Stránka je **jediná route** `/svet/:worldId` — WorldLayout se větví:
- non-member nebo non-member-s-access-requestem → **light header** (EXIT + název, žádná nav).
- member (libovolná role 0–5) → plný header s navigací.

---

## 2. Kontext / motivace

- Roadmap 2.4 = poslední krok fáze 2 (světy). Bez něj se uživatel po vytvoření světa (2.3) dostane na 404/stub a nemá kde do cizího světa vstoupit.
- 2.3 byla schválena s accessMode triádou `public / open / private`. 2.4 oživuje sémantiku.
- 3.6a (role matrix, schváleno 2026-05-13) definuje **Žadatel = pre-membership stav, není člen**. Současný BE `WorldJoinRequestProvider` má v interface `membershipId` field → modeluje membership s rolí Zadatel = **nekonzistentní s aktualizovanou sémantikou (PJ 2026-05-14)**: Žadatel je už člen, čeká na postavu. 2.4 to opraví zavedením samostatné `WorldAccessRequest` entity.
- BE má **rozpracovaný** `WorldJoinRequestProvider` + `WorldJoinRequestListItem`. 2.4:
  - Přejmenuje provider na `WorldAccessRequestProvider` + interface na `WorldAccessRequestListItem`.
  - Zavede novou MongoDB kolekci `world_access_requests` `{ id, worldId, userId, requestedAt }`.
  - Nahradí `membershipId` v interface za `accessRequestId`.
- FE má `usePendingActions(type)` + `rendererRegistry`. Stačí přidat 1 renderer + nový typ `world_access_request`.
- WorldLayout dnes drží navigaci pro `/svet/:worldId/*`. Index route je stub. 2.4 oba větve naplní obsahem.

---

## 3. Audit současného stavu

### BE
- [`worlds.controller.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts) — má `GET /worlds`, `GET /worlds/my`, `GET /worlds/:id`, `GET /worlds/slug/:slug`. **Chybí** mutations pro join/access-request/cancel/approve/reject.
- [`worlds.service.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts) — má `create`, `findAll`, `findById`. **Chybí** `joinPublic`, `requestAccess`, `cancelAccessRequest`, `approveAccessRequest`, `rejectAccessRequest`.
- [`world-membership.schema.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world-membership.schema.ts) — separate kolekce. **Předpoklad ověřit:** field `role: WorldRole`, `worldId`, `userId`, `createdAt`. Pokud něco chybí, doplníme.
- [`world-join-request.provider.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/world-join-request.provider.ts) — provider existuje, ale modeluje **špatnou entitu** (`membershipId` field → modeluje membership s rolí Zadatel). **2.4 ho přejmenuje** na `WorldAccessRequestProvider` a změní interface (`accessRequestId` místo `membershipId`).
- **Chybí nová schema:** `world-access-request.schema.ts` (MongoDB kolekce `world_access_requests`) s polei `{ _id, worldId, userId, requestedAt }`, **unique index na `(worldId, userId)`** (uživatel nemůže mít 2 souběžné požadavky do stejného světa).
- [`pending-actions.controller.ts`](../../../../Projekt-ikaros/backend/src/modules/pending-actions/pending-actions.controller.ts) — generic endpoint. **Mutations approve/reject:** kde žijí? Pravděpodobně per-feature endpoint (analogicky friend requests). Ověřit.
- **WS:** `world:updated`, `world:deleted`, `world:membership:changed` existují. **Chybí** `world:access-requested`, `world:access-approved`, `world:access-rejected`, `world:access-cancelled`.

### FE
- [`src/app/router.tsx:146`](../../src/app/router.tsx) — `/svet/:worldId` → `<WorldLayout>` → `<WorldDashboardPage>` (index, stub).
- [`src/app/layout/WorldLayout/WorldLayout.tsx`](../../src/app/layout/WorldLayout/WorldLayout.tsx) — plný header s navigací, `isPJ` check; **nemá** rozlišení member vs non-member.
- [`src/features/world/pages/WorldDashboardPage.tsx`](../../src/features/world/pages/WorldDashboardPage.tsx) — 3 řádkový stub.
- [`src/features/world/api/useWorlds.ts`](../../src/features/world/api/useWorlds.ts) — `useWorld(id)`, `useMyWorlds`, `usePublicWorlds`. **Chybí** mutation hooky pro join/access-request flow.
- `usePendingActions(type, page, limit)` — funguje.
- [`rendererRegistry.tsx`](../../src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx) — Record<PendingActionType, Renderer>. **Chybí** `world_access_request` typ + renderer.
- `PendingActionType` enum — nutno rozšířit o `'world_access_request'` (kde žije: nejspíš `src/shared/types/index.ts` nebo `src/features/users/api/`).
- **`useMyWorlds` zůstává beze změny** — vrací jen memberships (Čtenář+). Pending access requesty current usera musí jít přes nový hook `useMyAccessRequests()` (BE endpoint `GET /worlds/my-access-requests`).

---

## 4. Návrh řešení

### 4.1 BE — nová entita + endpointy

**Nová MongoDB kolekce `world_access_requests`:**

```ts
// backend/src/modules/worlds/schemas/world-access-request.schema.ts
@Schema({ collection: 'world_access_requests', timestamps: { createdAt: 'requestedAt', updatedAt: false } })
export class WorldAccessRequestSchemaClass {
  @Prop({ type: Types.ObjectId, ref: 'World', required: true, index: true }) worldId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ default: Date.now }) requestedAt: Date;
}

// Compound unique index: jeden user může mít max 1 pending request per svět.
WorldAccessRequestSchema.index({ worldId: 1, userId: 1 }, { unique: true });
```

**Existující `world-join-request.provider.ts` → přejmenovat na `world-access-request.provider.ts`:**
- Provider čte z `world_access_requests` (ne z `world_memberships`).
- Type string: `'world_access_request'` (ne `'world_join_request'`).
- Interface `WorldAccessRequestListItem`:
  ```ts
  {
    accessRequestId: string;
    worldId: string;
    worldName: string;
    worldSlug: string;
    requestedAt: string;
    requester: { id: string; username: string; avatarUrl?: string };
  }
  ```
- Scope (beze změny logiky): Admin/SA = všechny, PJ = jen vlastní světy, ostatní = [].

**Nové endpointy na `worlds.controller`:**

| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| `POST` | `/worlds/:id/join` | — | `WorldMembership` (role **Čtenář**) | JWT, jen `accessMode === 'public'` (jinak 400) |
| `POST` | `/worlds/:id/access-request` | — | `WorldAccessRequest` | JWT, jen `accessMode in ['open','private']` (jinak 400) |
| `DELETE` | `/worlds/:id/access-request` | — | `204` | JWT, vlastní pending request musí existovat |
| `POST` | `/worlds/:id/access-requests/:requestId/approve` | — | `WorldMembership` (role **Čtenář**) | JWT + PJ světa (+ Admin/SA bypass) |
| `POST` | `/worlds/:id/access-requests/:requestId/reject` | — | `204` | JWT + PJ světa (+ Admin/SA bypass) |
| `GET` | `/worlds/my-access-requests` | — | `WorldAccessRequest[]` (s eager-loaded `world` summary pro FE label) | JWT |

**Logika `worlds.service`:**

```ts
async joinPublic(worldId, userId): WorldMembership {
  // 1) Načti world, ověř accessMode === 'public' (jinak 400 NOT_PUBLIC)
  // 2) Ověř, že membership neexistuje (jinak 409 ALREADY_MEMBER)
  // 3) Ověř, že access-request neexistuje (jinak — divný stav, ale 409 ALREADY_REQUESTED — public by neměl mít AR; defenzivní)
  // 4) Vytvoř membership { role: Čtenář }
  // 5) WS broadcast 'world:membership:changed'
}

async requestAccess(worldId, userId): WorldAccessRequest {
  // 1) Načti world, ověř accessMode in ['open','private'] (jinak 400 WRONG_MODE)
  // 2) Ověř absenci membershipu (jinak 409 ALREADY_MEMBER)
  // 3) Vytvoř access request (unique index → 409 ALREADY_REQUESTED při duplicitě)
  // 4) WS targeted na PJ světa: 'world:access-requested' + payload
}

async cancelAccessRequest(worldId, userId): void {
  // 1) Najdi access request {worldId, userId}, 404 pokud chybí
  // 2) Smaž
  // 3) WS targeted na PJ: 'world:access-cancelled'
}

async approveAccessRequest(requestId, approverId): WorldMembership {
  // 1) Načti access request → 404 pokud chybí
  // 2) Ověř, approverId je PJ tohoto světa (nebo Admin/SA bypass), jinak 403
  // 3) Transakce:
  //    a) Smaž access request
  //    b) Vytvoř membership { role: Čtenář }
  // 4) WS targeted na requestera: 'world:access-approved'
  // 5) WS broadcast: 'world:membership:changed'
}

async rejectAccessRequest(requestId, rejecterId): void {
  // 1) Načti AR → 404 pokud chybí
  // 2) Ověř PJ scope, jinak 403
  // 3) Smaž AR
  // 4) WS targeted na requestera: 'world:access-rejected'
}

async findMyAccessRequests(userId): Array<{ accessRequest, world: { id, name, slug, accessMode } }> {
  // GET /worlds/my-access-requests — vrací pending AR current usera s embedded summary světa
  // (kvůli FE label „Žádost o vstup do {worldName} čeká" na detail page i mimo).
}
```

> 💡 **Důvod transakce v approve:** Smazat AR a vytvořit membership atomicky, jinak race s duplicitním approve dvěma PJ paralelně by mohl skončit dvojím membershipem nebo AR bez membershipu. MongoDB session/multi-doc transaction.

**WS eventy — nové specifické (přidat do `websocket-api.md`):**

| Event | Payload | Cíl |
|---|---|---|
| `world:access-requested` | `{ accessRequestId, worldId, worldName, worldSlug, requester: {id, username, avatarUrl}, requestedAt }` | PJ světa (room `user:<ownerId>`) |
| `world:access-approved` | `{ worldId, worldName, worldSlug }` | Requester (room `user:<userId>`) |
| `world:access-rejected` | `{ worldId, worldName }` | Requester (room `user:<userId>`) |
| `world:access-cancelled` | `{ accessRequestId, worldId }` | PJ světa (room `user:<ownerId>`) |

📚 **Proč specifické eventy, ne reuse `world:membership:changed`:** UX FE potřebuje různé toasty pro různé akce:
- requested → PJ: „Nová žádost o vstup do **{worldName}**"
- approved → žadatel: „Tvá žádost o vstup do **{worldName}** byla přijata"
- rejected → žadatel: „Tvá žádost o vstup do **{worldName}** byla odmítnuta"
- cancelled → PJ: badge count se sníží (bez toastu — PJ to neudělal)

Konzistence s friend requests (1.4 = `friend:request-received`, `friend:request-accepted`, ...).

### 4.2 FE — typy

`PendingActionType` rozšířit:
```ts
+ | 'world_access_request'
```

`WorldAccessRequest` typ (FE mirror BE schema):
```ts
export interface WorldAccessRequest {
  id: string;
  worldId: string;
  userId: string;
  requestedAt: string;
}

export interface MyWorldAccessRequest {
  accessRequest: WorldAccessRequest;
  world: { id: string; name: string; slug: string; accessMode: World['accessMode'] };
}
```

`WorldAccessRequestListItem` (Zpracovat tab):
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

### 4.3 FE — mutation hooky

`src/features/world/api/useWorldJoin.ts`:
```ts
export function useJoinWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<WorldMembership>(`/worlds/${worldId}/join`),
    onSuccess: (_, worldId) => {
      qc.invalidateQueries({ queryKey: ['worlds', worldId] });
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}

export function useRequestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.post<WorldAccessRequest>(`/worlds/${worldId}/access-request`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    },
  });
}

export function useCancelAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      api.delete(`/worlds/${worldId}/access-request`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'my-access-requests'] });
    },
  });
}

// Pro Zpracovat tab (PJ akce):
export function useApproveAccessRequest() { /* POST .../:requestId/approve */ }
export function useRejectAccessRequest()  { /* POST .../:requestId/reject  */ }
```

`src/features/world/api/useMyAccessRequests.ts` — **nový hook**, BE endpoint `GET /worlds/my-access-requests`:
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

`src/features/world/api/useWorldStatus.ts` — **derive helper** (ne hook query, ale combinator):
```ts
type WorldStatus = 'non-member' | 'pending-access' | 'member';

export function useWorldStatus(worldId: string): {
  status: WorldStatus;
  membership: WorldMembership | null;
  pendingAccessRequest: WorldAccessRequest | null;
} {
  const { data: myWorlds } = useMyWorlds();
  const { data: myRequests } = useMyAccessRequests();
  const membership = myWorlds?.find(w => w.world.id === worldId)?.membership ?? null;
  const pending = myRequests?.find(r => r.world.id === worldId)?.accessRequest ?? null;
  const status: WorldStatus = membership ? 'member' : pending ? 'pending-access' : 'non-member';
  return { status, membership, pendingAccessRequest: pending };
}
```

> 💡 **Důvod `useWorldStatus`:** Jediný zdroj pravdy pro JoinCTA + WorldLayout + sub-route guard. Místo žonglování 3 hooky v každé komponentě.

### 4.4 FE — stránka & layout

**WorldLayout — větvení:**
```tsx
const { worldId = '' } = useParams<{ worldId: string }>();
const { data: world } = useWorld(worldId);
const { status } = useWorldStatus(worldId); // 'non-member' | 'pending-access' | 'member'
const isMember = status === 'member';

return (
  <div className={s.shell}>
    {isMember ? <FullHeader … /> : <LightHeader world={world} />}
    <main><Outlet /></main>
  </div>
);
```

`LightHeader` = jen `EXIT` button (← zpět na `/`) + název světa + accessMode badge, žádná nav. Žádné PJ akce. Žádný `+ Nová stránka`.

**Sub-route guard:** všechny sub-routes (`/svet/:id/chat`, `/stranky`, atd.) → wrapper `<WorldMembershipGuard minRole={WorldRole.Ctenar}>` (znovupoužití z D-053b s `minWorldRole={Ctenar}`). Non-member nebo pending-access se redirectne na `/svet/:id` (index = pre-join view).

**WorldDashboardPage — re-purpose:**

```tsx
export default function WorldDashboardPage() {
  const { worldId } = useParams();
  const { data: world, isLoading, isError } = useWorld(worldId);
  const { status, pendingAccessRequest } = useWorldStatus(worldId);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !world) return <WorldNotFound />;

  return (
    <div className={s.page}>
      <WorldDetailHero world={world} />
      <WorldDetailInfo world={world} />

      {status === 'non-member' && <JoinCTA world={world} />}
      {status === 'pending-access' && <AccessRequestPending worldId={world.id} requestedAt={pendingAccessRequest!.requestedAt} />}
      {status === 'member' && <MemberDashboardStub worldId={world.id} />}
    </div>
  );
}
```

### 4.5 FE — komponenty

```
src/features/world/components/
├── WorldDetailHero/
│   ├── WorldDetailHero.tsx        ← image, name, accessMode badge, genre
│   └── *.module.css
├── WorldDetailInfo/
│   ├── WorldDetailInfo.tsx        ← description, tones chips, dice chips, system, playerCount, playersWanted, owner
│   └── *.module.css
├── JoinCTA/
│   ├── JoinCTA.tsx                ← větví: public→useJoinWorld, open/private→useRequestAccess
│   └── *.module.css
├── AccessRequestPending/
│   ├── AccessRequestPending.tsx   ← banner „Žádost čeká, podáno {dd. mm. yyyy}" + useCancelAccessRequest
│   └── *.module.css
├── MemberDashboardStub/
│   └── MemberDashboardStub.tsx    ← „Vítej zpět! [linky na sekce světa]" — minimální MVP
└── WorldNotFound/
    └── WorldNotFound.tsx          ← 404 fallback (private nebo neexistuje)
```

### 4.6 FE — WorldAccessRequestRenderer (Zpracovat tab)

`src/features/world/components/WorldAccessRequestRenderer/WorldAccessRequestRenderer.tsx`:

- Karta s `requester.avatarUrl + username`, label „Žádá o vstup do světa **{worldName}**", tlačítka **Přijmout** / **Odmítnout**.
- Mutation hooky `useApproveAccessRequest(requestId)` a `useRejectAccessRequest(requestId)` — POST endpointy z 4.1.
- Po success: invalidate `pending-actions` query + toast „Přijato"/„Odmítnuto".

Zaregistrovat v [`rendererRegistry.tsx`](../../src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx) pod `world_access_request`.

### 4.7 WS handlery

`src/features/world/ws/useWorldAccessEvents.ts` — singleton hook (volá se v root komponentě App nebo IkarosLayoutu):

- `world:access-requested` → invalidate `['pending-actions', 'world_access_request']` + toast „Nová žádost o vstup do **{worldName}**" (jen pokud PJ vlastní svět — payload obsahuje worldId).
- `world:access-approved` → invalidate `['worlds', 'my-access-requests']` + `['worlds', 'my']` + toast „Tvá žádost o vstup do **{worldName}** byla přijata".
- `world:access-rejected` → invalidate `['worlds', 'my-access-requests']` + toast „Tvá žádost o vstup do **{worldName}** byla odmítnuta".
- `world:access-cancelled` → invalidate `['pending-actions', 'world_access_request']` (badge update).

### 4.8 Vizuální vrstva

Reuse skin tokenů — žádné hardcoded barvy. Pattern z `WorldCard` (hero image + accessMode chip + genre badge).

- `WorldDetailHero` = full-width banner s `var(--surface-2)` pozadím, hero image (16:9 nebo placeholder), overlay s názvem + accessMode badge.
- `WorldDetailInfo` = 2col desktop / 1col mobile. Levý sloupec = description + playersWanted. Pravý = stats (žánr, systém, kostky chips, tóny chips, playerCount / maxPlayers, owner username).
- `JoinCTA` = sticky-bottom card s primary tlačítkem. Public → `Vstoupit do světa`, open/private → `Požádat o vstup`. Loading state, disabled při mutation pending.
- `AccessRequestPending` = info card s `var(--accent)` border, ikona ⏳, text „Tvá žádost čeká na schválení PJ. (Podáno {dd.mm.yyyy})", secondary tlačítko `Zrušit žádost` (s confirm dialog).
- `MemberDashboardStub` = grid karet (Stránky / Postavy / Mapa / Kalendář / Chat / Settings-pokud-PJ) → linky na sub-routes.

⚠️ **Mobile (≤ 768 px):** Hero menší (200 px výška), info-grid 1col, sticky CTA bar full-width na bottomu obrazovky.

### 4.9 Auth & viditelnost

- Route `/svet/:worldId` zůstává **logged-in only** (`requireAuth` loader).
- `GET /worlds/:id` BE vrací `World` pro:
  - `public` / `open` → kdokoliv logged-in.
  - `private` → členové + uživatelé s pending `WorldAccessRequest` na tom světě + Admin/SA. Ostatní logged-in dostanou **404** (ne 403, ať se neprozradí existence).
- 404 case → `<WorldNotFound>` (přátelská hláška „Tento svět neexistuje nebo k němu nemáš přístup", tlačítko zpět).

📚 **Proč 404 ne 403:** Soukromý svět nemá nikomu kromě členů prozradit, že vůbec existuje. Konzistentní s GitHub private repos.

📚 **Proč žadatel (s pending AR) také vidí detail:** Aby viděl banner „Žádost čeká" a měl možnost ji zrušit. Bez detail viewu by žadatel nemohl status sledovat.

---

## 5. Out of scope

- **„Chci postavu" upgrade Čtenář → Žadatel (role)** — in-world akce „Žádám PJ o postavu". Řeší fáze 5+ (světová vrstva), dluh **D-NEW-character-request**.
- **Anon přístup k public/open detailu** — celá `/svet/:worldId` zůstává `requireAuth`. Dluh **D-NEW-anon-world-detail**.
- **Odejít ze světa** pro stávajícího Čtenář+ člena — dluh **D-NEW-leave-world** (2.5 nebo později).
- **Promote Čtenář → Hráč** (PJ ručně přidělí postavu) — dluh **D-NEW-promote-role**, řeší 2.5 (`WorldSettings`) + fáze 5+ (character flow).
- **Hero image upload pro svět** — 2.5.
- **Edit světa (PJ akce „Upravit svět")** — link na `/svet/:id/nastaveni` jen jako placeholder, 2.5 doplní obsah.
- **Member dashboard plný obsah** (statistiky, recent activity, oblíbené stránky) — fáze 7+.
- **Pozvánky** (PJ → uživatel link/email) — fáze 8+.
- **Bulk approve/reject** v Zpracovat tabu — out of scope.
- **`closed` access mode** v UI — interní stav (PJ zavřel svět), zobrazí se v member dashboardu jako banner „Svět je zavřený, žádné nové vstupy". Detail pro non-member chová se jako `private`.

---

## 6. Acceptance kritéria

### BE
1. Nová MongoDB kolekce `world_access_requests` se schematem `{ worldId, userId, requestedAt }` + unique compound index `(worldId, userId)`.
2. `POST /worlds/:id/join` vytvoří membership s rolí **Čtenář** pro public svět; 400 pro non-public, 409 pro duplicate membership.
3. `POST /worlds/:id/access-request` vytvoří `WorldAccessRequest` pro open/private svět; 400 pro public/closed, 409 pro existující membership nebo existující AR.
4. `DELETE /worlds/:id/access-request` smaže vlastní pending AR; 404 pokud chybí.
5. `POST /worlds/:id/access-requests/:requestId/approve` smaže AR a vytvoří membership s rolí **Čtenář** (atomicky/transakčně); jen PJ světa nebo Admin/SA.
6. `POST /worlds/:id/access-requests/:requestId/reject` smaže AR; jen PJ světa nebo Admin/SA.
7. `GET /worlds/my-access-requests` vrací pending AR current usera s embedded summary světa.
8. Existující `world-join-request.provider.ts` přejmenován/upraven na `world-access-request.provider.ts`, type string `'world_access_request'`. Registrován v `PendingActionsModule`. `GET /pending-actions?type=world_access_request` vrací žádosti scoped na PJ aktuálního uživatele.
9. `GET /worlds/:id` pro `private` svět vrací 404 pro logged-in usera, který není ani member, ani autor pending AR, ani Admin/SA.
10. WS eventy `world:access-requested/approved/rejected/cancelled` emitovány na správné rooms.
11. BE testy: +7 (joinPublic happy + non-public + duplicate; requestAccess happy + duplicate-AR + duplicate-member; approveAccessRequest transakce vytvoří membership a smaže AR; rejectAccessRequest smaže AR; private 404 controller test).

### FE
12. `/svet/:worldId` (member) zobrazí member dashboard stub s linky na sub-routes.
13. `/svet/:worldId` (non-member, public) zobrazí pre-join view s CTA „Vstoupit do světa"; klik → mutation → re-render member view.
14. `/svet/:worldId` (non-member, open) zobrazí CTA „Požádat o vstup"; klik → mutation → pending-access view s `AccessRequestPending` banner + cancel tlačítkem.
15. `/svet/:worldId` (pending-access user) zobrazí banner s datem podání + tlačítko Zrušit žádost; klik (po confirm) → DELETE → CTA znovu k dispozici.
16. `/svet/:worldId` (non-member bez AR, private nebo neexistující) zobrazí `WorldNotFound` (404 z BE).
17. `/svet/:worldId/<sub-route>` (např. `/chat`) pro non-member nebo pending-access → redirect na `/svet/:id`.
18. WorldLayout u non-member / pending-access zobrazí jen **light header** (EXIT + název + accessMode badge), žádnou nav. Member vidí plný header.
19. Zpracovat tab (PJ vlastník): `WorldAccessRequest` karta s avatar + username + worldName + Přijmout/Odmítnout. Po Přijmout → toast „Žadatel přijat", karta zmizí. Po Odmítnout → toast „Žádost odmítnuta".
20. WS event `world:access-approved` u žadatele zobrazí toast + invaliduje `['worlds', 'my-access-requests']` a `['worlds', 'my']` (re-render do member view).
21. `useWorldStatus(worldId)` vrací 3 stavy konzistentně: `non-member`, `pending-access`, `member`.
22. FE +~16 nových testů (WorldDashboardPage 4 stavy, JoinCTA public/open/private 3, AccessRequestPending 2, WorldAccessRequestRenderer 2, useJoinWorld 1, useRequestAccess 1, useCancelAccessRequest 1, useWorldStatus 2, WorldLayout light/full 2 — minus překryvy ≈ 16).

### Build / lint / test
23. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
24. Žádný hardcoded barevný literál.
25. Mobile (≤ 768 px) layout funguje (skill `mobil-desktop`).
26. Stránka `Nápověda` (`/ikaros/napoveda`) aktualizována (sekce Stránky + Role) skillem `napoveda`.

---

## 7. Test plán

### BE
- `worlds.service.joinPublic` — happy path (Čtenář membership), 409 duplicate, 400 non-public.
- `worlds.service.requestAccess` — open & private happy path, 409 duplicate AR, 409 already-member, 400 public.
- `worlds.service.cancelAccessRequest` — happy path, 404 chybí AR.
- `worlds.service.approveAccessRequest` — PJ happy (AR smazán + membership Čtenář vytvořen), non-PJ 403, 404 chybí AR. Transakce: ověřit atomicitu (kill během = oba operace zůstanou konzistentní).
- `worlds.service.rejectAccessRequest` — PJ happy (AR smazán), non-PJ 403.
- `worlds.service.findMyAccessRequests` — vrací jen pending AR current usera s embedded world summary.
- `worlds.controller` — private světa 404 pro non-member bez AR.

### FE
- `JoinCTA` — public → useJoinWorld, open/private → useRequestAccess. Disabled při pending.
- `AccessRequestPending` — banner s datem + cancel button → confirm dialog → DELETE.
- `WorldAccessRequestRenderer` — render avatar + username + worldName; approve/reject → mutation + toast.
- `useWorldStatus(worldId)` — kombinace membership + pending AR. Tabulka: member-no-pending = member, no-member-pending-AR = pending-access, no-member-no-AR = non-member.
- `useJoinWorld` / `useRequestAccess` / `useCancelAccessRequest` — invalidují správné query keys.
- `WorldLayout` — light header pro non-member/pending-access, full pro membera (renderuje correct nav links).
- `WorldDashboardPage` — 4 stavy (non-member public/open/private, pending-access, member, member+PJ).

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Race condition: 2 PJ schválí stejný AR | Nízká | Nízký | Atomická transakce (smazat AR + vytvořit membership). Druhá mutation dostane 404 (AR už neexistuje). |
| Race: user spamuje POST /access-request | Nízká | Nízký | Unique compound index `(worldId, userId)` → 2. request 409. |
| WS event nedoručen → UI uvázne v pending-access | Střední | Střední | `refetchOnWindowFocus` + manual invalidate na route change. |
| Private 404 prozradí timing rozdíl | Nízká | Nízký | BE vrací stejný 404 pro neexistující i private-no-access. |
| Member dashboard stub vypadá prázdně | Vysoká | Nízký | Vědomé MVP, plný obsah až později. Stub odkazuje na sub-routes. |
| Existující data v `world_memberships` s rolí Zadatel (po 3.6a D-053 migraci) | Střední | Nízký | Audit BE migrace D-053: ověřit, zda nějaký Zadatel záznam vznikl. Pokud ano, migrovat na samostatné `world_access_requests` jednorázovým skriptem. |
| `WorldJoinRequestProvider` přejmenování zapomeneme někde | Střední | Nízký | Grep `world_join_request` napříč FE+BE před commitem. |

**Rollback:** Revert FE commitů + BE PR. Endpointy a kolekce jsou aditivní, neporušují existující klienty. Nová kolekce `world_access_requests` zůstane v DB prázdná (nebo ji smažeme manuálně).

---

## 9. Otázky k autorovi

Žádné — všechna rozhodnutí provedena. Klíčové volby:

- **Sémantika rolí (PJ 2026-05-14)**: Žadatel = člen světa čekající na postavu. Čtenář = pasivní účastník. Pre-membership entita = samostatná `WorldAccessRequest`.
- **Public join → role Čtenář (2B z brainstormingu)**: „přímé" = okamžitě bez schvalování. Hráčem se stává explicitně (postava, fáze 5+).
- **Approve AR → role Čtenář**: konzistentní s public.
- **Sjednocená route (1A)**: WorldLayout větví header podle membershipu. Žádné `/o-svete` ani podobné.
- **Private detail (3A)**: dostupný přes přímý URL pro logged-in (BE 404 jinak). Anon přístup = dluh.
- **WS eventy**: ano, konzistentně s friend requests (4 specifické místo reuse generického).
- **Zrušit žádost**: ano, jednoduchý DELETE + confirm dialog.
- **Odejít ze světa / Žádost o postavu**: out of scope (dluhy).

---

## 10. Mimo rozsah (samostatné fáze / dluhy)

- 2.5 World settings (edit, hero upload, leave world).
- Fáze 5+ Character flow (vytvoření postavy = upgrade Čtenář → Žadatel → Hráč po schválení PJ).
- Fáze 3+ Plný member dashboard (recent activity, oblíbené stránky, statistiky).
- **D-NEW-character-request** (in-world akce „Žádám PJ o postavu" — upgrade Čtenář → Žadatel jako role).
- **D-NEW-anon-world-detail** (anon přístup k public/open detailu).
- **D-NEW-leave-world** (tlačítko Odejít ze světa pro non-PJ membery).
- **D-NEW-promote-role** (PJ promote Čtenář → Hráč přes settings).
- **D-NEW-world-invites** (pozvánky PJ → konkrétní uživatel, fáze 8+).
- **D-NEW-bulk-pending** (bulk approve/reject ve Zpracovat tabu).
