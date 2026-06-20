# role / 01-auth-ucet-guest — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20  
Auditor: claude-sonnet-4-6 (agent, read-only)  
Cílová hloubka: L2+ pro všechny body, L3+ pro LK/ES/ST, L4 (M8) proof-request na klíčové hranice

---

## Pokrytí

Projity soubory:
- BE: `jwt-auth.guard.ts`, `jwt-auth.guard.spec.ts`, `optional-jwt-auth.guard.ts`, `jwt.strategy.ts`, `auth.controller.ts`, `auth.service.ts`, `security-tokens/security-tokens.service.ts`, `users/users.controller.ts`, `users/users.service.ts` (výběr metod), `users/dto/update-user.dto.ts`, `users/constants/theme-ids.ts`, `worlds/worlds.service.ts` (`applyDetailScope`, `findBySlugForRequester`), `global-chat/global-chat.controller.ts`, `common/decorators/allow-pending-deletion.decorator.ts`
- FE: `app/router.tsx`, `shared/api/client.ts`, `features/chat/api/useGlobalChat.ts`, `features/profile/lib/profileSchemas.ts`, `features/profile/components/ProfileHeader.tsx`, `themes/registry.ts`, `app/layout/WorldLayout/WorldLayout.tsx` (fragmenty)

Osy pokryté: `LK`, `PA`, `ST`, `OW`, `EN`, `BY`, `ES`, `DD`

Všechny body AU-01 – AU-23 prolity staticky (M1/M2/M3). Vizuální matice E projita kódem.

---

## Dosažená L vs cílová L

| Oblast | Cíl | Dosaženo | Pozn. |
|---|---|---|---|
| AU-01 Veřejné routy | L2 | L2 | router.tsx — žádný loader / OptionalJwt na /vesmiry, /clanky, /galerie, /napoveda, /novinky, /podminky |
| AU-02 OptionalJwt endpointy | L2 | L2 | worlds GET/slug/:slug/:id, world-news, ikaros-articles, ikaros-gallery — všechny mají OptionalJwt; service filtruje dle user |
| AU-03 Private svět → 404 | L2 | L2 | `applyDetailScope` → NotFoundException WORLD_NOT_FOUND (ne 403); FE WorldNotFound správně |
| AU-04 Profil visibility | L2 | L2 | `publicProfileV14` za JwtAuthGuard (ne OptionalJwt!); friends-only → 403 správně; plan říkal OptionalJwt — kód je přísnější (L2⁺) |
| AU-05 Guest → requireAuth redirect | L2 | L2 | router.tsx: /profil, /posta, /diskuze, /oblibene, /akce, /uzivatele mají `loader: requireAuth` |
| AU-06 Guest world sub-route → memberOnly redirect | L2 | L2 | všechny sub-routy mají `memberOnly()` (WorldMembershipGuard → redirect na /svet/:slug, ne ForbiddenPage) |
| AU-07 presence-counts enabled:!!token | L2 | L2 | useGlobalChat.ts:69 `enabled: !!token`; controller class-level JwtAuthGuard:69 — parita ✅ N-30 opraveno |
| AU-08 JwtAuthGuard per-request gate | L3 | L3 | kód opravený (R-07); spec pokrývá DELETED/DELETION_PENDING/AllowPending/BANNED (7 testů) |
| AU-09 Temporální ban (7d token) | L3 | L3 | jwt-auth.guard.ts:47 bannedAt per-request; spec test existuje (R-08 opraveno) |
| AU-10 Ban → 401 BANNED | L3 | L3 | auth.service.ts:203 login gate + guard per-request; FE client.ts:47 instant logout |
| AU-11 DELETED/PENDING → instant logout | L2 | L2 | client.ts:55-60 kód kontroluje DELETED|DELETION_PENDING → logoutAndRedirectToLogin |
| AU-12 @AllowPendingDeletion scope | L2 | L2 | grep: POUZE na GET+DELETE /users/me/deletion-request (2 místa, žádný jiný endpoint) |
| AU-13 OptionalJwt bez account-state gate | L2 | L2 | opt-jwt-auth.guard.ts záměrně bez gate; public read endpointy nevrací per-user private data (user=undefined → public scope) |
| AU-14 Veřejné auth endpointy | L2 | L2 | register/login/login-totp/refresh/forgot-password/reset-password/verify-email/reactivate-deletion/check-username/check-email — žádný JwtAuthGuard |
| AU-15 logout/logout-all guard | L2 | L2⚠️ | POST /auth/logout bez JwtAuthGuard (záměr: idempotentní, refresh-cookie jako credential); POST /auth/logout-all → JwtAuthGuard ✅; plán říkal JWT pro oba — kód logicky správnější (logout bez platného AT = běžný případ) |
| AU-16 check-username/email enumerace | L2 | L2 | rate-limit 60/min; parita s registrací (registrace samo odhalí) — přijatý design |
| AU-17 Security tokeny — expirace | L2 | L2 | securityTokens.consume: kontroluje expiresAt (EXPIRED_TOKEN), usedAt (ALREADY_USED), type mismatch (INVALID); peek ≠ consume pro TOTP 14.1 |
| AU-18 Route naming parita | L2 | L2 | FE email-verify→BE verify-email, reset-password→reset-password, email-change/confirm→confirm-email-change — sedí |
| AU-19 Self-service OW scope | L2 | L2 | PATCH /users/me bere `req.user.id`, ignoruje payload; PATCH /users/:id gate `requester.id !== id → 403`; žádné cizí userId v body není respektováno |
| AU-20 SOLE_PJ_BLOCK | L2 | L2 | users.service.ts requestSelfDeletion volá assessPJHandover + blocking.length>0 → 400; dryRun preview ✅ |
| AU-21 Reaktivace po hard-delete | L2 | L2 | reactivateDeletion: user.isDeleted → 401 DELETED; anonymizovaný účet → findByEmail null → INVALID_CREDENTIALS |
| AU-22 displayName limit FE vs BE | L2 | L2 | BE UpdateUserDto:15 `@MaxLength(32)`; FE profileSchemas.ts:15 `z.string().max(32)`; HTML input:194 `maxLength={32}`; F-24 spec test ✅ |
| AU-23 themeId @IsIn(THEME_IDS) | L2 | L2 | BE constants/theme-ids.ts = 32 ID; FE registry.ts THEMES = 32 klíčů — identické; @IsIn ve DTO; spec test ✅ |

---

## Nálezy

### Potvrzené nálezy z předchozích vln (ověřeno HEAD kódem, status ✅)

Všechny R-07, R-08 opraveny a kódem ověřeny. Žádná regrese.

### Nové nálezy v této oblasti

**R-NEW-01** — `POST /auth/logout` bez `@UseGuards` — plan-doc neshoda (ne bug) · Kde: `auth.controller.ts:186` · Dopad: plán AU-15 říkal „JWT povinné", kód záměrně nemá guard (idempotentní logout přes refresh-cookie). Kód je správnější (logout i při expirovaném AT). Žádná security díra — logout bez platného refresh tokenu je no-op. · Návrh: opravit plán (AU-15 text + matici E „POST /auth/logout = veřejný, cookie jako credential"). · L2 · 🆕 (doc-only)

**R-NEW-02** — `GET /users/profile/v14/:id` za `JwtAuthGuard` (ne `OptionalJwt`) — silnější než plan AU-04 předpokládal · Kde: `users.controller.ts:236-244` · Dopad: plán AU-04 říkal „OptionalJwt, anonym vidí jen public profil". Kód **vyžaduje přihlášení** pro jakýkoliv profil — anonym dostane 401. Starý nechráněný `GET /profile/:id` byl odstraněn (komentář :380-385: „odstraněna nechráněná routa"). Friend-only 403 funguje správně. · Verdikt: silnější gate = OK, ale plán lže (popis anon přístupu). · L2 · 🆕 (doc-only, plán-update)

### Žádné nové kódové nálezy

Oblasti AU-01..AU-23 projity celé. Kód sedí na záměr, předchozí opravy (R-07, R-08) drží. Enumerace (AU-16), temporální gate (AU-09), AllowPending scope (AU-12), themeId sync (AU-23), displayName parita (AU-22), SOLE_PJ_BLOCK (AU-20) — vše ✅.

---

## PROOF-REQUEST

### PR-01 — M8 Red-team: ban per-request (AU-09/AU-10)
**Co spustit:** integrace / ruční — (1) zalogovat uživatele, získat AT (7d TTL); (2) admin nastaví `bannedAt` na DB; (3) pošli request s původním AT na `/api/users/me`; (4) expect: 401 `{"code":"BANNED"}`.  
**Co to dokáže:** Prokáže, že per-request gate opravdu čte DB per-request, ne jen při loginu. Eskaluje AU-09/AU-10 na L4.  
**Příkaz BE jest (existuje test, ale mock):**  
```bash
cd backend && npx jest --maxWorkers=2 jwt-auth.guard.spec
```
Stávající spec L3 (mock). L4 = live DB test nebo seed-scenario gauntlet.

### PR-02 — M8 Red-team: pending-deletion bypass (AU-08/AU-12)
**Co spustit:** (1) `POST /auth/me/deletion-request` → `deletionRequestedAt` nastaveno; (2) zkus `GET /users/me` → musí 401 DELETION_PENDING; (3) zkus `GET /me/deletion-request` → musí 200; (4) zkus `DELETE /me/deletion-request` → musí 204; (5) zkus jiný endpoint (např. PATCH /users/me) → musí 401.  
**Co to dokáže:** Potvrdí `@AllowPendingDeletion` scope v živé instanci. Eskaluje na L4.

### PR-03 — M8 Red-team: OW IDOR (AU-19)
**Co spustit:** (1) jako user A získej AT; (2) `PATCH /api/users/<userId-B>` s platným tělem; (3) expect: 403 USER_FORBIDDEN.  
**Co to dokáže:** Prokáže, že `PATCH /:id` gate `requester.id !== id` opravdu blokuje cross-user update. Eskaluje AU-19 na L4.

### PR-04 — M3: BE jest pokrytí AllowPendingDeletion větve
**Co spustit:**  
```bash
cd backend && npx jest --maxWorkers=2 --testPathPattern="jwt-auth.guard.spec"
```
**Ověřuje:** 7 testů DELETED/BANNED/DELETION_PENDING/AllowPending/DELETED-přes-AllowPending — měly by být zelené.

---

## Matice persona × akce (verifikovaná)

| Akce | guest | aktivní | banned | pending-deletion | hard-deleted |
|---|---|---|---|---|---|
| GET / (dashboard) | ✅ | ✅ | ✅* | ✅* | — |
| GET /ikaros/vesmiry | ✅ | ✅ | ✅* | ✅* | — |
| GET /svet/:slug (public/open) | ✅ | ✅ | ✅* | ✅* | — |
| GET /svet/:slug (private) | 🚫404 | dle membership | 🚫404 | 🚫404 | — |
| GET /ikaros/profil | 🔒401→redirect | ✅ | ⛔401 BANNED | ⛔401 PENDING | ⛔401 DELETED |
| GET /users/me | 🔒401 | ✅ | ⛔401 BANNED | ⛔401 PENDING | ⛔401 DELETED |
| PATCH /users/me | 🔒401 | ✅ᵒ | ⛔401 | ⛔401 | ⛔401 |
| GET /me/deletion-request | 🔒401 | ✅ | ⛔401 | ✅(@AllowPending) | ⛔401 |
| DELETE /me/deletion-request | 🔒401 | 400 NOT_PENDING | ⛔401 | ✅(@AllowPending) | ⛔401 |
| POST /auth/reactivate-deletion | ✅(login-credentials) | — | ⛔401 BANNED | ✅ | ⛔401/INVALID |
| POST /auth/login | ✅ | — | ⛔401 BANNED | → deletion_pending | ⛔401 DELETED |
| POST /auth/logout | ✅ (no-op bez cookie) | ✅ | ✅ (cookie) | ✅ (cookie) | ✅ (cookie/no-op) |
| chráněná world/platform akce | 🔒401 | dle role | ⛔401 BANNED | ⛔401 PENDING | ⛔401 DELETED |

`*` OptionalJwt gate záměrně nemá account-state check → banned/pending projde public read (AU-13, akceptováno)

---

## Souhrn

Počet nových nálezů: **2 doc-only** (R-NEW-01 plán AU-15 logout guard, R-NEW-02 plán AU-04 OptionalJwt→JwtAuth). Žádný kódový bezpečnostní problém nalezen. Předchozí opravy R-07, R-08 v kódu drží. L2 dosaženo na všech 23 bodech; L3 na AU-08/09/10 (testy existují); L4 = PROOF-REQUEST (4 položky).
