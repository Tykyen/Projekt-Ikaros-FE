# 00 — Cross-cutting: architektura chybové cesty, 4 tvary chyb, master matice, tooling

> Společný základ pro všechny oblasti. Drží: (A) jak chyba vzniká a putuje v obou repo, (B) **4 tvary chyb**,
> které dnes reálně létají po drátě, (C) **master matici** (kde vzniká → tvar → kdo čte), (D) **throw
> klasifikaci** (M-GREP doplní), (E) **tooling spec**.
>
> ⚠️ Tento dokument zapisuje **tvary a kódy chyb** (veřejné v repu). **Nikdy** sem nepatří reálný produkční
> obsah ani secrety.

---

## A. Architektura chybové cesty

### BE (NestJS) — kde chyba vzniká a co ji formátuje
1. **`throw new XException(...)`** — 818 výskytů v 73 souborech (M-GREP). `X` = `BadRequest/NotFound/Forbidden/Unauthorized/Conflict/Gone/…`. Message buď **string**, nebo **objekt** `{code, message}` (+ historicky `statusCode`).
2. **`ValidationPipe`** ([main.ts:23-29]) — `whitelist + forbidNonWhitelisted + transform`, **bez `exceptionFactory`** → při nevalidním DTO hodí `BadRequestException` s tělem `{statusCode:400, message:string[], error:'Bad Request'}` (class-validator, **anglicky**).
3. **Guardy** — `JwtAuthGuard` (401 + kódy `BANNED/DELETED/DELETION_PENDING`), `AdminGuard` (403 `NOT_PLATFORM_ADMIN`), `RolesGuard` (**vrací `false`** → NestJS implicitní 403 bez doménového kódu), world access (403 vs 404 no-leak).
4. **`HttpExceptionFilter`** ([common/filters/http-exception.filter.ts:10-44]) — `@Catch(HttpException)`:
   - status z `exception.getStatus()` (**ne z těla `statusCode`** → to je mrtvé pole),
   - `message` z `exceptionResponse.message ?? 'Error'` (přežije string i `string[]`),
   - `code` = `exceptionResponse.code` (string) **jinak** `HttpStatus[status]` (`'NOT_FOUND'`…) **jinak** `'UNKNOWN_ERROR'`,
   - výstup `{ error: { code, message, timestamp } }`.
   - 🔴 **`@Catch(HttpException)` → ne-HTTP chyby filtrem PROPADNOU** na NestJS default handler.
5. **WS gateway** — mimo HTTP filtr (jiný context). `app.gateway` `return {error:string}`; `maps.gateway` `client.emit('error',{code,message})`. **Žádné `WsException`** v kódu (0 výskytů, recon).
6. **`response.interceptor`** ([common/interceptors]) — obaluje **success** do `{data}`, ale **jen na vybraných controllerech** (success contract, ne error — okrajově `IM`).

### FE (React + axios) — kde se chyba konzumuje
1. **`apiClient` interceptor** ([client.ts:37-85]) — 401 → kódy `BANNED/DELETED/DELETION_PENDING` instant logout, jinak refresh+retry (`_retry`), refresh-fail → `catch {}` → logout. Ostatní statusy → `Promise.reject`.
2. **`parseApiError(err)`** ([client.ts:88-98]) — `data.error.message` → `Array.isArray ? [0] : msg` → jinak `err.message` → jinak `'Neznámá chyba'`. **Čte jen tvar #1/#2; tvar #3/#4 spadne na fallback.**
3. **`parseApiErrorCode(err)`** ([client.ts:102-108]) — `data.error.code ?? null` pro field-mapping.
4. **Zobrazení** — `sonner` `toast.error(parseApiError(err))` (~29 souborů); inline `useState` chyby ve formulářích; field-level `setError` z `parseApiErrorCode` switche (RegisterModal/ChangeEmail/Mail/Friendships).
5. **`GlobalErrorBoundary`** ([shared/ui]) — React render chyby → `console.error` + „Něco se pokazilo".
6. **Error pages** — `ForbiddenPage`/`NotFoundPage`/`ErrorPage` (hardcoded), router `useRouteError`.
7. **Socket** ([features/chat/api/socket.ts]) — `connect_error` → status atom; **`error` event nezpracován** (recon — ověřit).

📚 **Tvar #1 vs #2 vs #3:** #1 = aplikační (ruční `{code,message}`), #2 = validační (`message:string[]`, EN), #3 = neočekávaná (filtr ji nevidí). #1/#2 sdílí wrapper `{error:{…}}` (oba projdou filtrem). #3 ne.

---

## B. Čtyři tvary chyb na drátě

| # | Zdroj | HTTP tvar těla | Status | `code` | jazyk | FE umí číst? |
|---|---|---|---|---|---|---|
| **1** | `throw new XException({code,message})` → filtr | `{error:{code,message,timestamp}}` | dle exception | doménový (`EMAIL_TAKEN`) | CS | ✅ `parseApiError` |
| **2** | `ValidationPipe` → filtr | `{error:{code:'BAD_REQUEST',message:string[],timestamp}}` | 400 | generický | **EN** | ⚠️ jen `msg[0]`, EN |
| **3** | **ne-HTTP** (`Error`/Mongo/`TypeError`) — **mine filtr** | `{statusCode:500,message:'Internal server error'}` (NestJS default) | 500 | **žádný** | EN | ❌ fallback `err.message` |
| **4** | WS gateway | `{error:'string'}` *nebo* `{code,message}` (emit) | — | nejednotný | CS | ❌ FE neřeší |

> 💡 Audit cílí na **sjednocení 4 → 1 tvar** (catch-all filtr pokryje #3; WS filtr/konvence pokryje #4;
> `exceptionFactory` lokalizuje #2). Verdikt o každém → registr.

---

## C. Master matice zdrojů chyb (recon 2026-06-14)

> Vstupní hypotéza, ne verdikt. Sloupce: **Zdroj · Soubor · Tvar · Status(y) · Osa**.

| Zdroj | Soubor (kotva) | Tvar | Status | Osa |
|---|---|---|---|---|
| HttpExceptionFilter | common/filters/http-exception.filter.ts:10 | #1/#2 wrapper | dle exc | EX |
| ValidationPipe | main.ts:23 | #2 (`string[]`, EN) | 400 | VA/LN |
| JwtAuthGuard | common/guards/jwt-auth.guard.ts | #1 (`BANNED/DELETED/DELETION_PENDING`) | 401 | AL |
| AdminGuard | common/guards/admin.guard.ts:18 | #1 (`NOT_PLATFORM_ADMIN`) | 403 | AL |
| RolesGuard | common/guards/roles.guard.ts | **`return false`** (bez kódu) | 403 | AL/CO |
| world access | modules/worlds/worlds.service.ts:155,178-207 | #1 (`WORLD_NOT_FOUND`) + no-leak 404/403 | 404/403 | AL |
| ThrottlerGuard | app.module.ts:66 + auth.controller | `ThrottlerException` (extends Http) | 429 | TH |
| ne-HTTP / runtime | kdekoli (Mongo, `Error`) | #3 (mine filtr) | 500 | UE/LK |
| app.gateway WS | gateways/app.gateway.ts:28,41,54 | #4 `return {error:string}` | — | WS |
| maps.gateway WS | modules/maps/maps.gateway.ts:110 | #4 `emit('error',{code,message})` | — | WS |
| FE parseApiError | shared/api/client.ts:88 | čte #1/#2 | — | FE |
| FE socket | features/chat/api/socket.ts:33 | `connect_error` only | — | WS/FE |

---

## D. Throw klasifikace (předběžná — M-GREP doplní + ověří)

> Recon hrubá čísla (NEověřeno, M-GREP přesní): **818 throw / 73 souborů.** Dvě dimenze: (1) message **string
> vs objekt**, (2) objekt **s `code` vs bez**. Cíl: kolik throwů nedá FE doménový kód (→ generic fallback `CO`).

| Dimenze | Hypotéza (recon) | Verdikt |
|---|---|---|
| objekt s `code` | ~část (worlds.service 100%) | M-GREP |
| objekt bez `code` | ~část (novější služby) | M-GREP |
| string-only message | ? → `code = HttpStatus[status]` generický | M-GREP (`K-EC12`) |
| `statusCode` v těle (mrtvé) | ~159 (recon „74%" přestřel) | M-GREP `K-EC4` |
| WS chyby (mimo HTTP) | 2 tvary | M-GREP |

---

## E. Tooling spec (detail → [tools/error-contract-probe.md](tools/error-contract-probe.md))

| Tool | Vstup | Výstup | Úroveň |
|---|---|---|---|
| **M-GREP** | grep `throw new *Exception` přes BE src | klasifikace §D + seznam string-only + WS chyby | L2 |
| **M-CONTRACT** | BE `code` literály × FE `parseApiErrorCode` switche/mapy | drift: BE-produkuje-FE-nezná / FE-čeká-BE-neposílá | L3/L5 |
| **M-SHAPE** | supertest + `createTestApp` | request každé status třídy → assert tvar+status | L4 |
| **M-FE** | vitest na `parseApiError`/`parseApiErrorCode` | 4 tvary → očekávaný výstup (žádný `undefined`/`[object Object]`) | L5 |
| **M-FUZZ** | `fast-check` malformed payloady + supertest | invariant: success NEBO error tvar, nikdy leak | L8 |
| **M-CRAWL** | router manifest ~206 endpointů + supertest | každý endpoint × chybová cesta → tvar | L8 |
| **M-FAULT** | mock outage Mongo/Cloudinary/Meili | degradace → error tvar, ne 500 leak | L9 |
| **M-MUT** | Stryker na filtr/parser | contract testy zčervenají? | L5-teeth |

> 💡 M-GREP + M-CONTRACT jsou kandidáti na **CI guard** (`npm run audit:errors`, vzor
> [`scripts/prod-config-scan.mjs`](../../scripts/prod-config-scan.mjs)) — nový nekonzistentní tvar / drift
> kódu nesmí projít tiše do main.

---

## F. Pasti specifické pro tooling

- **M-GREP multiline throw** — `throw new X({ … })` se často láme na víc řádků; scanner musí číst **blok do uzavírací `)`/`;`**, ne jen řádek (jinak podhlásí `code`).
- **M-CONTRACT FE strana** — FE kódy nejsou jen v `switch`; jsou v `if (code === 'X')`, objektových mapách (`RegisterModal mapErrorToBanner`), `RegisterErrorCode` union typu. Scanner musí pokrýt všechny vzory, jinak falešný drift.
- **M-SHAPE Mongo flaky** — e2e přes `createTestApp` startuje Mongo Memory → `--runInBand`/`--maxWorkers=2` ([paměť `be_test_mongo_flaky`]). Vynucený 500 = endpoint, co hodí ne-HTTP `Error` (test-only route nebo mock service throw).
- **M-FUZZ NODE_OPTIONS** — FE node skripty padají na SSL → `NODE_OPTIONS=--use-system-ca` ([paměť `npm_ssl_system_ca`]) pokud sahá na síť; čistě lokální supertest ne.
- **prod vs dev tvar #3** — leak stack/Mongo zprávy v 500 závisí na `NODE_ENV`; `LK` musí testovat **prod větev** (NestJS default 500 message je generická, ale custom catch-all by mohl leaknout).
- **WS context** — `M-SHAPE` pro WS potřebuje socket.io-client v testu, ne supertest; nebo ověřit gateway handler v izolaci (`WS` na L1-L2 stačí + cross-ref ws-contract).
- **Žádné reálné chyby z prod** — bez Sentry nemáme prod log; audit dokazuje tvar **syntézou** (probe/fuzz), ne harvestem. To je vědomá hranice (L9 strop).
