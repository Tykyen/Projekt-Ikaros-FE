# error__05-uncaught (UE · LK) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/05-uncaught.md` · osy `UE` `LK` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika catch-all filtru + main.ts top-level handlerů). READ-ONLY — L9 fault injection nespuštěno.
Verdikt: **žádný 🔴, žádný ⭐**. Kořen oblasti (`@Catch(HttpException)` → ne-HTTP mine filtr) je **opravený** — EC-01/10/11 uzavřeny. Pokrytí ne-HTTP cest **širší** než registr. Žádný stack/interní leak klientovi.

## Co ověřeno (pozitiva — L1/L2)
- **Catch-all `@Catch()`** (`http-exception.filter.ts:26`) — ne-HTTP chyby už nepropadají na NestJS default. `resolve()` mapuje:
  - Mongoose `CastError` → **400 `INVALID_ID`** „Neplatný identifikátor" (EC-01, nevalidní ObjectId v parametru).
  - Mongo duplicate key (`code===11000`) → **409 `DUPLICATE_KEY`** „Záznam již existuje" (EC-11, ne 500).
  - oversized body (`.status/.statusCode===413`) → **413 `PAYLOAD_TOO_LARGE`** (FIX-52).
  - malformed JSON (`.type==='entity.parse.failed'`) → **400 `INVALID_JSON`** (FIX-53, ne syrová V8 SyntaxError).
  - Multer → 413 `FILE_TOO_LARGE` / 400 `UPLOAD_ERROR` (EC-10, MulterExceptionFilter sloučen).
  - fallback → **500 `INTERNAL` „Vnitřní chyba serveru"** (`:165-169`).
- **Žádný leak klientovi (LK):** fallback větev **NEposílá** `exception.message`/stack do těla — jen generická CS hláška. Stack + `name:message` jde **jen do server-side `Logger.error`** (`:159-164`) a `Sentry.captureException` (`:62`). Grep `message: err.message` v throw cestách → žádný leak interní Mongo zprávy klientovi.
- **Top-level záchyt** (`main.ts:36-48`): `unhandledRejection` → Logger (jen stack, LH-06); `uncaughtException` → Logger + `process.exit(1)` (řízený pád).
- **5xx observabilita** (`:52-63`): AlertService critical (rate-limit) + Sentry — ne-HTTP chyba už není slepá v prod.

## Nálezy

### ✅ EC-01/10/11 uzavřeny, pokrytí širší než registr — L2
Registr měl EC-01 na „L4 čeká"; HEAD filtr pokrývá všech 5 divergentních tvarů + 2 nové větve (413/INVALID_JSON). Tvar #3 (neobalený 500) reálně vzniká už jen pro **skutečně neočekávané** `Error` → tam je generická CS hláška se `code:'INTERNAL'` (obalená, FE ji přečte), ne cizí NestJS tvar. Žádná residuální ne-HTTP cesta s cizím tvarem nenalezena čtením.

### ♻️ EC-07 residual — `BadGatewayException`/`InternalServerErrorException` se string-only message → generic code — 🟡 L2
Několik interních/gateway throwů bez doménového kódu (upload→Cloudinary `BAD_GATEWAY`, global-chat `INTERNAL_SERVER_ERROR`) — dostanou `code=HttpStatus[status]`. Tvar je ale **obalený** (jsou to HttpException → projdou filtrem větví 1), takže žádný tvar-#3 leak; jen chybí doménový kód (FE zobrazí text). ⚖️ jako registr (viz checkpoint 01/EC-07).

## Kontrolní body (05-uncaught.md)
- [x] Tvar #3 dosažitelný — už jen pro neočekávané Error → `INTERNAL` obalený ✅
- [x] FE fallback — obalený `{error:{code:'INTERNAL'}}` → `parseApiError` ho přečte (ne axios „status 500")
- [x] Stack leak v prod — **žádný** (fallback bez `.message`/stack klientovi; stack jen server-log) ✅
- [x] Mongoose chyby — CastError→400, E11000→409 mapovány ✅
- [x] Catch-all filtr — existuje, pokrývá + loguje ✅
- [x] Logging — `Logger.error(name+stack)` + Sentry + Alert 5xx ✅

Metoda: M1 (Read `http-exception.filter.ts` + `main.ts`) + grep leak vzorů, 2026-07-11. L9 fault injection (Mongo/Cloudinary outage) nespuštěno (READ-ONLY).
