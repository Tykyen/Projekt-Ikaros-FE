# 02 — Uživatelé, role, přátelé

Oblast pokrývá veřejný adresář uživatelů, systém přátelství (žádosti, blok, cooldown), admin správu uživatelů (role, ban/unban, deletion, audit log) a frontu pending akcí (Zpracovat tab).

**BE:** `users` (controller, service, repository, schemas, DTO), `friendships` (controller, service, repositories, pending-action provider, schemas), `pending-actions` (controller, service), `admin` (controller, service, admin-stats, audit log, hierarchy helpers)
**FE:** `features/users` (UsersPage, PublicUserProfilePage, UsersTab, FriendsTab, ZpracovatTab, RoleChip, UserCard, PublicProfile/*), `features/friendships` (hooks, mutations, components, useFriendshipsSocket), `features/admin/users` (AuditLogTab, UsersAdminTab, useAdminUsers)
**Routy:** `/ikaros/uzivatele`, `/ikaros/uzivatel/:id`, `/admin` (UsersAdminTab, AuditLogTab)

---

## A. FE↔BE kontrakt — typové shody

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-01 | `GET /users` — FE posílá `?search=` ale BE čte `@Query('q')` → search pole nikdy nedorazí na BE, výsledky vždy nefiltrované `[auto]` | M1, M2 | ⬜ |
| UF-02 | `GET /users` — FE posílá `sort=abc` ale BE akceptuje pouze `'new' \| 'recent' \| 'username'`; `abc` není validní → BE default na `new`, Abecedně volba nefunguje `[auto]` | M1, M2 | ⬜ |
| UF-03 | `GET /friends/blocks` — BE vrací `{ id, user, blockedAt }`, FE typ `BlockedItem` očekává `friendshipId` (ne `id`) → pole `friendshipId` je vždy `undefined` v `BlockedRequestCard` `[auto]` | M1, M2 | ⬜ |
| UF-04 | `FriendshipStatusKind` — FE typ obsahuje `'cooldown'`, BE `getStatus()` nikdy tuto hodnotu nevrací (jen `sendRequest` hází `REJECTED_RECENTLY` 429) → `'cooldown'` je mrtvá větev v `PublicProfileActions` `[auto]` | M1, M2 | ⬜ |
| UF-05 | `AdminAuditAction` — FE typ má 10 hodnot, BE definuje 22 hodnot; chybí `USER_CREATE`, `DELETE`, `UNDELETE`, `ACCOUNT_DELETE_REQUEST`, `ACCOUNT_DELETE_CANCEL`, `ACCOUNT_SELF_DELETE_REQUEST`, `ACCOUNT_SELF_REACTIVATE`, `ACCOUNT_HARD_DELETE`, `BULK_BAN`, `BULK_UNBAN`, `BULK_ROLE_CHANGE`, `PERMISSIONS_CHANGE` `[auto]` | M2 | ⬜ |
| UF-06 | `useAdminSetAdminPermissions` — FE volá `api.post(...)` ale BE endpoint je `PATCH /admin/users/:id/admin-permissions` → metoda mismatch, vždy 404 nebo Method Not Allowed `[auto]` | M1, M2 | ⬜ |
| UF-07 | `useAdminRequestDeletion` — FE volá `POST /admin/users/${userId}/deletion-request` ale BE má `POST /admin/users/:id/request-deletion` → URL mismatch, 404 `[auto]` | M1, M2 | ⬜ |
| UF-08 | `useAdminCancelDeletion` — FE volá `DELETE /admin/users/${userId}/deletion-request` ale BE má `POST /admin/users/:id/cancel-deletion` (jiná metoda i path) → vždy 404 `[auto]` | M1, M2 | ⬜ |
| UF-09 | `useAdminUsers` — FE posílá `hasPendingRequest=true` ale BE čte `@Query('hasPendingDeletion')` → filter na pending deletion v admin tabulce nefunguje `[auto]` | M1, M2 | ⬜ |
| UF-10 | `FriendListItem.friend` — FE typ vyžaduje `deleted` a `pendingDeletion` boolean; ověř, zda BE `listAcceptedForUser` (Friendships repo) tato pole vrací nebo jsou vždy `undefined` `[auto]` | M1, M2 | ⬜ |
| UF-11 | `PublicUserProfile.city` a `bio` — FE typ tato pole zahrnuje, BE `publicProfileV14` je mapuje; ověř soulad se schématem (UserSchemaClass má `city?` a `bio?`) `[auto]` | M1, M2 | ⬜ |
| UF-12 | `FriendRequestPendingItem` z BE poskytovatele neobsahuje pole `defaultAvatarType` ani `role` pro `counterpart`; FE `FriendRequestListItem` je očekává → `FriendRequestRenderer` může vykreslit default avatar špatně `[auto]` | M1, M2 | ⬜ |

---

## B. Auth/role gating — BE

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-13 | `GET /users/profile/:id` (starý endpoint) nemá `@UseGuards(JwtAuthGuard)` → je přístupný bez tokenu; vrací `id, username, displayName, avatarUrl, characterPath, role, createdAt, lastSeenAt` pro kohokoliv `[auto]` | M1, M4 | ⬜ |
| UF-14 | `GET /users/:id` — role check `requester.role > UserRole.Admin` → uživatel s rolí `Hrac` (role = 2, Superadmin = 0) splní podmínku, Adminu a Superadminovi průchod; ověř správnost číselného porovnání UserRole enum `[auto]` | M1, M4 | ⬜ |
| UF-15 | `GET /users/getCalendarMonth/:id` a `PUT /users/updateCalendarMonth/:id` — stejná role check logika jako UF-14; ověř že `UserRole.Admin = 1` takže `role > Admin` chytá jen role ≥ 2 (Hrac, SpravceClanku…) `[auto]` | M1, M4 | ⬜ |
| UF-16 | `POST /admin/users/bulk-ban`, `bulk-unban`, `bulk-role-change` — jsou deklarovány PŘED `POST /admin/users/:id/ban` v controlleru; NestJS matchuje statické segmenty před parametrickými → ověř, že routy `bulk-*` nejsou pohlceny parametrickým `:id` `[auto]` | M1, M4 | ⬜ |
| UF-17 | Admin `PATCH /admin/users/:id/admin-permissions` — vyžaduje `RolesGuard + @Roles(Superadmin)` (ne jen `AdminGuard`); ověř, že Admin bez superadmin role dostane 403 `[auto]` | M1, M4 | ⬜ |
| UF-18 | `GET /admin/recent-pages` — vyžaduje `@Roles(Superadmin, Admin, PJ)`, ale `PJ` je world-scoped role (dle architecture); ověř zda `PJ` v global UserRole enum existuje a má smysl zde `[auto]` | M1, M4 | ⬜ |
| UF-19 | `publicProfileV14` — friend-only profil (`profileVisibility='friends'`): admin obchází check, requester === target obchází; ověř, zda zablokovaný uživatel dostane 403 nebo 404 (anti-stalk konzistence) `[auto]` | M1, M4 | ⬜ |
| UF-20 | BE `assertCanModerate` — Admin smí DELETE/UNDELETE jen s `canModerateContent`; ověř, že toto je kontrolováno i pro `banUser`/`unbanUser` nebo jen pro DELETE akce `[auto]` | M1 | ⬜ |
| UF-21 | Přímé volání `DELETE /users/:id` — ověř zda uživatel smí smazat vlastní účet přes tento endpoint nebo zda je to vyhrazeno pro jiný flow `[auto]` | M1, M4 | ⬜ |

---

## C. Auth/role gating — FE

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-22 | `UsersPage` (`/ikaros/uzivatele`) — vyžaduje `requireAuth` loader; ověř, že neoprávněný uživatel je redirectován na login (ne 401 raw response) `[auto]` | M1, M4 | ⬜ |
| UF-23 | `PublicUserProfilePage` — `isAdmin` check: `role === Superadmin || role === Admin`; ověř, že SpravceClanku, SpravceGalerie, SpravceDiskuzi nevidí `TombstoneBanner` ani „Otevřít v administraci" tlačítko `[auto]` | M1, M4 | ⬜ |
| UF-24 | `PlatformAdminPage` — ověř routu a loader; admin-only guard musí vracet 403 pro Hrac/Ikarus, ne redirect na login `[auto]` | M1, M4 | ⬜ |
| UF-25 | `visibleTabsForRole()` — všichni vidí 3 taby (vč. Zpracovat); ověř, že `ZpracovatTab` se pro neregistrované typy tiše skryje (žádný crash) `[auto]` | M1, M3 | ⬜ |

---

## D. WS kontrakt — friendship eventy

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-26 | FE `useFriendshipsSocket` registruje 5 listenerů: `friend:request:incoming`, `friend:request:accepted`, `friend:request:declined`, `friend:request:canceled`, `friend:removed`; BE emituje `friendship.requested/.accepted/.rejected/.removed/.blocked` přes EventEmitter2 ale **žádný gateway nemá @OnEvent handler** který by tato interní eventy převedl na socket eventy pro klienty → real-time notifikace přátelství jsou zcela rozbité `[auto]` | M1, M5 | ⬜ |
| UF-27 | WS event `friend:request:incoming` má payload `{ friendshipId, from: { username } }` — ověř zda chybějící gateway (UF-26) je jediný problém nebo zda by payload neodpovídal FE rozhraní i po implementaci `[auto]` | M1, M2, M5 | ⬜ |
| UF-28 | WS event `friend:removed` invaliduje `['friends']` a `['friendship-status']`, ale ne `['pending-actions']` → po odebření přítele badge na Zpracovat tabu nezmizí, pokud tam byl pending request `[auto]` | M1, M5 | ⬜ |
| UF-29 | `friend:request:declined` handler na FE invaliduje `['friends', 'outgoing']`, ale tento query key se nikde nepoužívá (hook `useOutgoingFriendRequests` má key `['friends', 'outgoing']`) — ověř konzistenci `[auto]` | M1, M5 | ⬜ |
| UF-30 | Websocket docs (`docs/websocket-api.md`) neobsahují sekci pro friendship eventy → chybějící dokumentace real-time kontraktu `[auto]` | M1, M5 | ⬜ |

---

## E. Friendship business logika — BE

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-31 | `sendRequest` cooldown: BE zkontroluje `findLatestRejected(requesterId, recipientId)` — pouze pokud recipient odmítl mou žádost. Pokud jsem já odmítl recipientovu žádost, cooldown se nevztahuje. Je toto záměrná asymetrie? `[auto]` | M1 | ⬜ |
| UF-32 | `removeOrDecline` — pokud sender zruší pending žádost (hard delete), idempotent `findById` vrátí null a tiše ukončí; ověř, zda se emituje `friendship.removed` i v tomto případě `[auto]` | M1 | ⬜ |
| UF-33 | `block` — po zablokování se smažou všechny aktivní friendship records; ověř `removeAllActiveBetween` pokrývá i rejected záznamy (cool-down data) nebo jen pending/accepted `[auto]` | M1 | ⬜ |
| UF-34 | `listOutgoing` — N+1 query: pro každý outgoing request se volá `usersRepo.findById(recipientId)` synchronně v `Promise.all`; při 50+ žádostech jde o potenciální performance problém (žádná batch query) `[auto]` | M1 | ⬜ |
| UF-35 | `listBlocks` — stejný N+1 pattern jako UF-34; identický rizikový vzor `[auto]` | M1 | ⬜ |
| UF-36 | `FriendshipsPendingActionProvider.listForUser` — `listIncomingPendingForUser` vrátí vše, pak slice v paměti; ověř, zda repository má index pro `recipientId + status='pending'` (friendship.schema má compound index `recipientId+status`) `[auto]` | M1 | ⬜ |
| UF-37 | Race condition v `approveUsernameRequest` — race recheck kontroluje `findByUsername(requestedUsername)`; mezi rechecknutím a `usersRepo.update` může jiný admin schválit stejný username → Mongo `unique` constraint zachrání, ale error se propadne jako 500 místo 409 `[auto]` | M1 | ⬜ |

---

## F. Admin business logika — BE

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-38 | `getUsers` in-memory filter: `findAllPaginated` vrátí `total` z DB (nefiltrované), ale items jsou následně filtrovány v paměti (`isDeleted` a `deletionRequestedAt`); `total` v response neodpovídá počtu vrácených items → paginace je nekonzistentní `[auto]` | M1 | ⬜ |
| UF-39 | `banUser` — po banu se invaliduje `banCache` a revokují refresh tokeny; ověř, zda access token (krátkodobý JWT) zůstane funkční po dobu své platnosti, nebo zda je ban enforcement závislý výhradně na cache `[auto]` | M1 | ⬜ |
| UF-40 | `requestUserDeletion` — `SOLE_PJ_BLOCK`: pokud admin neidentifikuje Pomocného PJ, akce selže s 400; ověř, zda error payload `{ worlds: plan.blocking }` správně serializuje pole světů (pole objektů vs. pole ID) `[auto]` | M1 | ⬜ |
| UF-41 | `audit()` helper — failure je silently ignorována; pokud audit DB selže (MongoDB timeout), business akce proběhne ale audit log chybí; přijatelné? `[auto]` | M1 | ⬜ |
| UF-42 | `setAdminPermissions` — `canHandle` check pro `canManageAdmins` perm flag: service kontroluje `actor.role !== Superadmin` a vrátí 403; ale `AdminGuard` na controlleru slouží jako první vrstva; ověř zdvojení kontroly `[auto]` | M1 | ⬜ |

---

## G. FE — komponenty a UX

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-43 | `AuditLogTab` — `ACTION_LABELS[entry.action]` bude `undefined` pro všechny BE akce chybějící ve FE typu (UF-05); badge label bude prázdný string, `ACTION_CLASS[entry.action]` bude `undefined` → className crash nebo prázdná třída `[auto]` | M1 | ⬜ |
| UF-44 | `ZpracovatTab` — `countData.total === 0` při `countLoading=true` → spinner se nikdy nezobrazí (podmínka `countLoading && total === 0` je false pokud total > 0, ale true pokud loading a total=0 z default); ověř zda skeleton state je viditelný `[auto]` | M1 | ⬜ |
| UF-45 | `PendingGroup` — `key` pro item je `item.friendshipId ?? item.id ?? \`${type}-${idx}\``; pokud BE vrátí `friendshipId` i pro username request (nemá), nebo `id` chybí, klíče mohou kolizovat `[auto]` | M1 | ⬜ |
| UF-46 | `UsersTab` — `usePublicUsers` hook nezahrnuje auth token refresh po 401; ověř, zda `api.get` interceptor globálně řeší 401 re-login `[auto]` | M1 | ⬜ |
| UF-47 | `PublicUserProfilePage` — `profile.city` se nezobrazuje (není přítomno v `PublicBioSection` nebo `PublicProfileHeader`); ověř kompletnost renderu veřejného profilu `[human]` | M1 | ⬜ |
| UF-48 | `PublicProfileActions` — `kind === 'pending_outgoing'` zobrazí „Žádost čeká · Zrušit" s `status.friendshipId`; pokud `status.friendshipId` je undefined (BE getStatus nevrací friendshipId vždy), tlačítko nefunguje `[auto]` | M1, M2 | ⬜ |
| UF-49 | `FriendsTab` — empty state: skryje se, pokud friends > 0 OR outgoing > 0 OR blocked > 0; ověř zda blocked-only stav (`friends=0, outgoing=0, blocked>0`) zobrazuje sekci Zablokovaní bez chybějícího section title přátel `[human]` | M1 | ⬜ |
| UF-50 | `RoleChip` — `CHIP_CONFIG` neobsahuje `UserRole.Hrac` ani `UserRole.PJ`; chip správně vrátí `null`; ověř tyto role v testu `[auto]` | M3 | ⬜ |
| UF-51 | `UserCard` — `worldsCount` v `FriendsTab` je vždy `0` (placeholder); komponent zobrazí `0 světů`; ověř, zda to není zavádějící pro uživatele `[human]` | M1 | ⬜ |
| UF-52 | `UsersPage` silent redirect — `toast.error` se zavolá před `setParams`; ověř pořadí (state batching mohl způsobit toast bez přesměrování) `[auto]` | M1 | ⬜ |

---

## H. Edge cases a race conditions

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| UF-53 | `sendRequest` → `ALREADY_BLOCKED` (409) — FE `useSendFriendRequest.onError` nemá handler pro `ALREADY_BLOCKED` code; propadne do generic `parseApiError` toast `[auto]` | M1 | ⬜ |
| UF-54 | `useRemoveFriend` — onSuccess neemituje toast; uživatel neví, zda se odeber přítele podařil (confirm dialog se zavře, ale bez zprávy) `[human]` | M1 | ⬜ |
| UF-55 | Double-click prevence: `ConfirmDialog` v `FriendsTab` setuje `remove.isPending` jako `isPending` prop; ověř, zda tlačítko je opravdu disabled po prvním kliknutí (mutace pending) `[auto]` | M1 | ⬜ |
| UF-56 | `useAcceptFriendRequest` — po přijetí invaliduje `['friends']`, `['friendship-status']`, `['pending-actions']`; ověř, zda `['pending-actions', 'count']` (oddělený queryKey) je také invalidován (Badge update) `[auto]` | M1 | ⬜ |
| UF-57 | Admin bulk akce jsou sequential (for-loop bez concurrency limitu); při 100 userech × 100ms/op = 10s blokování event loop na BE; ověř existence timeoutu nebo batch limitu `[auto]` | M1 | ⬜ |
| UF-58 | `usernameChangedAt` — při schválení username requestu se uloží; ověř, zda cooldown pro další žádost (D-028 pattern) je správně počítán z tohoto pole nebo z `requestedAt` `[auto]` | M1 | ⬜ |
| UF-59 | `publicProfileV14` — `isTombstone=true` a requester je admin: `lastSeenAt` je vždy null (podmínka: `if (isTombstone || hiddenPresence)`); ověř, zda toto je záměrné chování pro admin view `[auto]` | M1 | ⬜ |

---

## Test coverage gaps

- `FriendshipsService.sendRequest` — žádný unit test pro cooldown (REJECTED_RECENTLY path) ani pro anti-stalk block (peer blokoval requestera) → kandidát na M7
- `FriendshipsService.removeOrDecline` — žádný test pro variantu sender cancels pending (hard delete) ani pro race when friendship already deleted → kandidát na M7
- `FriendshipsService.block` — side effect `removeAllActiveBetween` není testován → kandidát na M7
- `AdminService.getUsers` — in-memory filter (UF-38) bez testu pro paginaci s filtrem → kandidát na M7
- `AdminService.bulkBan/bulkUnban/bulkRoleChange` — žádné testy, pouze `AdminService` spec existuje pro jiné metody → kandidát na M7
- `MongoFriendshipsRepository` — žádný spec soubor pro repository vrstvu (cooldown query, compound index) → kandidát na M7
- FE `PublicProfileActions` — žádný test pro stavy `pending_incoming` / `pending_outgoing` / `blocked_by_me` → kandidát na M7
- FE `ZpracovatTab` — žádný test pro `PendingGroup` a loading/empty state → kandidát na M7
- FE `useFriendshipsSocket` — žádný test pro query invalidace při příchodu WS eventů → kandidát na M7
- FE `AuditLogTab` — žádný test, velký drift v typech → kandidát na M7

---

## Známá rizika

- **WS kontrakt gap (UF-26)**: Žádný `@OnEvent('friendship.*')` handler v žádném gateway; FE čeká 5 socket eventů které nikdy nepřijdou. Real-time notifikace přátelství jsou nefunkční. Uživatel musí ručně refreshovat stránku. Kritické.
- **Admin URL/metoda mismatch (UF-06, UF-07, UF-08)**: Tři admin mutace (admin-permissions, request-deletion, cancel-deletion) nikdy nedorazí na BE správný endpoint. Tlačítka v UI jsou tichá selhání. Kritické.
- **AdminAuditAction drift (UF-05, UF-43)**: FE typ postrádá 12 BE hodnot. Záznamy v audit logu pro account deletion, bulk akce a user create zobrazí prázdný badge. Střední závažnost (data se zobrazí, ale bez kontextu akce).
- **Sort/search kontrakt (UF-01, UF-02)**: Uživatelský adresář nikdy nefiltruje ani neřadí abecedně. Silent degradace funkcionality.
- **In-memory filter paginace (UF-38)**: Admin seznam uživatelů s filtry `hasPendingDeletion` nebo bez smazaných vrátí špatný `total` → frontend stránkování zobrazí nesprávný počet stránek.
