# Spec D-055 — Block flow

**Stav:** návrh, čeká schválení
**Datum:** 2026-05-13
**Side-task po:** 1.8 (Přátelé) — `Friendship.status='blocked'` + `blockedById` pole jsou už připravené (forward-compat ze spec 1.8 §2.1)
**Závisí na:** 1.4 (`PublicProfileActions`), 1.8 (`FriendshipsService` + `useFriendshipStatus`)

---

## 1. Cíl

Umožnit uživateli explicitně **zablokovat** jiného uživatele. Block je silnější forma odmítnutí než decline z 1.8 — trvalý (do unblocku), asymetricky tichý (cílový to nepozná).

## 2. Rozsah blokace v této fázi

**Co block dělá:**
1. Smaže existující `accepted` friendship (pokud byl)
2. Smaže existující `pending` friendship (request kterékoliv strany)
3. Blokuje budoucí friend requesty obou směrů (`sendRequest` → 404 pro blokovaného, 409 pro blokujícího)
4. Blokuje hovor přes `getStatusForPair` z pohledu blokovaného (vrátí `none`, jako kdyby pár neexistoval)
5. Blokující vidí seznam zablokovaných v `Přátelé` tabu (nová sekce „Zablokovaní")
6. Blokující má v profilu blokovaného tlačítko „Odblokovat"

**Co block ne-dělá (out of scope):**
- Skrytí profilu z adresáře (`/api/users` GET) — blokovaný uvidí blokujícího v seznamu jako kdokoliv jiný. Důvod: full admin-grade hiding zahrnuje search/filter logiku a komplikuje 1.4 endpoint; teprve s D-057 (privacy) má smysl řešit.
- Blokace poštovních zpráv — pošta přijde s 3.5, integrace se přidá tam
- Blokace v chatu — chat 4.x/6.x
- Blokace komentářů u článků/galerie — 3.x
- Block z admin perspektivy (mass-block, IP block) — admin už má `ban` (1.3b)

Forward-compat: 3.5+ moduly při psaní zprávy / chatu zavolají `friendshipsService.isBlockedBetween(a, b)` (přidaná metoda v této fázi).

## 3. Asymetrie chování

| Akce | A blokuje B → A | A blokuje B → B |
|---|---|---|
| `GET /friends/status/B` | `kind: 'blocked_by_me'`, `friendshipId` | `kind: 'none'` (anti-stalk — B nepozná že je blokován) |
| `POST /friends/request` (A → B) | 409 `ALREADY_BLOCKED` | n/a |
| `POST /friends/request` (B → A) | n/a | 404 `USER_NOT_FOUND` (silent jako tombstone) |
| `GET /friends` | bez B | bez A (smazaný accepted) |
| `GET /friends/blocks` | obsahuje B | n/a (jen mé bloky) |
| `GET /users/profile/B` (public profile) | 200, navíc tlačítko „Odblokovat" | (B nevidí nic specifického) |
| `friendshipsService.isBlockedBetween(A, B)` | `true` | `true` (symetricky pro 3.5+ integrace) |

**Princip:** blokovaný **nesmí poznat** že je blokován ani z error kódů ani z UI změn. Z pohledu B se A chová jako kdyby existoval normálně, jen friend request se nepošle (jako kdyby A měl tombstone).

## 4. Datový model

**Reuse `Friendship` entity z 1.8** (forward-compat) — neměníme schema.

| Pole | Význam při block |
|---|---|
| `userAId`, `userBId` | canonical pair, zachováno |
| `requestedById` | poslední žadatel před blokem (informativní, nepotřebné) |
| `status` | `'blocked'` |
| `blockedById` | **kdo blokuje** (jeden z A/B) |
| `acceptedAt` | zachováno pokud byli předtím přátelé (historie) |
| `lastDeclinedAt` / `lastDeclinedById` | zachováno pokud byl předtím decline |
| `createdAt` | původní moment vzniku páru (zachováno) |
| `updatedAt` | moment blokace |

**Block je per-pár**, ne dvojstranný. A blokuje B → 1 řádek, `blockedById=A`. Když B chce taky blokovat A (zatímco A už blokuje B), je to no-op (řádek už `blocked`).

## 5. BE — endpointy + service

### 5.1 `POST /api/friends/block/:userId`

- Auth: JWT
- Throttle: 30/min/user
- Body: žádný
- Path param: `userId` cíle blokace
- Response: `200 { block: BlockedItem }` (BlockedItem definován v §6)

**Service flow `block(fromId, toId)`:**
- 400 `SELF_BLOCK` pokud `from === to`
- 404 `USER_NOT_FOUND` pokud target neexistuje / je tombstone / má `deletionRequestedAt`
- Najde existující friendship (přes `canonicalPair`)
- Pokud existuje a `status='blocked'`:
  - Pokud `blockedById === fromId` → no-op, vrátí stávající (idempotent)
  - Pokud `blockedById === toId` → 403 `BLOCKED_BY_PEER` (anti-stalk: ten blokovaný nesmí poznat, ale zde už dříve blokoval — informace povolená). Alternativně 404 — preferujeme 403 protože explicit setup je užitečnější UX (uživatel ví že to nejde).
  - **Q1 — viz §11:** rozhodnutí mezi 403 vs. 404
- Pokud existuje (jakkoliv status) → update na `blocked`, `blockedById=fromId`
- Jinak vytvoří nový řádek `status='blocked'`, `blockedById=fromId`
- **Emit socket event NE** (anti-stalk; blokovaný nesmí poznat). Žadatel si svůj seznam refetchne sám.

### 5.2 `DELETE /api/friends/block/:userId`

- Auth: JWT
- Throttle: 60/min/user
- Path param: `userId` cíle odblokace
- Response: `204`

**Service flow `unblock(fromId, toId)`:**
- Najde existující friendship
- Pokud neexistuje nebo `status !== 'blocked'` → silent 204 (idempotent)
- Pokud `blockedById !== fromId` → 403 `NOT_BLOCKER` (nemohu odblokovat blok někoho jiného)
- Smaže řádek (návrat na `none`); pokud chceme zachovat historii, lze místo `delete` updatovat na `declined` s `lastDeclinedAt`, ale to vede k cool-downu — preferujeme **delete** (čistý slate, žádný cool-down po unblock)

### 5.3 `GET /api/friends/blocks`

- Auth: JWT
- Throttle: 60/min/user
- Query: `?page=1&limit=100`
- Response: `{ items: BlockedItem[]; total: number }`

**Service flow `listBlocked(userId, page, limit)`:**
- Vrací friendships kde `status='blocked' AND blockedById=userId`
- Hydratuje counterpart user (deleted=true pro tombstone)

### 5.4 `getStatusForPair` rozšíření

Stávající `FriendshipStatusKind` rozšířen o `blocked_by_me`. Logika:

```ts
if (f.status === 'blocked') {
  if (f.blockedById === currentId) {
    return { kind: 'blocked_by_me', friendshipId: f.id };
  }
  // anti-stalk: blokovaný vidí 'none' (silent)
  return { kind: 'none' };
}
```

### 5.5 `sendRequest` rozšíření

```ts
if (existing?.status === 'blocked') {
  if (existing.blockedById === fromId) {
    throw 409 ALREADY_BLOCKED;
  }
  // anti-stalk: B (blokovaný) nesmí poznat → 404 USER_NOT_FOUND (jako tombstone)
  throw 404 USER_NOT_FOUND;
}
```

### 5.6 `isBlockedBetween` helper (forward-compat pro 3.5+)

```ts
async isBlockedBetween(userA: string, userB: string): Promise<boolean> {
  const f = await this.repo.findByPair(userA, userB);
  return f?.status === 'blocked';
}
```

Exportovaný z `FriendshipsService` — 3.5 (pošta), 4.x (chat), 3.x (komentáře u článků) si zavolají před doručením zprávy.

## 6. DTO

```ts
export interface BlockedItem {
  friendshipId: string;
  blockedAt: string; // ISO (= friendship.updatedAt v moment blocku)
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: 'male' | 'female' | 'being';
    role: UserRole;
    deleted: boolean;
  };
}
```

## 7. FE

### 7.1 Nový stav `blocked_by_me`

`FriendshipStatusKind` rozšířen v `src/shared/types/index.ts`:
```ts
export type FriendshipStatusKind =
  | 'none' | 'pending_outgoing' | 'pending_incoming'
  | 'accepted' | 'self' | 'cooldown' | 'blocked_by_me';
```

### 7.2 `PublicProfileActions` rozšíření

| Stav | Friend zone | Sekundární akce |
|---|---|---|
| `none` | „Přidat do přátel" | „Blokovat" (kebab nebo malé `Shield` tlačítko) |
| `pending_outgoing` | „Žádost čeká · Zrušit" | „Blokovat" |
| `pending_incoming` | „Přijmout" + „Odmítnout" | „Blokovat" |
| `accepted` | „Přátelé · Odebrat" | „Blokovat" (varuje že přátelství zmizí) |
| `blocked_by_me` | „Odblokovat" (ghost variant, `ShieldOff` ikona) | — (žádné jiné akce) |
| `cooldown` | (schované) | „Blokovat" — povolené i v cooldown |
| `self` | (schované) | — |

**Návrh:** „Blokovat" do **kebab menu** na profilu (Q2 v §11). Důvod: méně dominantní, ale dostupné. Confirm dialog před blokem (warning že přátelství zmizí, pokud existuje).

### 7.3 API hooks

`src/features/friendships/api/`:
- `useBlockedFriends.ts` — query `GET /friends/blocks`
- `useFriendshipMutations.ts` rozšířen o `useBlockUser` + `useUnblockUser`

### 7.4 FriendsTab — nová sekce „Zablokovaní"

Třetí sekce vedle „Moji přátelé" + „Odeslané žádosti". Pořadí:
1. Moji přátelé (vždy pokud > 0)
2. Odeslané žádosti (collapsible, vždy pokud > 0)
3. **Zablokovaní** (collapsible, default collapsed, vždy pokud > 0)

**Vizuální:** stejný řádkový pattern jako `OutgoingRequestCard`. Avatar + username + „zablokován od {date}" + tlačítko „Odblokovat" (ghost).

### 7.5 Toast / confirm

- Klik na „Blokovat" → `ConfirmDialog` s textem podle existujícího stavu:
  - none/declined/cooldown: „Zablokovat **{username}**? Nebudou si moct posílat žádosti o přátelství."
  - pending_*: „Zablokovat **{username}**? Žádost o přátelství se zruší."
  - accepted: „Zablokovat **{username}**? Vaše přátelství bude ukončeno a žádný z vás nebude moct poslat novou žádost."
- Klik na „Odblokovat" → tichý `useUnblockUser.mutate()` + toast „Odblokováno"
- Bez socket eventů (anti-stalk).

## 8. Socket integrace

**Záměrně bez emitů** — blokovaný nesmí dostat real-time push o tom že byl zablokován. Blokující si svoje seznamy refetchne přes `invalidateQueries(['friends', 'blocked'])` po mutaci.

Pokud měli accepted friendship a A zablokuje B, B uvidí ztrátu friendship až při příštím refetch (`['friends']` se invaliduje na FE blokujícího; B se to dozví při focus okna — `staleTime: 30s`). To je akceptovatelné — záměr je nebýt nápadný.

## 9. Edge cases

| Případ | Chování |
|---|---|
| A blokuje B, kdy už A blokoval | idempotent — vrátí stávající block |
| A blokuje B, kdy B blokoval A | 403 `BLOCKED_BY_PEER` (Q1 výjimka z anti-stalk — viz §11) |
| A blokuje B, pak ho odblokuje, pak posílá friend request | povoleno — block delete znamená čistý slate, žádný cool-down |
| Blokovaný user smaže účet | block zůstane v DB, ale `IFriendshipsRepository.deleteAllByUser` z D-041 ho smaže při tombstone pipeline |
| Self-block | 400 SELF_BLOCK |
| Block na tombstone | 404 USER_NOT_FOUND |

## 10. Testy

### BE
- `friendships.service.spec.ts` rozšíření (8 nových cases):
  - block happy path → status=blocked, blockedById set
  - block existing accepted → smaže `acceptedAt` historii? **Ne** — zachová pro audit, jen status změní
  - block existing pending → recyklace na blocked
  - block idempotent → druhý call vrátí stejný řádek
  - block self → 400
  - block tombstone → 404
  - block when peer blocked → 403 BLOCKED_BY_PEER (nebo 404 dle Q1)
  - unblock happy → row delete
  - unblock když blokoval někdo jiný → 403 NOT_BLOCKER
  - unblock když není blocked → 204 silent (idempotent)
  - `sendRequest` blocked-by-other → 404 silent
  - `sendRequest` blocked-by-me → 409 ALREADY_BLOCKED
  - `getStatusForPair` blocked_by_me / silent none
  - `isBlockedBetween` helper

- E2E (5 nových):
  - block → status change → friend request blocked
  - unblock → status none → friend request works
  - block existing friend → friendship gone
  - block list endpoint pagination
  - blocked user nedostane socket event (kontrola spočítáním emitů)

### FE
- `useFriendshipStatus.spec.tsx` rozšíření — `blocked_by_me` case
- `useBlockUser.spec.tsx` (nový) — happy path + 409 ALREADY_BLOCKED toast
- `PublicProfileActions.spec.tsx` rozšíření — `blocked_by_me` stav skryje friend zone, ukáže „Odblokovat"
- `FriendsTab.spec.tsx` rozšíření — sekce „Zablokovaní" se zobrazí pokud > 0
- `BlockedRequestCard.spec.tsx` (nový — pokud bude vlastní)

## 11. Rozhodnutí uživatele (2026-05-13)

- **Q1 = A schváleno:** 403 `BLOCKED_BY_PEER` s informativní zprávou „Tento uživatel ti zablokoval kontakt." (info-leak akceptovaný, pomáhá UX)
- **Q2 = A schváleno:** „Blokovat" do kebab menu v `PublicProfileActions` (vyžaduje rozšířit komponentu o kebab pattern z 1.8 `<KebabMenu>`)
- **Q3 (sekce v FriendsTab) = A (implicitně):** třetí sekce, default collapsed
- **Q4 (cool-down při unblock) = A schváleno:** vyčistit `lastDeclinedAt` + `lastDeclinedById` na null (čistý slate, block ne-bypass cool-downu)
- **Q5 (isBlockedBetween helper) = A schváleno:** přidat hned (forward-compat pro 3.5+)

## 12. Akceptační kritéria

- [ ] A klikne „Blokovat" v profilu B → confirm dialog → po potvrzení status změní + accepted friendship zmizí + pending zruší
- [ ] B nedostane žádný toast / socket event
- [ ] B otevře profil A → vidí ho normálně, ale „Přidat do přátel" silent fail (FE chytí 404 USER_NOT_FOUND z `sendRequest`)
- [ ] A v `FriendsTab` vidí sekci „Zablokovaní" s B v seznamu
- [ ] A klikne „Odblokovat" → tichý unblock, sekce se aktualizuje, friend request znovu možný
- [ ] Block na tombstone partnera → 404
- [ ] Block self → 400
- [ ] BE testy zelené (8+ unit, 5+ e2e), FE testy zelené
- [ ] `lint`, `lint:colors`, `tsc`, `build` ✓

## 13. Schvalovací stop

Souhlas se spec → následuje `plan-d055-block-flow.md`.
