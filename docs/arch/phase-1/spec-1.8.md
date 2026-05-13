# Spec 1.8 — Přátelé (Friendships)

**Stav:** návrh, čeká schválení
**Datum:** 2026-05-13
**Závisí na:** 1.4 (PendingAction infra, `FriendsTab` kostra, `PublicProfileActions` placeholder „Přidat do přátel"), 1.5 (Socket.IO gateway pattern), 1.3c (tombstone semantika)
**Uzavírá:** placeholder z 1.4 — tab `Přátelé` + queue typ `friend_request` ve `Zpracovat` tabu

---

## 1. Cíl

Naplnit funkčnost přátelského vztahu mezi dvěma globálními uživateli platformy:

- žadatel pošle žádost příjemci
- příjemce ji rozhodne (přijmout / odmítnout)
- po přijetí mají oba „přítele" v seznamu
- kterákoliv strana může přátelství kdykoliv zrušit
- žádost se zobrazí v `Zpracovat` tabu příjemce jako `friend_request`

**Není cílem v 1.8:** blokování uživatelů (`POST /friends/block`), notifikace přes mail, friend-only privacy (např. „kdo vidí můj profil"), import přátel z kontaktů. Block API zachováme jako enum-ready (status `blocked` v Friendship modelu), ale endpoint a UI necháme jako follow-up dluh.

## 2. Datový model

### 2.1 Friendship entity (BE Mongoose)

```ts
interface Friendship {
  id: string;
  userAId: string;        // kanonicky nižší ObjectId z páru
  userBId: string;        // kanonicky vyšší ObjectId z páru
  requestedById: string;  // kdo žádost iniciálně poslal (jeden z A/B)
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  blockedById?: string | null; // jen pokud status='blocked' (mimo rozsah 1.8 — pole prázdné)
  lastDeclinedAt?: Date | null; // Q4 — per-pair cool-down driver (1.8 spam mitigace)
  lastDeclinedById?: string | null; // kdo naposled odmítl (jeden z A/B)
  createdAt: Date;
  acceptedAt?: Date | null;
  updatedAt: Date;
}
```

**Kanonické pořadí** zajišťuje, že (A,B) a (B,A) jsou stejný řádek → unique index `{ userAId: 1, userBId: 1 }` (unique). Při create vždy seřadit IDs: `min(a,b) → userAId`, `max(a,b) → userBId`.

**Indexy:**
- `{ userAId: 1, userBId: 1 }` unique — zamezí duplicitě
- `{ userAId: 1, status: 1 }` + `{ userBId: 1, status: 1 }` — lookup „moji přátelé"
- `{ status: 1, userAId: 1 }` partial pro `status='pending'` — count pending

### 2.2 Status diagram

```
                  ┌────────────┐
   (none)   ─►   │  pending   │  ──► cancel (žadatel)  → row delete
                  └─────┬──────┘
                        │
              ┌─────────┴─────────┐
              │ accept (recipient)│ decline (recipient)
              ▼                   ▼
       ┌────────────┐      ┌────────────┐
       │  accepted  │      │  declined  │   ── (po cooldownu lze nový sendRequest:
       └─────┬──────┘      └────────────┘       řádek přejde zpět na `pending` se
             │                  ▲               swapnutým requestedById = recyklace)
             │ remove           │
             ▼                  │
          row delete       sendRequest unblocked
                           až po `lastDeclinedAt + FRIEND_REQUEST_COOLDOWN_HOURS`
```

`blocked` stav existuje v enum, ale není v 1.8 dosažitelný přes API (žádný endpoint ho neumí nastavit). Připraveno pro budoucí D-055 (block flow).

`declined` řádek **neexpiruje** automaticky — slouží jako cool-down marker. Při dalším `sendRequest` po vypršení cooldownu se stejný řádek recyklací přepíše na `pending` (nový `requestedById`, `lastDeclinedAt` zachováno pro historii).

## 3. BE — modul `friendships`

### 3.1 Struktura modulu

```
backend/src/modules/friendships/
├── friendships.module.ts
├── friendships.controller.ts
├── friendships.service.ts
├── friendships.gateway.ts
├── friendships.service.spec.ts
├── friendships.gateway.spec.ts
├── interfaces/
│   ├── friendship.interface.ts
│   └── friendships-repository.interface.ts
├── repositories/
│   └── friendships.repository.ts
├── schemas/
│   └── friendship.schema.ts
├── dto/
│   └── send-friend-request.dto.ts
└── providers/
    └── friend-request.provider.ts
```

### 3.2 REST endpointy (`/api/friends`)

Všechny pod `JwtAuthGuard`. Throttle 60/min/user (konzistence s `pending-actions`).

| Metoda | Cesta | Účel | Response |
|---|---|---|---|
| `GET` | `/friends` | accepted přátelé current usera (paginováno) | `{ items: FriendListItem[]; total: number }` |
| `GET` | `/friends/requests/outgoing` | pending žádosti, které jsem odeslal já | `{ items: FriendRequestListItem[]; total: number }` |
| `POST` | `/friends/request` body `{ userId }` | odeslat žádost | `201` `{ friendship: FriendshipDto }` |
| `POST` | `/friends/:id/accept` | příjemce přijme | `200` `{ friendship: FriendshipDto }` |
| `DELETE` | `/friends/:id` | odmítnout pending / odebrat accepted (idempotentní) | `204` |
| `DELETE` | `/friends/by-user/:userId` | UX alias — najde friendship podle partnera a smaže | `204` |

**Pending listing** pro příjemce **NE vystavujeme** jako samostatný REST endpoint — přijde přes agregátor `/pending-actions?type=friend_request` (provider).

### 3.3 DTO

**`FriendListItem`** (response shape pro `GET /friends`):
```ts
{
  friendshipId: string;
  acceptedAt: string;        // ISO
  friend: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: 'male'|'female'|'being';
    role: UserRole;
    city: string | null;
    deleted: boolean;        // true pokud partner = tombstone
    pendingDeletion: boolean;// true pokud partner má deletionRequestedAt
  };
}
```

**`FriendRequestListItem`** (response shape pro pending — provider + outgoing):
```ts
{
  friendshipId: string;
  requestedAt: string;
  direction: 'incoming' | 'outgoing';
  counterpart: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: 'male'|'female'|'being';
    role: UserRole;
  };
}
```

`direction` je `outgoing` v `GET /friends/requests/outgoing`, `incoming` v `/pending-actions?type=friend_request`.

### 3.4 Service business pravidla

**`sendRequest(fromUserId, toUserId)`:**
- 400 `SELF_FRIEND` pokud `from === to`
- 404 `USER_NOT_FOUND` pokud target neexistuje, je tombstone (`isDeleted=true`), nebo má `deletionRequestedAt`
- 409 `ALREADY_FRIENDS` pokud existuje friendship `accepted`
- 409 `REQUEST_EXISTS` pokud existuje friendship `pending` v libovolném směru
- **429 `REJECTED_RECENTLY`** s body `{ retryAfter: ISO }` pokud existuje friendship `declined` a `lastDeclinedAt + FRIEND_REQUEST_COOLDOWN_HOURS > now` **A** to byl `from`, kdo měl odmítnutou žádost (tj. `lastDeclinedById !== from` znamená *recipient odmítl from-ův pokus*). Pokud naopak odmítnutí udělal `from`, smí poslat novou žádost druhému okamžitě (vůle uživatele, ne spam).
- jinak vytvoří/recykluje friendship status=`pending`, `requestedById=from`; pokud řádek existoval (declined), `lastDeclinedAt`/`lastDeclinedById` zůstávají
- emituje socket `friend:request:incoming` na `toUserId`

**`accept(friendshipId, byUserId)`:**
- 404 pokud friendship neexistuje
- 403 `NOT_RECIPIENT` pokud `byUserId === requestedById` (žadatel nemůže přijmout vlastní žádost)
- 403 `NOT_PARTICIPANT` pokud `byUserId` není ani A ani B
- 409 `NOT_PENDING` pokud status už není pending
- nastaví `status='accepted'`, `acceptedAt=now`
- emituje socket `friend:request:accepted` na `requestedById`

**`remove(friendshipId, byUserId)`:**
- 404 pokud neexistuje (idempotentní by vrátil 204, ale spec rozhoduje pro explicit 404)
- 403 `NOT_PARTICIPANT` pokud `byUserId` není v páru
- chování dle původního stavu:
  - byl `pending` + byUserId=recipient → **přepíše status=`declined`**, `lastDeclinedAt=now`, `lastDeclinedById=byUserId`; emit `friend:request:declined` na requesterId
  - byl `pending` + byUserId=requester → smaže řádek; emit `friend:request:canceled` na recipientId
  - byl `accepted` → smaže řádek; emit `friend:removed` na druhou stranu
  - byl `declined` → smaže řádek (manuální cleanup, no-op socket)

**`removeByUserId(currentUserId, partnerUserId)`:** wrapper nad `remove` po lookup párového řádku. 204 i kdyby neexistoval (čistá UX-alias semantika).

### 3.5 Provider `FriendRequestProvider implements IPendingActionProvider`

```ts
type = PendingActionType.FriendRequest

canHandle(userId, role): true  // friend request je per-user, dostupný všem
countForUser(userId): count friendships kde
                       (userAId=userId OR userBId=userId)
                       AND status='pending'
                       AND requestedById !== userId  // jen příchozí
listForUser(userId, page, limit):
   stejný filter + paginate + hydrate counterpart user

// `declined` řádky NIKDY do queue/listings nevstupují — jsou interní cool-down marker
// invisible pro UI obě strany.
```

Registrace v `onApplicationBootstrap` (stejný pattern jako `UsernameRequestProvider`).

### 3.6 Gateway `FriendshipsGateway`

Stejný pattern jako `PresenceGateway`:
- namespace `/` (sdílený)
- JWT verify v handshake (reuse `JwtService.verify`)
- udržuje mapu `userId → Set<socketId>` (nebo využije `OnlinePresenceRegistry` pro lookup socketů — k diskuzi v plánu)
- emit směrované eventy:
  - `friend:request:incoming` `{ friendshipId, from: { id, username, avatarUrl, defaultAvatarType, displayName, role } }` — na příjemce
  - `friend:request:accepted` `{ friendshipId, by: { id, username, avatarUrl, defaultAvatarType, displayName } }` — na žadatele
  - `friend:request:declined` `{ friendshipId, by: { id, username } }` — na žadatele
  - `friend:request:canceled` `{ friendshipId, by: { id, username } }` — na příjemce
  - `friend:removed` `{ friendshipId, by: { id, username } }` — na druhou stranu

**Best-effort:** pokud user není online, event se ztratí — FE si stejně refetchne při dalším otevření.

### 3.7 Tombstone integrace (D-040 zde **neřešíme**)

- **Send request na tombstone:** 404 (target už není v public adresáři — viz 1.4)
- **Existující friendship s tombstone partnerem:** zachováno, `FriendListItem.friend.deleted = true`, FE zobrazí avatar s `deleted` overlay (komponenta `<UserAvatar deleted />` z 1.3c) a tlačítko „Odebrat" zůstává funkční
- **Hard delete tombstone (cron):** D-041 zůstává otevřený — friendships smazané hard-delete uživatele zůstanou v DB s dangling reference. Nestaráme se v 1.8 (sledováno v dluhu).

## 4. FE — modul `friendships`

### 4.1 Struktura

```
src/features/friendships/
├── api/
│   ├── useFriends.ts
│   ├── useOutgoingFriendRequests.ts
│   ├── useSendFriendRequest.ts
│   ├── useAcceptFriendRequest.ts
│   ├── useRemoveFriend.ts
│   └── useFriendshipStatus.ts
├── components/
│   ├── FriendCard.tsx
│   ├── OutgoingRequestCard.tsx
│   └── FriendRequestRenderer.tsx
├── hooks/
│   └── useFriendshipsSocket.ts
└── types.ts
```

`FriendsTab.tsx` (existující v `src/features/users/components/tabs/FriendsTab/`) se přepíše — bude konzumovat nové api hooky a renderovat:

1. **Sekce „Moji přátelé"** — grid `<FriendCard>` (1 col mobil, 2 col tablet, 3 col desktop). Empty state pokud žádní.
2. **Sekce „Odeslané žádosti"** — sbalitelná, jen pokud `outgoing.total > 0`, grid `<OutgoingRequestCard>` s tlačítkem „Zrušit žádost".
3. Žádné stránkování v 1.8 — limit 100 (přátelská síť je malá; paginate přidáme až bude potřeba).

### 4.2 `useFriendshipStatus(userId)` — driver pro veřejný profil

Vrátí discriminated union:
```ts
type FriendshipStatus =
  | { kind: 'none' }
  | { kind: 'pending_outgoing'; friendshipId: string }
  | { kind: 'pending_incoming'; friendshipId: string }
  | { kind: 'accepted'; friendshipId: string }
  | { kind: 'self' };
```

Interně: jeden query klíč `['friendship-status', userId]`. Endpoint `GET /api/friends/status/:userId` (přidáme do BE — drobný extra endpoint, vrací jeden friendship nebo 204/200 s `{ kind: 'none' }`).

### 4.3 `PublicProfileActions` — naplnění tlačítka „Přidat do přátel"

`PublicProfileActions` v `src/features/users/components/PublicProfile/` mění chování podle `useFriendshipStatus`:

| status | tlačítko | onClick |
|---|---|---|
| `none` | „Přidat do přátel" (UserPlus icon) | `useSendFriendRequest` |
| `pending_outgoing` | „Zrušit žádost" (X icon, ghost variant) | `useRemoveFriend` |
| `pending_incoming` | dva: „Přijmout" / „Odmítnout" | `useAcceptFriendRequest` / `useRemoveFriend` |
| `accepted` | „Odebrat z přátel" (UserMinus icon, danger variant, confirm modal) | `useRemoveFriend` |
| `self` | tlačítko skryto | — |

Zachová admin akci „Otevřít v administraci" a placeholder „Napsat zprávu" (3.5).

### 4.4 `FriendRequestRenderer` — registrace v `PENDING_ACTION_RENDERERS`

Stejný shape jako `UsernameRequestRenderer`:
- `renderLeft`: `<UserAvatar src={from.avatarUrl} defaultType={from.defaultAvatarType} size="md" />`
- `renderMid`: „**{from.username}** ti posílá žádost o přátelství · {relative time}"
- `renderActions`: dvě tlačítka — „Odmítnout" (X, danger) a „Přijmout" (Check)

Po vyřešení volá `helpers.onResolve()` (stejně jako UsernameRequest), což invaliduje query `['pending-actions']`.

Registr `src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx` se rozšíří o:
```ts
[PendingActionType.FriendRequest]: friendRequestRenderer as PendingActionRenderer<unknown>,
```

### 4.5 `ZpracovatTab` — odblokovat pro non-admin role

Současný `placeholderTextForRole` říká „Žádosti o přátelství se objeví zde. Funkce přijde s krokem 1.8." Po 1.8 musíme zobrazit reálná data **pro všechny role** (admin i ne-admin).

Refactor: `ZpracovatTab` nebude binární „admin = AdminZpracovat / jinak = RolePlaceholder", ale agregátor — projde všechny `PendingActionType`, načte items přes `usePendingActions`, vyfiltruje prázdné, render. Pro každého usera se zobrazí jen typy, kde provider `canHandle=true` (BE filtruje, FE nemusí znát role).

**Praktický minimální refactor:** smyčka přes typy které mají renderer v registry, pro každý zavoláme `usePendingActions(type)`, zobrazíme group. Pokud všechny 0 → empty state.

### 4.6 Socket integrace `useFriendshipsSocket`

Hook se mountne v `IkarosLayout` (vedle `usePresenceInit`) a registruje listenery:

```ts
'friend:request:incoming'  → invalidate ['pending-actions'], toast(`{from.username} ti poslal žádost o přátelství`)
'friend:request:accepted'  → invalidate ['friends'], ['friendship-status'], toast(`{by.username} přijal/a tvou žádost`)
'friend:request:declined'  → invalidate ['friendship-status'], (žádný toast — diskrétní)
'friend:request:canceled'  → invalidate ['pending-actions']
'friend:removed'           → invalidate ['friends'], ['friendship-status']
```

Reuse existující `SocketManager`/`useSocketEvent` z fáze 0.6.

### 4.7 Pravý panel a nav badge

Badge na tabu „Zpracovat" (z 1.4) už agreguje přes `usePendingActionsCount` — nic neměníme, jen se zvedne číslo po registraci providera v BE.

Adaptivní label tabu „Přátelé / Uživatelé" v pravém panelu (1.4) — beze změny.

## 5. Typy v `src/shared/types/index.ts`

Přidat:

```ts
export interface FriendListItem { ... viz §3.3 ... }
export interface FriendRequestListItem { ... viz §3.3 ... }
export type FriendshipStatusKind =
  | 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted' | 'self';
export interface FriendshipStatusResponse {
  kind: FriendshipStatusKind;
  friendshipId?: string;
}
```

`PendingActionType.FriendRequest` už existuje (z 1.4) — nepřidávat.

## 6. Edge cases

| Případ | Chování |
|---|---|
| Pošlu žádost, druhý mi mezitím pošle žádost | BE atomická operace najde existující pending (druhý směr) a vrátí 409 `REQUEST_EXISTS` — FE zobrazí toast „Tento uživatel ti už poslal žádost — najdi ji ve Zpracovat" |
| Smažu si účet (1.3c) | Friendships zůstanou (D-041 — hard delete cleanup mimo rozsah 1.8) |
| Partner se stane tombstone | Karta zůstane, overlay, lze odebrat |
| 401 / token refresh během akce | Stejný flow jako kdekoliv jinde — `useAuth` interceptor |
| Spam: 10 žádostí stejnému uživateli za minutu | Dvě vrstvy: (a) globální throttle 60/min/user na endpoint, (b) **per-pair cool-down** — po každém `declined` se uloží do friendship dokumentu `lastDeclinedAt`; další `sendRequest(from→to)` v intervalu < `FRIEND_REQUEST_COOLDOWN_HOURS` (default 24h) → 429 `REJECTED_RECENTLY` s polem `retryAfter` (ISO timestamp). `lastDeclinedAt` se ukládá i po smazání řádku — proto držíme řádek s status=`declined` místo hard-delete (pak `sendRequest` recyklací řádku přejde do `pending`). |
| User je sám sebou v `useFriendshipStatus(self.id)` | `kind: 'self'`, tlačítko skryto |
| Mass-action: smazat všechny přátele | Mimo rozsah |

## 7. Otázky designu (vizuální — možný `frontend-design` audit)

1. **`FriendCard` design** — zopakovat `UserCard` z 1.4 (4 cornerstones, avatar, role chip, kebab) nebo nový lighter vzor? Návrh: **reuse `UserCard` se slot prop `actions`** — kebab menu má „Odebrat z přátel" (potvrzovací modal) + „Otevřít profil". Méně kódu, vizuální konzistence.
2. **`OutgoingRequestCard`** — vlastní lehčí varianta? Návrh: malá řádka avatar + username + „Žádost čeká od {date}" + tlačítko „Zrušit". Žádný cornerstone, žádný role chip.
3. **Empty state „Žádní přátelé"** — současný v `FriendsTab.tsx` má ikonu Users + nadpis + podtext. Zachovat, jen aktualizovat podtext na výzvu „Zkus adresář v tabu Uživatelé."
4. **Toast po přijetí žádosti** — sonner default, žádný custom skin
5. **Confirm modal „Odebrat z přátel?"** — reuse `<ConfirmDialog>` vzor pokud existuje, jinak nový lehký primitiv (krátký text + dvě tlačítka)

Pokud uživatel chce před plánem detailní design audit, spustím `frontend-design` skill (zejména pro `FriendCard` actions slot + `OutgoingRequestCard` layout).

## 8. Out of scope (sledováno jako follow-up dluhy)

| ID | Téma | Důvod odkladu |
|---|---|---|
| D-055 (návrh) | Blokace uživatelů (`POST /friends/block`, UI) | Roadmap značí jako „volitelné"; širší UX (skryté profily, nemožnost zaslat zprávu, vyloučení z chatu) — samostatný spec |
| D-056 (návrh) | Spam mitigation (cool-down po opakovaném odmítnutí) | Nejdřív sledovat reálné zneužití, pak řešit |
| D-057 (návrh) | Friend-only privacy v profilu/poště | Závisí na 3.5 (pošta) a možná 1.4 privacy rozšíření |
| D-041 (otevřený) | Hard-delete friendships při tombstone hard-delete cron | Patří k 1.3c cleanup cron — řešíme separátně, ne v 1.8 |
| Mail notifikace o žádosti | Spec 1.7 řešila reset/verify/change + 2 notifikace (username/deletion). Friend request mail = další event listener — návrh: přidat do 1.7 retro-fit / odložit do D-NEW. **Doporučuji: NE-přidávat** v 1.8 (push v real-time přes socket je primární; mail by spamoval) |

## 9. Testy

### BE

- `friendships.service.spec.ts`:
  - sendRequest happy path → vytvoří pending, canonical pořadí IDs
  - sendRequest self → 400
  - sendRequest na tombstone → 404
  - sendRequest duplicate pending → 409
  - sendRequest když už accepted → 409
  - sendRequest opačného směru když protistrana má pending → 409
  - accept happy path
  - accept by requester → 403
  - accept non-pending → 409
  - remove pending by requester → emit `canceled`
  - remove pending by recipient → emit `declined`
  - remove accepted → emit `removed`
  - remove neúčastníkem → 403
- `friend-request.provider.spec.ts`:
  - countForUser ignoruje vlastní outgoing pending
  - listForUser stránkuje + hydrátuje counterpart
- `friendships.gateway.spec.ts`:
  - emit cílí jen na sockety daného userId
- E2E `friendships.e2e-spec.ts`:
  - full flow: send → accept → list → remove
  - 409 a 403 paths

### FE

- `useFriendshipStatus.spec.tsx` — discriminated union mapping
- `FriendCard.spec.tsx` — render + kebab akce
- `FriendRequestRenderer.spec.tsx` — accept/decline cesta + invalidace cache
- `FriendsTab.spec.tsx` — empty state, sekce „Odeslané žádosti" se zobrazí jen pokud > 0
- `PublicProfileActions.spec.tsx` (rozšíření existujícího) — stavy tlačítka přes `useFriendshipStatus`
- `useFriendshipsSocket.spec.tsx` — listener invalidates query klíče

## 10. Akceptační kritéria

- [ ] Uživatel A z veřejného profilu uživatele B klikne „Přidat do přátel" → žádost dorazí ve Zpracovat tabu B v reálném čase (socket)
- [ ] Po přijetí se na obou stranách objeví karta přítele v tabu Přátelé bez ručního refreshe
- [ ] V profilu už nelze poslat duplicitní žádost (tlačítko změní stav na „Žádost čeká")
- [ ] Smazání přítele z karty (kebab) → druhá strana ho ztratí ze seznamu v reálném čase
- [ ] Pending count v pravém panelu (badge Zpracovat) zahrnuje příchozí friend requesty
- [ ] Tombstone partner v seznamu má `deleted` overlay a lze ho odebrat
- [ ] `npm run lint`, `npm run lint:colors`, `npm test -- --run`, `npm run build` projdou bez chyb
- [ ] BE: jest pass, e2e pass

## 11. Schvalovací stop

**Souhlasím se spec → následuje `plan-1.8.md` (rozpis na fáze).**

Rozhodnutí uživatele (2026-05-13):
- Q1 — **A schváleno:** reuse `UserCard` + actions slot, kebab menu „Odebrat z přátel" + „Otevřít profil"
- Q2 — **A schváleno:** block flow odložen do D-055
- Q3 — **A schváleno:** žádný mail; socket stačí
- Q4 — **B schváleno:** **zahrnout per-pair cool-down** přes persistentní `declined` status + `lastDeclinedAt`/`lastDeclinedById` na Friendship dokumentu. Default cooldown **24h** (env `FRIEND_REQUEST_COOLDOWN_HOURS`). Asymetrické: blokuje jen stranu, která dostala odmítnutí. Po vypršení `sendRequest` recykluje řádek na `pending`. (Detaily viz §3.4, §3.5, §6.)
- Q5 — **B schváleno:** spustit `frontend-design` skill **před** `plan-1.8.md`. Audit cílí na:
  - `UserCard` „actions slot" prop (kebab menu, hover affordance, mobil pattern)
  - `OutgoingRequestCard` (lehčí inline řádek, ne plnohodnotná karta)
  - `FriendsTab` empty state + sekce header + collapse pro „Odeslané žádosti"
  - dynamické tlačítko ve veřejném profilu (5 vizuálních stavů: send/cancel/accept+decline/remove/self)
  - confirm modal „Odebrat z přátel?" (text, primary action variant)
  - výstup auditu se inkorporuje do `plan-1.8.md` §UI sekce a do `decisions.md` přílohy
