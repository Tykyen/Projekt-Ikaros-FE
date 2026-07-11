# bug — 02 Uživatelé, role, přátelé · dosažená L2 (spot L1) / cílová L2–L3 [auto]

Oblast: `docs/bug-plan/02-uzivatele-pratele.md` (UF-01…UF-59). Styl bug, registr `docs/bug-audit.md` (prefix N-).
BE `modules/users` + `modules/friendships` + `modules/pending-actions` + `modules/admin`; FE `features/users` + `features/friendships` + `features/admin/users`.

## Souhrn
**4 nové nálezy (2× 🟠, 2× 🟡), žádný 🔴.** Drtivá většina „kritických/known" bodů bug-planu 02 je v HEAD kódu už OPRAVENÁ (N-4 friendship gateway, N-6a URL/metoda drift, N-6b self-delete/admin-friendships, N-RUN-01/05 z 06-20 auditu). Bug-plan 02 byl psaný proti staršímu stavu. Zbývají hlavně kontraktní drobnosti, které dosud nikdo nechytil.

---

## 🆕 NOVÉ nálezy

### N-RUN — [A. Kontrakt] Řazení adresáře „Abecedně" (`sort=abc`) nikdy nefunguje
- **Kde:** FE `src/features/users/api/usePublicUsers.ts:20` `if (query.sort) params.sort = query.sort;` (posílá surové `'abc'`) + typ `PublicUsersSort = 'new' | 'abc'` (`src/shared/types/index.ts:1306`) + UI `UsersTab.tsx:117` `<option value="abc">Abecedně</option>` × BE `backend/.../users.repository.ts:303-308` `opts.sort === 'recent' ? {lastSeenAt:-1} : opts.sort === 'username' ? {usernameLower:1} : {createdAt:-1}`. BE `users.service.listPublic` (`:392,409`) typuje sort jako `'new'|'recent'|'username'`, `'abc'` nemapuje.
- **Dopad:** Uživatel v adresáři (`/ikaros/uzivatele` → tab Uživatelé) zvolí „Abecedně", FE pošle `sort=abc`, BE ho nerozpozná → spadne do default `createdAt:-1` (= Nejnovější). **Abecední řazení tiše nefunguje.** Silent degradace, ne crash.
- **Vzorec:** sesterský drift `?search=` vs `?q=` byl opraven (N-RUN-01, `usePublicUsers.ts:19`), ale hodnota `sort` reconcile nedostala. FE konvence `abc`, BE `username`.
- **Návrh:** buď v `usePublicUsers` mapovat `sort==='abc' → 'username'`, nebo přijmout `'abc'` alias v `findPublicPaginated`. (BE nemá `@IsIn` na sort — jen typová anotace query paramu.)
- **Klasifikace:** 🆕 (není v `bug-audit.md` ani `docs/dluhy.md`; N-6/C-08 řešilo jen `search`→`q`). = bug-plan UF-02.
- **L:** L2 (obě strany staticky ověřeny; červený e2e/test by dal L3-L4). Závažnost 🟠.

### N-RUN — [F. Admin] `getUsers` filtr `hasPendingDeletion` běží in-memory PO stránkování → nekonzistentní `total`/výběr
- **Kde:** BE `backend/.../admin/admin.service.ts:153-157` — `findAllPaginated(opts)` vrátí stránku + `total` z DB (bez pending filtru), pak `if (opts.hasPendingDeletion) items = items.filter(u => !!u.deletionRequestedAt)` a `return { items, total: result.total }`. FE spouštěč: `UsersFilters.tsx:66-79` checkbox „Jen s pending request" → `useAdminUsers.ts:109` `params.hasPendingDeletion='true'`.
- **Dopad:** Při zapnutém filtru je `total` počet VŠECH (nefiltrovaných) uživatelů, ale `items` jsou jen pending-deletion z právě staženého okna (≤ limit). → špatný počet stran ve stránkování + pending uživatelé mimo stažené okno (např. DB pozice 300 při limitu 20) jsou pro admina **neviditelní**. Filtr „čeká na smazání" tak nespolehlivě najde všechny účty.
- **Pozn.:** V kódu explicitně přiznáno komentářem `FIX-1` jako přijatý dluh („pro malé limity ≤100 přijatelné, DB-level refactor je dluh") — ale NENÍ zaneseno v `docs/bug-audit.md` ani `docs/dluhy.md`. Doporučuji buď formálně do `docs/dluhy.md`, nebo dotáhnout DB-level `deletionRequestedAt: {$exists:true}` do query.
- **Klasifikace:** 🆕 (netrackováno). = bug-plan UF-38.
- **L:** L1-L2 (logika ověřena čtením obou stran). Závažnost 🟠.

### N-RUN — [A. Kontrakt] `GET /friends/blocks` — FE typ `BlockedItem` driftuje od BE odpovědi
- **Kde:** FE typ `src/shared/types/index.ts:1521-1533` `BlockedItem { friendshipId; blockedAt; user{ …; deleted } }` × BE `backend/.../friendships/friendships.service.ts:379-414` `listBlocks` vrací `{ id: b.id, user: { id, username, displayName, avatarUrl, defaultAvatarType, role }, blockedAt }` — tj. klíč `id` (ne `friendshipId`) a v `user` **chybí `deleted`**.
- **Dopad:** malý. `BlockedRequestCard.tsx:42` čte `item.user.deleted` → vždy `undefined` → tombstone band (`deleted`) se u zablokovaného smazaného účtu nikdy nevykreslí. Pole `friendshipId` FE nikde nečte (unblock jede přes `item.user.id`, `:53`), takže `undefined` neškodí. Žádný crash.
- **Návrh:** BE `listBlocks` doplnit do `user` `deleted: user?.isDeleted ?? false` (jako `listForUser` na `:262`); FE typ přejmenovat `friendshipId → id` (nebo pole zahodit).
- **Klasifikace:** 🆕 (netrackováno). = bug-plan UF-03 (částečně — friendshipId je bez runtime dopadu, `user.deleted` má kosmetický dopad).
- **L:** L2. Závažnost 🟡.

### N-RUN — [F. Admin] Reset friendship cooldownu nezapisuje audit log
- **Kde:** BE `backend/.../admin/admin-friendships.service.ts:76-94` `resetCooldown()` — smaže rejected friendship (`friendsRepo.remove`), ale nikde nevolá `audit()`/`auditRepo.record`. Kontrast: FE má i label i typ `FRIENDSHIP_COOLDOWN_RESET` (`AuditLogTab.tsx:18,49`, `types/index.ts:221`), který BE **nikdy neprodukuje** (v BE `AdminAuditAction` typu `admin-audit-log.interface.ts` tato hodnota ani neexistuje).
- **Dopad:** Privilegovaná akce obcházející anti-abuse/anti-stalk cooldown (umožní útočníkovi po admin zásahu znovu spamovat žádosti) proběhne **beze stopy** v audit logu. Governance/audit-completeness mezera. Endpoint je `POST /admin/friendships/:id/reset-cooldown` (AdminGuard), spouští se z `FriendshipDebugTab`.
- **Návrh:** do `resetCooldown` přidat `auditRepo.record({ action: 'FRIENDSHIP_COOLDOWN_RESET', … })` + doplnit hodnotu do BE `AdminAuditAction` typu (FE ji už má).
- **Klasifikace:** 🆕 (netrackováno). Nad rámec bug-planu (admin-friendships je N-6b feature bez auditního bodu).
- **L:** L1. Závažnost 🟡.

---

## ♻️ Známé/opravené (NEHLÁSÍM jako nové) — potvrzeno proti HEAD

- **UF-26/27/28 (bug-plan „KRITICKÉ": friendship WS most chybí)** → **OPRAVENO = N-4.** `friendships/friendships.gateway.ts` mostuje `@OnEvent('friendship.*')` → Socket.IO `friend:request:incoming/accepted/declined/canceled`, `friend:removed`, `friend:blocked` do `user:{id}`. Payload `incoming` = `{friendshipId, from:{username}}` = FE `IncomingPayload`. FE `useFriendshipsSocket.ts:68` invaliduje i `['pending-actions']` na removed (UF-28 fixnuto).
- **UF-01 (search vs q)** → **OPRAVENO = N-RUN-01.** `usePublicUsers.ts:19` posílá `?q=`. BE `users.controller.ts:234` `@Query('q')`.
- **UF-06/07/08 (admin URL/metoda mismatch)** → **OPRAVENO = N-6a.** `useAdminSetAdminPermissions` `api.patch` (`useAdminUsers.ts:288`) = BE `@Patch admin-permissions` (`admin.controller.ts:252`); `useAdminRequestDeletion` `POST .../request-deletion` (`:232`) = BE `:211`; `useAdminCancelDeletion` `POST .../cancel-deletion` (`:255`) = BE `:233`.
- **UF-09 (hasPendingRequest vs hasPendingDeletion)** → **OPRAVENO = N-AD-02.** `useAdminUsers.ts:109` mapuje na `hasPendingDeletion='true'` = BE `@Query('hasPendingDeletion')` (`admin.controller.ts:123`). (Samotný BE filtr má ale bug — viz nález výše.)
- **UF-05/UF-43 (AdminAuditAction drift → prázdný badge)** → **OPRAVENO.** FE `AuditLogTab.tsx` `ACTION_LABELS`/`ACTION_CLASS` pokrývají všechny BE-produkované akce; FE typ (`types/index.ts:210-240`) obsahuje všech 28 klíčů (tsc clean = Record kompletní). Jediný přebytek `FRIENDSHIP_COOLDOWN_RESET` = FE-only label (viz nález výše).
- **UF-10/UF-12 (FriendListItem/counterpart drift)** → **OPRAVENO = D-NEW-friends-counterpart-drift.** `friendships.service.listForUser:254-264` vrací plný `friend` vč. `deleted`/`pendingDeletion`; `listOutgoing:327-334` + `friendships-pending-action.provider.ts:68-75` vrací plný `counterpart` (displayName/defaultAvatarType/role).
- **UF-11 (city/bio ve v14)** → **OK.** `users.service.publicProfileV14:542-546` mapuje `bio/city/characterName/characterBio/characterAvatarUrl`; FE typ `PublicUserProfile` je má (`types/index.ts:1285-1291`).
- **UF-13 (nechráněný `GET /users/profile/:id`)** → **OPRAVENO (2026-06-18).** Routa odstraněna; komentář `users.controller.ts:395-399`. Veřejný profil jen `profile/v14/:id` (JwtAuthGuard + gating).
- **UF-16 (bulk routy pohlceny `:id`)** → **FALSE ALARM.** `POST admin/users/bulk-ban|unban|role-change` (3 segmenty) nekoliduje s `admin/users/:id/ban` (4 segmenty); žádná `POST admin/users/:id` routa neexistuje. Pořadí deklarace irelevantní.
- **UF-18 (recent-pages PJ role)** → **OPRAVENO (N-14/D-053).** `admin.controller.ts:404` `@Roles(Superadmin, Admin)` — globální PJ(3) zrušen.
- **UF-59 (v14 lastSeenAt null pro admin tombstone)** → **by-design.** `:520` `if (isTombstone || hiddenPresence) lastSeenAt=null` — záměr i pro admin view (presence smazaného účtu se nezobrazuje).

## 🔓 Planý poplach (bug-plan „podezřelé")

- **UF-14/UF-15 (role check `role > UserRole.Admin`)** → **FALSE ALARM.** Enum `user.interface.ts:4` `Superadmin=1, Admin=2, PJ=3…` (nižší = vyšší práva). `role > Admin(2)` pustí Superadmin(1)+Admin(2), blokuje PJ(3)+. Bug-plan mylně tvrdil „Superadmin=0 / Hrac=2". Korektní. (Stejný vzor jako PP-63 v checkpointu 03.)
- **UF-04 (`FriendshipStatusKind 'cooldown'` mrtvá větev)** → neškodné. FE typ (`types/index.ts:1490`) má `'cooldown'`, BE `getStatus` (`friendships.service.ts:271-300`) ji nikdy nevrací; `PublicProfileActions.tsx:85` `kind !== 'cooldown'` je mrtvá, ale bezpečná větev. Dokumentováno. Neescaluji.
- **UF-17 (admin-permissions Superadmin-only)** → by-design R-05: `@Roles(Superadmin, Admin)` + service gate `setAdminPermissions:693-714` (Admin jen s `canManageAdmins`, flag canManageAdmins jen Superadmin). Korektní vrstvení.
- **UF-31 (cooldown asymetrie)** → záměr. `friendships.service.ts:98-100` komentář: cooldown platí jen když recipient odmítl moji žádost; sebe-poslání zpět povoleno. By-design.
- **UF-19 (v14 blokovaný uživatel)** → nejasné/produktové. `publicProfileV14` nekontroluje bloky → uživatel zablokovaný cílem VIDÍ jeho veřejný profil (pokud `public`). Blok brání jen žádostem/zprávám, ne prohlížení public profilu. Není zjevný bug (getStatus vrací 'none' anti-stalk, ale profil není friend-only). Ponechávám jako produktové rozhodnutí, neescaluji.

---

## Prošlé body (ověřeno OK, L1–L2, bez nového nálezu)
- **A. Kontrakt:** UF-01/05/06/07/08/09/10/11/12/43 (viz ♻️). UF-04 planý poplach.
- **B. Auth/role BE:** UF-13 (odstraněno), UF-14/15 (korektní enum), UF-16 (no collision), UF-17 (R-05 vrstvení), UF-18 (PJ removed), UF-20 `assertCanModerate` volán i pro BAN/UNBAN (`admin.service.ts:427,480`) i DELETE/UNDELETE (`:544,644` — actorFull z DB, N-AD-01), UF-21 (`DELETE /users/:id` v users.controlleru NEEXISTUJE; self-delete jen přes `POST me/deletion-request` + `@AllowPendingDeletion`).
- **C. Auth/role FE:** UF-22 (UsersPage přes IkarosLayout; role fallback Ikarus), UF-23 (`isAdmin = Superadmin||Admin`), UF-25 (`ZpracovatTab`/`PendingGroup` se skryje při 0 items nebo chybějícím rendereru, `ZpracovatTab.tsx:91`), UF-50 (`RoleChip` CHIP_CONFIG bez Hrac/PJ/Ikarus → `null`, `:69`).
- **D. WS:** UF-26/27/28 opraveno (N-4). UF-29 `declined` invaliduje `['friends','outgoing']` = key `useOutgoingFriendRequests.ts:8`. Sedí.
- **E. Friendship BE:** UF-31 (asymetrie by-design), UF-32 (`removeOrDecline` sender-cancel emituje `friendship.removed` s `wasPending`, gateway → `friend:request:canceled`, `:194-204`), UF-33 (`block` → `removeAllActiveBetween`, `:370`), UF-36 (pending provider slice, index — nekritické), UF-37 (`approveUsernameRequest` race recheck → 409 `USERNAME_TAKEN_RECHECK`, DB unique jako druhá pojistka).
- **F. Admin BE:** UF-38 (NÁLEZ), UF-39 (`banUser` revoke refresh + banCache; access JWT přežije do expirace — přijaté, `JwtAuthGuard` gate na ban), UF-40 (`SOLE_PJ_BLOCK` `worlds: plan.blocking` = pole objektů), UF-41 (`audit()` best-effort silent — přijatelné), UF-42 (dvojí kontrola RolesGuard+service — by-design).
- **G. FE:** UF-44 (`countLoading && total===0` → skeleton OK), UF-45 (PendingGroup key `friendshipId ?? id ?? type-idx` — bez kolize napříč skupinami), UF-52 (UsersPage toast+setParams v useEffect, ne render — OK), UF-46 (401 řeší globální `api` interceptor — mimo tuto oblast).

## Neprošel plně (nižší priorita, čistě čtení)
- **UF-34/35 + pending-provider N+1:** `listOutgoing`/`listBlocks`/`FriendshipsPendingActionProvider.listForUser` volají `usersRepo.findById` per-item v `Promise.all` (ne batch `findByIds`, který repo MÁ a `admin-friendships.toViews:102` používá). Perf, ne korektnost; ≤ 50-100 items → nízká priorita. Nezvednuto do N-RUN.
- **G. UX [human]:** UF-47 (city render), UF-49 (blocked-only empty state), UF-51 (worldsCount placeholder), UF-54/55 (remove toast/double-click) — čistě `[human]`, neověřováno staticky.

## PROOF-REQUESTy
- **N-RUN sort=abc:** M7 test — FE `usePublicUsers`/BE `findPublicPaginated` s `sort:'abc'` → očekávat `usernameLower:1` (dnes selže, řadí `createdAt:-1`). Po mapování zelený. Nebo e2e: adresář „Abecedně" → ověřit pořadí.
- **N-RUN getUsers filtr:** M7 test `AdminService.getUsers({hasPendingDeletion:true, page/limit})` s daty přesahujícími 1 stránku → očekávat `total` = počet pending a items jen pending napříč stránkami (dnes total = celkový count, items jen z okna).
- **N-RUN blocks drift:** type-sync FE `BlockedItem` ↔ BE `listBlocks` návratový tvar; M7 render `BlockedRequestCard` se smazaným blokovaným účtem → tombstone band (dnes chybí).
- **N-RUN cooldown audit:** M7 test `resetCooldown` → očekávat `auditRepo.record` s `FRIENDSHIP_COOLDOWN_RESET` (dnes 0 volání).
