# role — 01 Auth & účet / guest · dosažená L2 (spot L3) / cílová L2–L3, kritické L4 [auto]

Oblast: `docs/role-plan/01-auth-ucet-guest.md` (AU-01…AU-23 + transitions T-1..4). Styl role, registr `docs/role-audit.md` (prefix R-).
BE `common/guards` (Jwt/OptionalJwt/GuestOrMember/Roles), `auth` (controller/service/strategy/module), `security-tokens`, `users` (me/*, deletion, ban-cache, cleanup cron), `common/decorators/allow-pending-deletion`.
FE `shared/api/client.ts`, `app/router.tsx`, `features/auth` (useAuth, LoginModal, ReactivateAccountModal), `useGlobalChat`.

## Souhrn
**1 nový nález (🟡 low, PA/robustness) + 3 doc/plán nepřesnosti.** Oblast je v **výborném stavu**: obě známé kritické díry (R-07 mrtvý account-state gate, R-08 nevynucený ban) jsou v HEAD **opravené a ověřené** proti kódu; navíc přibyla defense-in-depth, kterou plán ještě nezná (refresh-flow ban/delete gate, OptionalJwt degradace banned/deleted na anonyma). Jádro (per-request gate `.id`, ValidationPipe whitelist, 404-mask privátního světa, security-token expirace v service) drží. Nový nález se týká **15.8 host/guest tokenu**, který plán oblasti 01 vůbec nepokrývá (bere `guest` jen jako anon bez tokenu).

---

## 🆕 NOVÝ nález

### R-RUN — [A. Guest povrch / PA] Guest (15.8 host) token na `JwtAuthGuard`-only endpointu → 401 `DELETED` → FE ho odhlásí jako „smazaný účet" a redirectne na login
- **Kde:** BE `backend/src/modules/auth/strategies/jwt.strategy.ts:24-31` (guest token → `{ id: anon_<uuid>, isGuest, role: Guest }`) → `common/guards/jwt-auth.guard.ts:38-48` (`request.user?.id = 'anon_…'` → `usersRepo.findById` má `ObjectId.isValid` guard [`base-mongo.repository.ts:8`] → **null** → `if (!user || user.isDeleted) throw 401 { code:'DELETED' }`). FE `src/shared/api/client.ts:86-92` (`status===401 && (code==='DELETED'||'DELETION_PENDING')` → `logoutAndRedirectToLogin()` = `saveLoginIntent` + `navigate('/?openLogin=1')`). Anon token se přitom přilepí na **každý** request [`client.ts:55-62` `accessTokenAtom ?? anonSessionAtom.token`], DELETED-handler anon vs member session **nerozlišuje**.
- **Dopad:** Host (guest v Hospodě) NEMÁ DB účet; plný member gate v `JwtAuthGuard` je pro něj správně neprůchozí, ale vrací sémanticky zavádějící kód `DELETED` (host není smazaný účet). Když FE hosta pošle na jakýkoli JWT-only endpoint s guest tokenem, interceptor to vyhodnotí jako „účet smazán" → vyklidí session + **odhodí hosta na login** s uloženým intentem. Není to eskalace ani leak (host dostane MÉNĚ, ne víc) — čistě UX/robustnost. Strukturálně dosažitelné (interceptor lepí anon token globálně); reálná četnost závisí na tom, zda guest-viditelný layout spustí JWT-only dotaz (většina hooků je gated na member token `enabled:!!accessToken`, presence badge jede přes `GuestOrMemberGuard`, takže dnes spíš latentní).
- **Vzorec:** 15.8 guest token je nová persona, kterou plán oblasti 01 nezná (počítá jen s `guest`=anon bez tokenu). Dvě pojistky (`GuestOrMemberGuard` scope + `UserRole.Guest=99` sentinel) drží *autorizaci*, ale ne *chybový kód* na chybně zacíleném plain-`JwtAuthGuard`.
- **Návrh:** buď v `JwtAuthGuard` early-reject `request.user?.isGuest` s guest-specifickým kódem (403 `GUEST_NOT_ALLOWED`) místo dovést ho do `DELETED` větve; NEBO na FE podmínit DELETED-logout větev tím, že existuje **member** token (ne jen anon session). Preferovat BE (autoritativní kód).
- **Klasifikace:** 🆕 (není v `role-audit.md` ani `docs/dluhy.md`).
- **L:** L2 (obě strany staticky ověřeny; M8 round-trip guest-token→JWT-only endpoint by dal L3 a potvrdil reálnou dosažitelnost). Závažnost 🟡 low.

---

## 📝 Doc / plán nepřesnosti (kód OK, plán/matice nepřesné — NEopravovat kód)

- **AU-09/T-1..4 — „access token žije až 7 dní" je zastaralé → dnes 3 dny.** `auth.module.ts:35-41` default `JWT_EXPIRES_IN='3d'` (rozhodnutí uživatele 2026-06-21). Plán `01-auth-ucet-guest.md` (ř. 6/35/93), komentář `jwt-auth.guard.ts:40` i `allow-pending-deletion.decorator.ts:9` pořád píšou „7 dní". Bezpečnostně bezvýznamné (gate je per-request), ale doc drift. Doporučení: srovnat komentáře + plán na 3 d.
- **AU-14 — `POST /auth/resend-verification` je JWT-gated, ne public.** `auth.controller.ts:270-281` má `@UseGuards(JwtAuthGuard)` (resend na email přihlášeného usera dle `user.id`). To je **správné** — plán ho chybně řadí mezi „bez auth". Oprav plán, ne kód.
- **AU-15 — `POST /auth/logout` je záměrně BEZ guardu** (`auth.controller.ts:197-211`, idempotentní, čte refresh z cookie/body → funguje i s vypršelým access tokenem). Jen `logout-all` (`:213`) má `JwtAuthGuard`. Plán tvrdí „JWT povinné" pro oba — u `logout` je guardless **správně**. Oprav plán.
- **AU-04 — endpoint `GET /users/profile/:id` (OptionalJwt) už NEEXISTUJE** (`users.controller.ts:395` komentář: odstraněn 2026-06-18 kvůli scrape/friend-leak). Veřejný profil jede jen přes `profile/v14/:id` za **`JwtAuthGuard`** (přísnější než plán předpokládá). Premisa AU-04 je zastaralá — žádný anon profile-leak není.

---

## ♻️ Známé/opravené (NEHLÁSÍM jako nové) — potvrzeno proti HEAD

- **R-07 (KRIT — mrtvý account-state gate, `sub` vs `id`)** → **OPRAVENO.** `jwt-auth.guard.ts:38` čte `request.user?.id`; per-request gate `!user||isDeleted`→401 DELETED, `deletionRequestedAt`&!@AllowPending→401 DELETION_PENDING reálně běží.
- **R-08 (VYS — nevynucený ban)** → **OPRAVENO + rozšířeno.** Ban `bannedAt` se čte v `login` (`auth.service.ts:217`), per-request `JwtAuthGuard:51`, **navíc `refresh` (`auth.service.ts:446`, FIX-6)** a `reactivateDeletion` (`:349`) i `loginTotp` (`:282`) — banned/deleted už neobejde přes žádnou z bran. FE `client.ts:78` BANNED handler ožil.

## 🔓 Ověřeno bez díry (L1–L2, výběr)

- **AU-08/09** per-request gate `.id`, 3d token → gate nezávislý na TTL. ✅L2
- **AU-11** FE: `client.ts:86-92` DELETED/PENDING→instant logout; `LoginModal.tsx:100` `deletion_pending`→`ReactivateAccountModal`→`/auth/reactivate-deletion`. ✅L2
- **AU-12** `@AllowPendingDeletion` grep = **jen** `GET`+`DELETE /users/me/deletion-request` (`users.controller.ts:350,359`); ostatní výskyty = definice + komentář v ban-cache + spec. Žádný jiný endpoint dekorátor nemá. ✅L2
- **AU-13** OptionalJwtAuthGuard je **přísnější** než plán čekal: `optional-jwt-auth.guard.ts:35-39` (PT-35e) dotahuje DB, `!dbUser||isDeleted||bannedAt`→degrade na anonyma; role z DB (freshness). Pending (`deletionRequestedAt`) se záměrně nechá číst (read-only hold). ✅L2
- **AU-03** privátní svět → `applyDetailScope` (`worlds.service.ts:240-273`) 404 `WORLD_NOT_FOUND` pro anon i non-membera (+admin vidí jen shell metadata). ✅L2
- **AU-05/06** FE `requireAuth` (`router.tsx:148-161`) redirect `/?openLogin=1`+intent; world sub-routy přes `memberOnly`→`WorldMembershipGuard` redirect na `/svet/:slug` (ne ForbiddenPage). ✅L2
- **AU-07** presence `enabled:!!token||!!anon` (`useGlobalChat.ts:75`); BE `GuestOrMemberGuard`. ✅L2
- **AU-17** `security-tokens.service.consume/peek` ověřuje typ+`usedAt`+`expiresAt` v **service** (`:62-78`), ne jen existenci; křížové použití typu tokenu → INVALID_TOKEN. ✅L2 (DD last-line)
- **AU-19 (P4 red-team)** `me/*` operují nad `req.user.id`; `PATCH :id` self/admin check; `UpdateUserDto` **nemá `role`** + global ValidationPipe `whitelist+forbidNonWhitelisted` (`main.ts:68-69`) → cizí `role`/`userId` v body = 400 (žádná self-eskalace). ✅L2
- **AU-21** hard-delete (`account-cleanup.cron.ts` → `anonymizeForHardDelete` `users.repository.ts:214`) nastaví `isDeleted:true` + přepíše email → `reactivateDeletion` selže (login původním emailem `INVALID_CREDENTIALS`, případně `isDeleted`→DELETED). ✅L2
- **AU-22/23** `displayName @MaxLength(32)` = FE 32 (PP-11 vyřešeno); `themeId @IsIn(THEME_IDS)`. ✅L2
- **RA-3** `@AllowPendingDeletion` grep čistý (AU-12). ✅
- Guest sentinel: `UserRole.Guest=99` + `role<=X` gating → guest neprojde žádný `@Roles`/práh; `GuestOrMemberGuard` scope-uje na Hospodu. ✅L1
- **T-2/T-3** self-delete→`user.deletion.requested`→revoke refresh (`auth.service.ts:379`); reaktivace přes reset (`resetPasswordByToken` wasPending) i `reactivateDeletion` čistí flagy + `banCache.invalidate`. ✅L1

## Prošlé letmo / nižší priorita (L1, bez podezření)
- AU-01 public routy: `router.tsx:177-214` — žádný `requireAuth` loader na `/`, vesmiry, clanky, galerie, novinky, napoveda, podminky. ✅
- AU-02 OptionalJwt inventura: worlds ✅ (otevřeno), zbylé (characters/universe/ikaros-gallery/news/articles/world-news controllery) jen grep-potvrzeny jako `OptionalJwtAuthGuard` — per-endpoint scope čtení `user` NEotevřeno do L2 (nižší priorita, kryto oblastmi 02/03/05).
- AU-16 enumerace check-username/email: `@Throttle 60/min`, akceptované riziko. ✅L1
- AU-18 naming parita (N-6a) — neověřeno spuštěním `audit:routes` (baseline), jen čtením FE page-rout vs BE endpoint. L1
- AU-20 SOLE_PJ_BLOCK v `requestSelfDeletion` — existence potvrzena z bug-auditu PP-55, neotevřeno. L1

## PROOF-REQUESTy
- **R-RUN (M8):** vypálit request s **guest** tokenem (`/auth/anon-session`) na plain-`JwtAuthGuard` endpoint (`GET /users/me`) → očekávej dnes 401 `DELETED`; potvrdí sémantiku + (přes FE harness) že interceptor spustí login-redirect. Po fixu očekávej guest-specifický kód / žádný spurious logout.
- **AU-02 (M1→L2):** dočíst per-endpoint `user`-scope u OptionalJwt controllerů characters/universe/gallery/news/articles (potvrdit, že při `user=undefined` nevrací per-user pole) — RA-2 inventura kus po kuse.
- **AU-08/09/10 (M3→L3):** projít existující `jwt-auth.guard.spec.ts` + `optional-jwt-auth.guard.spec.ts` + `auth.service.spec.ts` (3 větve DELETED/PENDING/BANNED + refresh ban gate) — zvedne kritické body na L3.
