# 01 — Auth & účet / guest

Hranice „nepřihlášený ↔ přihlášený" a **stav účtu** jako oprávnění. Persona `guest` (anon) tu má
hlavní slovo: co smí vidět bez tokenu, kde dostane 401, a kde 404-mask místo „přihlas se". Druhá
osa je **stavová** (`ST`): účet může být aktivní / banned / soft-deleted / pending-deletion — a tyto
stavy gatují přístup nezávisle na roli. Třetí je **temporální**: access token žije až 7 dní, takže
změna stavu (ban, self-delete) musí platit **per-request**, ne jen při loginu.

**BE:** `auth` (controller, service, jwt strategy), `common/guards` (Jwt/OptionalJwt), `security-tokens`,
`mailer`, `users` (me/* self-service, deletion-request, reactivate)
**FE:** `features/auth` (useAuth, login/register/reset, ReactivateAccountModal), `shared/api/client.ts`
(401 interceptor), `app/router.tsx` (requireAuth, public routy), `features/profile` (security tab)

---

## A. Guest / anonymní povrch (`LK` `PA`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| AU-01 | Veřejné routy bez tokenu: `/`, `/ikaros/vesmiry`, `/ikaros/clanky`, `/ikaros/galerie`, `/ikaros/novinky`, `/ikaros/napoveda`, `/podminky`. Ověřit, že **žádná** nevyžaduje token a nevrací per-user data `[auto]` | `LK` | M1 | ⬜ |
| AU-02 | `OptionalJwtAuthGuard` endpointy (worlds list/detail, pages-veřejné, ikaros obsah, user profile) — token chybí → `user=undefined`, **ne** pád. Ověřit, že každý za ním kontroluje `user` před vrácením privátních polí `[auto]` | `LK` `BY` | M4 | ⬜ |
| AU-03 | `GET /worlds/slug/:slug` pro **private** svět anonymovi → **404** (ne 403, ne login-hint) — neprozradí existenci. FE `WorldNotFound` (ne ForbiddenPage) `[auto]` | `LK` | M4 | ⬜ |
| AU-04 | `GET /users/profile/:id` (OptionalJwt) — anonym vidí jen `public` profil; `profileVisibility:'friends'` pole nesmí prosáknout bez ověřeného friendshipu `[auto]` | `LK` `OW` | M4 | ⬜ |
| AU-05 | FE: guest na přihlášený-only routě (`/ikaros/profil`, `/ikaros/posta`, `/ikaros/diskuze`, `/ikaros/oblibene`, `/ikaros/akce`) → `requireAuth` redirect `/?openLogin=1` + uložený intent ([router.tsx:121]) `[auto]` | `LK` | M1 | ⬜ |
| AU-06 | FE: guest na world sub-routě (`/svet/:slug/chat` …) → `memberOnly` redirect na dashboard, **ne** ForbiddenPage (anti-leak existence world obsahu) `[auto]` | `LK` | M1 | ⬜ |
| AU-07 | `/global-chat/rooms/presence` má `JwtAuthGuard`, ale FE ho volá i pro anon (sidebar badge) → musí být `enabled: !!token` ([useGlobalChat.ts:61], N-30). Jinak 401 spam `[auto]` | `PA` | M1 | ⬜ |

---

## B. Stav účtu jako gate (`ST` `LK`) — banned / deleted / pending

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| AU-08 | `JwtAuthGuard` per-request gate ([jwt-auth.guard.ts:35]): `!user \|\| user.isDeleted` → 401 `DELETED`; `deletionRequestedAt && !@AllowPendingDeletion` → 401 `DELETION_PENDING` `[auto]` | `ST` | M3 | ⬜ |
| AU-09 | **Temporální:** access token žije ~7 d ([jwt-auth.guard.ts:32] komentář) → gate **musí** být per-request, ne login-only. Red-team: starým tokenem zabanovaného účtu zkusit chráněný endpoint → musí 401 `[auto]` | `ST` | M8 | ⬜ |
| AU-10 | Ban (`UserRole.Zakaz` / banned flag) → `JwtStrategy.validate` 401 `BANNED`. FE `client.ts:46` → instant logout bez refresh `[auto]` | `ST` `LK` | M3 | ⬜ |
| AU-11 | FE `client.ts:54` — `DELETED`/`DELETION_PENDING` → instant logout (žádný refresh). Login flow rozpozná `deletion_pending` přes status field → `ReactivateAccountModal` `[auto]` | `ST` | M1 | ⬜ |
| AU-12 | `@AllowPendingDeletion` ([decorator]) — **jen** `GET/DELETE /users/me/deletion-request` (status + cancel během 30denní lhůty). Ověřit, že **žádný jiný** endpoint dekorátor nemá (jinak pending účet projde, kam nemá) `[auto]` | `ST` `ES` | M1 | ⬜ |
| AU-13 | `OptionalJwtAuthGuard` account-state gate **záměrně nemá** ([jwt-auth.guard.ts:34]). Ověřit, že public read za ním nevrací nic, co by smazaný/banned účet neměl vidět (je to public read → OK, ale potvrdit) `[auto]` | `ST` `LK` | M1 | ⬜ |

---

## C. Auth endpointy — co je veřejné vs chráněné (`PA` `LK`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| AU-14 | Bez auth (záměr): `POST /auth/register`, `/login`, `/refresh`, `/forgot-password`, `/reset-password`, `/verify-email`, `/resend-verification`, `GET /auth/check-username`, `/check-email`. Ověřit, že žádný z nich nevyžaduje token `[auto]` | `PA` | M1 | ⬜ |
| AU-15 | JWT povinné: `POST /auth/logout`, `/logout-all`. Ověřit guard `[auto]` | `PA` | M1 | ⬜ |
| AU-16 | `check-username` / `check-email` — enumerace: vrací bool dostupnosti. `LK` riziko (zjištění registrovaného e-mailu). Ověřit rate-limit / akceptované riziko (registrace ho stejně prozradí) `[auto]` | `LK` | M1 | ⬜ |
| AU-17 | `reset-password` / `verify-email` / `confirm-email-change` — token z `security-tokens` (jednorázový, expirace). Ověřit, že platnost/expiraci kontroluje **service**, ne jen existence tokenu `[auto]` | `DD` | M1 | ⬜ |
| AU-18 | Naming parita (N-6a opraveno): FE `email-verify`→BE `verify-email` atd. Ověřit, že route-audit po N-6a sedí (žádný 404 na auth cestě) `[auto]` | `PA` | M6 | ⬜ |

---

## D. Self-service účet (`OW` `ST`) — vlastní účet, ne cizí

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| AU-19 | `PATCH /users/me`, `POST /users/me/avatar`, `/request-email-change`, `/request-deletion` — operují **jen** nad `req.user` (ne nad `:id` z payloadu). Red-team: poslat cizí userId v body → musí být ignorován `[auto]` | `OW` | M8 | ⬜ |
| AU-20 | `request-deletion` — SOLE_PJ_BLOCK: poslední PJ světa nesmí smazat účet bez handoveru (project self-deletion). Ověřit gate + dryRun preview `[auto]` | `ST` | M1 | ⬜ |
| AU-21 | `POST /auth/reactivate-deletion` — reaktivace během 30denní lhůty; po hard-delete (cron N-3) už ne. Ověřit, že po anonymizaci účtu reaktivace selže `[auto]` | `ST` | M1 | ⬜ |
| AU-22 | `displayName` délka: FE 64 vs BE 32 (N-6/C-14 drift) — ověřit, že je sjednoceno; jinak FE pustí, BE 400 `[auto]` | `EN` `PA` | M2 | ⬜ |
| AU-23 | `themeId` `@IsIn(THEME_IDS)` (N-11) — BE odmítne libovolný string; FE registry = BE kopie (paměť: dual source). Ověřit sync `[auto]` | `EN` | M2 | ⬜ |

---

## E. Matice persona × akce (auth/účet)

| Akce / persona | guest | aktivní (Ikarus+) | banned | pending-deletion | hard-deleted |
|---|---|---|---|---|---|
| veřejný read (`/`, články, vesmíry) | ✅ | ✅ | ✅* | ✅* | — |
| private world detail (cizí) | 🚫 | 🚫 | 🚫 | 🚫 | — |
| `GET /users/me` | 🔒 | ✅ | ⛔BANNED | ⛔PENDING | ⛔DELETED |
| `PATCH /users/me` | 🔒 | ✅ᵒ | ⛔ | ⛔ | ⛔ |
| `GET /me/deletion-request` (status) | 🔒 | ✅ | ⛔BANNED | ✅(@AllowPending) | ⛔DELETED |
| `DELETE /me/deletion-request` (cancel) | 🔒 | ✅ | ⛔ | ✅(@AllowPending) | ⛔ |
| `POST /auth/reactivate-deletion` | ✅(login flow) | — | ⛔ | ✅ | ⛔ |
| chráněná world/platform akce | 🔒 | dle role | ⛔BANNED | ⛔PENDING | ⛔DELETED |

`*` banned/pending teoreticky projde public read přes OptionalJwt (gate ho nemá, AU-13) — read-only,
akceptováno; potvrdit, že nic per-user neteče. `✅ᵒ` = jen vlastní účet (AU-19).

> **Delta parity (auth/účet):**
> - AU-09 token žije 7 d — FE: instant logout na 401 · BE: per-request gate · **✅ parita** (ověřit M8)
> - AU-07 presence anon — FE: `enabled:!!token` · BE: `JwtAuthGuard` · **✅** (N-30 opraveno)
> - AU-22 displayName 64 vs 32 — **⚠️ kandidát** (ověřit, zda N-6/C-14 dotaženo)
> - ostatní → vyplnit při exekuci.

---

## Cross-role transitions (temporální)

- **T-1:** Uživatel přihlášen → admin ho zabanuje. Jeho aktivní token (7 d) → **další** request 401 BANNED (AU-09). Ověřit, že nečeká na expiraci.
- **T-2:** Self-delete → token dál existuje → `DELETION_PENDING` per-request (AU-08); jen status/cancel routy projdou (`@AllowPendingDeletion`).
- **T-3:** Reaktivace → `deletionRequestedAt` smazán → příští request projde. Ověřit, že netřeba re-login (nebo že FE re-login vynutí).
- **T-4:** Hard-delete (cron, 30 d) → anonymizace → reaktivace už nemožná (AU-21).

---

## Test coverage gaps

- `JwtAuthGuard` spec existuje — ověřit pokrytí všech 3 větví (DELETED / DELETION_PENDING / @AllowPending bypass).
- Red-team M8: žádný test „banned token → 401 na N-tém requestu" (temporální gate). Kandidát.
- FE: `client.ts` 401 interceptor — test pro BANNED/DELETED/PENDING větve (instant logout vs refresh).
- `reactivate-deletion` po hard-delete → ověřit negativní cestu.

---

## Známá rizika

- **RA-1 (`ST`/M8)** — kdyby account-state gate spadl jen do `JwtStrategy.validate` (login), banned/deleted účet by s 7denním tokenem zůstal aktivní týden. Aktuálně řešeno per-request v `JwtAuthGuard` (AU-08) — **ověřit, že žádný chráněný endpoint nepoužívá jiný guard, který gate nemá**.
- **RA-2 (`LK`)** — OptionalJwt endpointy: jediná díra by byla, kdyby některý vracel per-user data při `user=undefined`. Inventura AU-02 to musí projít kus po kuse.
- **RA-3 (`ES`)** — `@AllowPendingDeletion` na špatném endpointu = pending účet projde, kam nemá (AU-12). Grepnout všechny výskyty dekorátoru.
