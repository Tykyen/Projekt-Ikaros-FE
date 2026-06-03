# 00 — Cross-cutting (průřezové)

Věci, které nepatří jedné feature, ale procházejí celou aplikací. Kontrolovat **první** — chyba tady
se projeví všude.

**BE:** `app.module`, guardy (`JwtAuthGuard`, `OptionalJwtAuthGuard`, `RolesGuard`, `ThrottlerGuard`), `HttpExceptionFilter`, socket adapter
**FE:** `app/router.tsx`, `app/layout/*`, `pages/errors/*`, axios interceptor, `GlobalErrorBoundary`, `SocketManager`

---

## A. Routing & guardy

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| X-01 | `requireAuth` loader: chybí token → uloží intent + redirect `/?openLogin=1` `[auto]` | M1 | ⬜ |
| X-02 | Pořadí specifických routes před parametrickými (`/novy` před `/:id`, `/nova` před `/:id`) `[auto]` | M1 | ⬜ |
| X-03 | `memberOnly()` guard na všech world content sub-routes; index bez guardu (pre-join) `[auto]` | M1 | ⬜ |
| X-04 | `RoleGuard` (admin routes) vs. `WorldMembershipGuard` (world routes) — správný typ na správné routě `[auto]` | M1+M4 | ⬜ |
| X-05 | Catch-all `:slug` wiki route je **poslední** v world children `[auto]` | M1 | ⬜ |
| X-06 | `*` → NotFoundPage; `errorElement` → ErrorPage na obou layoutech `[auto]` | M1 | ⬜ |
| X-07 | Lazy import každé stránky má existující default export (žádný rozbitý `lazy(() => import)`) `[auto]` | M1 | ⬜ |

## B. Auth-leak policy (401/403/404)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| X-10 | Axios interceptor: 401 → refresh flow; opakované 401 → logout `[auto]` | M1 | ⬜ |
| X-11 | Interceptor: BANNED / DELETED / DELETION_PENDING → force logout + redirect `[auto]` | M1 | ⬜ |
| X-12 | Privátní svět anon/non-member → WorldNotFound (404-like), **ne** 403 leak existence `[auto]` | M4 | ⬜ |
| X-13 | Chráněné stránky bez role: 403 stránka, ne bílá obrazovka `[auto]` | M4 | ⬜ |
| X-14 | `OptionalJwtAuthGuard` na public world shell — anon dostane data jen pro public/open svět `[auto]` | M4 | ⬜ |

## C. Error handling & resilience

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| X-20 | `GlobalErrorBoundary` zachytí render error nad RouterProvider (ne bílá obrazovka) `[auto]` | M1 | ⬜ |
| X-21 | `parseApiError` parsuje BE error payload (`code`, `message`) konzistentně `[auto]` | M1 | ⬜ |
| X-22 | BE `HttpExceptionFilter` propaguje custom `code` z payloadu `[auto]` | M1 | ⬜ |
| X-23 | Suspense fallback (Spinner) na každé lazy routě — žádný blank během načítání `[auto]` | M1 | ⬜ |
| X-24 | Toast (sonner) při ztrátě/obnovení socket spojení `[auto]` | M1 | ⬜ |

## D. WebSocket infrastruktura

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| X-30 | `SocketManager` singleton: connect při přihlášení, disconnect při odhlášení `[auto]` | M1 | ⬜ |
| X-31 | JWT v handshake u všech gateways (presence, chat, friendships, map, …) `[auto]` | M5 | ⬜ |
| X-32 | Reconnect re-join roomů (world room, map room) — neztratí se po výpadku `[auto]` | M5 | ⬜ |
| X-33 | Všechny FE emit/listener events existují v `docs/websocket-api.md` `[auto]` | M5 | ⬜ |

## E. Baseline (globální)

| # | Bod | Status |
|---|-----|--------|
| X-40 | FE `tsc --noEmit` čistý | ✅ |
| X-41 | FE `eslint` čistý | ✅ |
| X-42 | FE `vitest` (unit) zelený | ⬜ (běží) |
| X-43 | BE `tsc --noEmit` čistý | ✅ |
| X-44 | BE `eslint` čistý | ✅ |
| X-45 | BE `jest` zelený | ✅ 1815/1815 |
| X-46 | `lint:colors` — oddělit legit data od UI úniků (N-2) | ⚠️ |

## F. Reálné `[human]` body (pro testovací skupinu)

- Responsive proklik desktop → tablet → mobil drawer na klíčových layoutech.
- FOUT/blikání tématu při hard reloadu.
- Skutečná funkčnost refresh tokenu po vypršení (timing).
