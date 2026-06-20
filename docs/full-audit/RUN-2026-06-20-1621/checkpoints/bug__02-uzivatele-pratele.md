# bug / 02-uzivatele-pratele — checkpoint RUN-2026-06-20-1621

## Pokrytí

**FE soubory:**
- `src/features/users/api/usePublicUsers.ts`
- `src/features/users/api/usePendingActions.ts`
- `src/features/users/api/usePublicUserProfile.ts`
- `src/features/users/pages/UsersPage.tsx`
- `src/features/users/pages/PublicUserProfilePage.tsx`
- `src/features/users/components/PublicProfile/PublicProfileActions.tsx`
- `src/features/users/components/PublicProfile/PublicBioSection.tsx`
- `src/features/users/components/PublicProfile/PublicProfileHeader.tsx`
- `src/features/users/components/tabs/FriendsTab/FriendsTab.tsx`
- `src/features/users/components/tabs/UsersTab/UsersTab.tsx`
- `src/features/users/components/tabs/ZpracovatTab/ZpracovatTab.tsx`
- `src/features/users/components/usersPageTabs.helpers.ts`
- `src/features/friendships/api/useFriendshipMutations.ts`
- `src/features/friendships/api/useFriendshipStatus.ts`
- `src/features/friendships/api/useBlockedFriends.ts`
- `src/features/friendships/api/useFriends.ts`
- `src/features/friendships/api/useOutgoingFriendRequests.ts`
- `src/features/friendships/hooks/useFriendshipsSocket.ts`
- `src/features/friendships/components/BlockedRequestCard.tsx`
- `src/features/admin/users/api/useAdminUsers.ts`
- `src/features/admin/users/components/AuditLogTab/AuditLogTab.tsx`
- `src/shared/types/index.ts` (části BlockedItem, FriendshipStatusKind, AdminAuditAction)
- `src/app/router.tsx` (area-02 routy)

**BE soubory:**
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.service.ts` (listPublic, publicProfileV14, listBlocks)
- `backend/src/modules/users/interfaces/user.interface.ts`
- `backend/src/modules/friendships/friendships.controller.ts`
- `backend/src/modules/friendships/friendships.service.ts`
- `backend/src/modules/friendships/friendships.gateway.ts`
- `backend/src/modules/friendships/interfaces/friendship.interface.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.service.ts` (getUsers, setAdminPermissions)
- `backend/src/modules/admin/interfaces/admin-audit-log.interface.ts`

**Osy pokryté:** A (FE↔BE kontrakt), B (Auth/role gating BE), C (Auth/role gating FE), D (WS kontrakt friendship), E (Friendship business logika — jen L1), F (Admin business logika — L1-L2), G (FE komponenty), H (Edge cases)

**M-metody:** M1 (čtení kódu), M2 (kontrakt cross-ref BE↔FE), M4 (auth gating logika), M5 (WS — kontrola gateway existence)

---

## Dosažená L vs cílová L

**L2 / L3 (cíl L3)**

- Kontrakt: L2 (cross-ref FE↔BE potvrzen bez spuštění testů)
- WS: L2 (gateway existuje, event mapping zkontrolován kódem)
- Auth gating: L2 (logika ověřena čtením + enum hodnotami)
- Business logika E/F: L1-L2 (čtení service kódu, bez test spuštění)
- Blocker pro L3: nutný live test / proof-run testů (M3/M7)

---

## Nálezy

### N-RUN-01 — [A] UF-01: search parametr nikdy nedorazí na BE 🔴
- **Kde:** `src/features/users/api/usePublicUsers.ts:17` vs `backend/.../users.controller.ts:218`
- **Důkaz:** FE posílá `params.search = query.search`, BE controller čte `@Query('q') q`. Jiný název query parametru → vyhledávání vždy vrátí nefiltrované výsledky.
- **Dopad:** Pole „Hledat podle přezdívky" v UsersTab je tiché selhání — výsledky se nefiltrují.
- **Návrh:** FE `usePublicUsers` změnit `params.search` → `params.q`; nebo BE alias `q` → přijímat i `search`.
- **L2** · 🔓 otevřený (původně UF-01 v plánu)

### N-RUN-02 — [A] UF-02: sort 'abc' nerozpoznán BE → vždy 'new' 🟠
- **Kde:** `src/features/users/components/tabs/UsersTab/UsersTab.tsx:111` (option `value="abc"`) vs `backend/.../users.service.ts:365` (sort?: `'new' | 'recent' | 'username'`)
- **Důkaz:** FE `PublicUsersSort = 'new' | 'abc'`, BE akceptuje pouze `'new' | 'recent' | 'username'`. BE defaultuje na `'new'` pro neznámé hodnoty. Řazení Abecedně (abc) nevede k řazení dle username.
- **Dopad:** Výběr „Abecedně" neřadí výsledky. Tichá degradace.
- **Návrh:** FE změnit `'abc'` → `'username'`; nebo BE přijmout alias `'abc'` → `'username'`.
- **L2** · 🔓 otevřený (původně UF-02 v plánu)

### N-RUN-03 — [A] UF-03: BlockedItem.friendshipId vždy undefined — key kolize 🟠
- **Kde:** `backend/.../friendships.service.ts:395` vrací `{ id, user, blockedAt }`, FE typ `src/shared/types/index.ts:1261` deklaruje `{ friendshipId, user, blockedAt }`
- **Důkaz:** BE `listBlocks` vrací pole jako `id`, FE `BlockedItem` očekává `friendshipId`. V `FriendsTab.tsx:186` `blocked.map((b) => <BlockedRequestCard key={b.friendshipId} .../>)` — `b.friendshipId` je vždy `undefined` → všechny blocked karty mají key `undefined` (React dev warning + nestabilní reconciliation).
- **Dopad:** Potenciální re-render bug při kolizi klíčů, React dev warning. Funkčnost unblock není narušena (používá `item.user.id`).
- **Návrh:** BE přejmenovat `id` → `friendshipId` v return objektu `listBlocks`; nebo FE `BlockedItem` přejmenovat `friendshipId` → `id` a opravit key v FriendsTab.
- **L2** · 🔓 otevřený (původně UF-03 v plánu)

### N-RUN-04 — [A] UF-04: FriendshipStatusKind 'cooldown' mrtvá větev 🟡
- **Kde:** `src/shared/types/index.ts:1223-1230` (FE má `'cooldown'`), `backend/.../friendship.interface.ts:20-26` (BE `FriendStatusKind` bez `'cooldown'`)
- **Důkaz:** BE `getStatus()` nikdy nevrátí `kind: 'cooldown'`; cooldown je jen interní error `REJECTED_RECENTLY` v `sendRequest`. FE `PublicProfileActions.tsx:84` kontroluje `kind !== 'cooldown'` — tato větev nikdy není splněna jinak než defaultem.
- **Dopad:** Mrtvý kód v FE typech; žádný runtime crash. Typová nesrovnalost zvyšuje zmatek.
- **Návrh:** Odstranit `'cooldown'` z FE `FriendshipStatusKind` (nebo dokumentovat že je rezervovaný pro budoucí BE implementaci).
- **L2** · 🔓 otevřený (původně UF-04 v plánu)

### N-RUN-05 — [A/G] UF-48: pending_outgoing a pending_incoming tlačítka se nikdy nezobrazí 🔴
- **Kde:** `backend/.../friendships.service.ts:274` return typ `{ kind: FriendStatusKind }`, `src/features/users/components/PublicProfile/PublicProfileActions.tsx:137` podmínka `status?.friendshipId &&`
- **Důkaz:** BE `getStatus()` vrací pouze `{ kind }` bez `friendshipId`. FE `FriendshipStatusResponse.friendshipId?: string` je vždy `undefined`. `PublicProfileActions.tsx:137` render pro `pending_outgoing` a `:147` pro `pending_incoming` podmíněny `status?.friendshipId &&` — obě podmínky jsou vždy `false`. Tlačítka „Žádost čeká · Zrušit", „Odmítnout", „Přijmout" se nikdy nezobrazí z veřejného profilu.
- **Dopad:** Uživatel nemůže přijmout ani odmítnout žádost o přátelství z profilové stránky. Funkce dostupná jen přes ZpracovatTab.
- **Návrh:** Rozšířit BE `getStatus()` return type o `friendshipId?: string` (přidat `friendship.id` do returnu pro pending stavy).
- **L2** · 🔓 otevřený (původně UF-48 v plánu)

### N-RUN-06 — [A] UF-05+UF-43: AdminAuditAction drift — 11 chybějících hodnot 🟠
- **Kde:** `src/shared/types/index.ts:174-185` (10 FE hodnot) vs `backend/.../admin-audit-log.interface.ts:1-25` (21 BE hodnot)
- **Důkaz:** FE chybí: `USER_CREATE, DELETE, UNDELETE, DELETION_REACTIVATED, HARD_DELETE, PERMISSIONS_CHANGE, ACCOUNT_SELF_DELETE_REQUEST, ACCOUNT_DELETE_REQUEST, ACCOUNT_DELETE_CANCEL, ACCOUNT_SELF_REACTIVATE, ACCOUNT_HARD_DELETE, BULK_BAN, BULK_UNBAN, BULK_ROLE_CHANGE` (14 BE hodnot, z toho 11 opravdu chybí — `ADMIN_PERMISSIONS_CHANGE` na obou). V `AuditLogTab.tsx:115` `ACTION_CLASS[entry.action]` vrátí `undefined` pro chybějící klíče → CSS className `undefined` (prázdná třída, žádný crash, ale vizuálně špatně). `ACTION_LABELS[entry.action]` → `undefined` → badge zobrazí prázdný text.
- **Dopad:** Admin audit log špatně zobrazuje typy akcí pro 11+ kategorií (account deletion, bulk akce, vytvoření uživatele). Data jsou správná, ale kontext akce chybí.
- **Návrh:** Doplnit chybějící hodnoty do FE `AdminAuditAction` typu a do `ACTION_LABELS/ACTION_CLASS` map v AuditLogTab.
- **L2** · 🔓 otevřený (původně UF-05+UF-43 v plánu)

### N-RUN-07 — [A] UF-09: hasPendingRequest vs hasPendingDeletion — admin filter nefunguje 🟠
- **Kde:** `src/features/admin/users/api/useAdminUsers.ts:107` vs `backend/.../admin.controller.ts:84`
- **Důkaz:** FE posílá `params.hasPendingRequest = 'true'`, BE čte `@Query('hasPendingDeletion') hasPendingDeletion`. Jiný query parametr → filtrování „pending deletion" v admin tabulce nefunguje, vždy vrátí všechny uživatele.
- **Dopad:** Admin dashboard nemůže filtrovat uživatele čekající na smazání.
- **Návrh:** Sjednotit: buď FE → `hasPendingDeletion`, nebo BE alias `hasPendingRequest`.
- **L2** · 🔓 otevřený (původně UF-09 v plánu)

### N-RUN-08 — [F] UF-38: Admin getUsers — total neodpovídá filtrovaným items 🟠
- **Kde:** `backend/.../admin.service.ts:119-130`
- **Důkaz:** `findAllPaginated` vrátí `total` z DB (nefiltrované). Poté se aplikuje in-memory filter pro `isDeleted` a `deletionRequestedAt`. Return: `{ items: filteredItems, total: result.total }` — `total` je DB count, `items.length` je filteredCount. Paginace na FE počítá `totalPages = ceil(total/limit)` → zobrazí víc stránek než existuje.
- **Dopad:** Admin tabulka zobrazuje špatný počet stránek při použití filtrů `includeDeleted=false` nebo `hasPendingDeletion=true`.
- **Návrh:** Přidat DB-level filtrování do `findAllPaginated` (index na `isDeleted`, `deletionRequestedAt`); nebo přepočítat `total` po filtru.
- **L1** · 🔓 otevřený (původně UF-38 v plánu)

### N-RUN-09 — [D] UF-26: FriendshipsGateway existuje, ale event 'friendship.rejected' → socket 'friend:request:declined' — payload nesoulad 🟡
- **Kde:** `backend/.../friendships.gateway.ts:54-61` emituje `{ friendshipId, by: { username } }`, FE `useFriendshipsSocket.ts:55-58` `friend:request:declined` handler nečte payload (jen invaliduje queries)
- **Důkaz:** N-4 je opraveno, gateway existuje. Ale `onRejected` vrací `by` (requester zná kdo odmítl), FE handler payload ignoruje — žádný problém v praxi (jen invalidace), ale informace se zahazuje.
- **Dopad:** Informace o tom, kdo odmítl žádost, nedorazí uživateli (žádný toast). Funkčně: queries se invalidují korektně.
- **Návrh:** Doplnit toast pro declined (informovat requestera kdo odmítl); nebo explicitně zdokumentovat že toto je záměrné.
- **L2** · 🔓 otevřený (nový nález)

---

## Zamítnuté hypotézy z plánu (false-positives / fixnuté)

| UF | Verdikt | Důvod |
|---|---|---|
| UF-06 | ✅ FIXNUT | `useAdminSetAdminPermissions` nyní volá `api.patch(...)` — správná metoda |
| UF-07 | ✅ FIXNUT | `useAdminRequestDeletion` volá `POST /admin/users/${userId}/request-deletion` — sedí BE |
| UF-08 | ✅ FIXNUT | `useAdminCancelDeletion` volá `POST /admin/users/${userId}/cancel-deletion` — sedí BE |
| UF-10 | ✅ FALSE-POS | BE `listAcceptedForUser` vrací `deleted: u?.isDeleted`, `pendingDeletion: !!u?.deletionRequestedAt` |
| UF-11 | ✅ FALSE-POS | `publicProfileV14` mapuje `bio`, `city` do profilu; FE renderuje (viz `PublicProfileHeader`) |
| UF-12 | ✅ FIXNUT | `listOutgoing` vrací `counterpart` s `defaultAvatarType` a `role` |
| UF-13 | ✅ FIXNUT | Endpoint `GET /users/profile/:id` byl odebrán (komentář v controlleru ř.380-384) |
| UF-14 | ✅ FALSE-POS | `role > UserRole.Admin(2)` → Hráč(5) > 2 = true → 403; Admin(2) > 2 = false → pass. Logika správná. |
| UF-15 | ✅ FALSE-POS | Stejná logika jako UF-14 — správná |
| UF-16 | ✅ FALSE-POS | `bulk-ban` = 2 segmenty po `/users/`, `:id/ban` = 3 segmenty — různé délky, bez konfliktu |
| UF-17 | ✅ BY-DESIGN | `@Roles(Superadmin, Admin)` na controlleru + service rozlišuje `canManageAdmins` flag — záměrné rozšíření |
| UF-18 | ✅ FIXNUT | Komentář `R-01/N-14 — globální PJ zrušen`; `@Roles(Superadmin, Admin)` |
| UF-19 | ✅ BY-DESIGN | Friend-only profil dostane 403; blocked user — visibility závisí na `findActiveBetween` (přijatelné) |
| UF-20 | ✅ FALSE-POS | `banUser` / `unbanUser` jde přes `assertCanModerate` + hierarchii; `canModerateContent` check oddělený pro DELETE |
| UF-21 | ✅ BY-DESIGN | `DELETE /users/:id` = self-delete + admin-delete; self-delete flow dokumentován |
| UF-22 | ✅ OK | `requireAuth` loader na `/ikaros/uzivatele` existuje |
| UF-23 | ✅ BY-DESIGN | `isAdmin = Superadmin || Admin` — správné (SpravceClanku atd. nejsou platform admins) |
| UF-24 | ✅ OK | `RoleGuard` vrátí `ForbiddenPage` — 403, ne redirect |
| UF-25 | ✅ FALSE-POS | `visibleTabsForRole` vrací vždy 3 taby bez podmínek — no crash |
| UF-26 | ✅ FIXNUT (N-4) | `FriendshipsGateway` s `@OnEvent('friendship.*')` existuje |
| UF-27 | ✅ OK | Payload sedí (viz gateway events + FE interface typy) |
| UF-28 | ✅ FALSE-POS | `friend:removed` invaliduje `['pending-actions']` → prefix match smaže vše včetně pending requests |
| UF-29 | ✅ FALSE-POS | `useOutgoingFriendRequests` key = `['friends', 'outgoing']`; socket invaliduje stejný klíč → match |
| UF-30 | ✅ DOCS-GAP | Ws API doc neobsahuje friendship sekci — dokumentační dluh, ne runtime bug |
| UF-40-59 (E/F/G/H mimo zachycené) | ⚠️ L1 ONLY | Cooldown asymetrie (UF-31), N+1 (UF-34/35), batch bez limitu (UF-57) — čtením kódu suspektní, ale bez L3 důkazu |
| UF-44 | ✅ FALSE-POS | `countLoading && total === 0` → pravda při prvním načtení (default 0) → skeleton se zobrazí |
| UF-47 | ✅ FIXNUT | `PublicProfileHeader.tsx:53-56` renderuje `profile.city` |
| UF-52 | ✅ MINOR UX | Toast před redirect → obojí proběhne; žádná ztráta funkce |
| UF-55 | ✅ OK | `ConfirmDialog` má `disabled={isPending}` na cancel + `loading={isPending}` na confirm |
| UF-56 | ✅ FALSE-POS | TanStack Query prefix invalidation: `['pending-actions']` smaže i `['pending-actions', 'count']` |
| UF-59 | ✅ BY-DESIGN | Admin vidí tombstone, ale `lastSeenAt=null` — anonymizace je záměrná |

---

## PROOF-REQUEST

1. **PR-01 (N-RUN-01+02 verify):** Spustit `curl -H "Authorization: Bearer <token>" GET /api/users?search=admin&sort=abc` → ověřit že BE nefiltruje a sort není abecední. Spustit totéž s `?q=admin&sort=username` → ověřit filtraci a abecední řazení. Dokazuje UF-01+UF-02 jsou reálné runtime bugy.

2. **PR-02 (N-RUN-03 key kolize):** Zablokovat ≥2 uživatele, otevřít FriendsTab sekci Zablokovaní, v devtools console zkontrolovat React Warning „Each child in a list should have a unique key prop" a `key=undefined`. Dokazuje UF-03 v praxi.

3. **PR-03 (N-RUN-05 tlačítka chybí):** Otevřít profil uživatele s pending žádostí → ověřit že tlačítka Odmítnout/Přijmout nejsou viditelná (ačkoliv existuje friendship). Zkontrolovat `GET /api/friends/status/:id` response body — nemá `friendshipId`. Dokazuje UF-48.

4. **PR-04 (N-RUN-07 admin filter):** V admin tabulce zaškrtnout filtr `hasPendingDeletion` → ověřit network tab, že BE dostane `hasPendingRequest=true` místo `hasPendingDeletion=true` → seznam nefiltruje.

5. **PR-05 (UF-57 bulk performance):** Spustit `POST /api/admin/users/bulk-ban` s 50+ userId a měřit response time. Ověřit absence parallel limit (for-loop sequential). Nízká priorita, spíše performance risk.
