# tools — error contract probe (M-GREP · M-SHAPE · M-CONTRACT · M-FE · M-FUZZ · M-CRAWL · M-FAULT · M-MUT)

> Spustitelná vrstva auditu. Cíl: **strojově prokázat** tvar chyby na celém povrchu, ne ho vyčíst.

## M-GREP — `scripts/error-contract-scan.mjs` (FE repo, čte BE src) — L2
- **Vstup:** `BE/backend/src/**/*.ts` (bez `.spec`).
- **Co dělá:**
  1. Najde každý `throw new <X>Exception(<arg>)` (multiline blok do `)`).
  2. Klasifikuje arg: **string literál** / **objekt s `code`** / **objekt bez `code`** / **proměnná**.
  3. Detekuje `statusCode:` v těle (mrtvé pole) → count.
  4. Vytáhne všechny `code: '<LITERAL>'` → seznam BE kódů (pro M-CONTRACT).
  5. Najde WS chyby (`emit('error',` + `return { error:`).
- **Výstup:** tabulka per soubor (string-only / code / no-code počty) + globální souhrn + seznam string-only throwů (kandidáti `CO`/`EX`) + BE code inventář.
- **Exit kód:** nenulový při novém string-only throwu nad baseline → **CI guard**.

## M-CONTRACT — součást `error-contract-scan.mjs` `--contract` — L3/L5
- **Vstup:** BE code inventář (z M-GREP) × FE kódy (grep `parseApiErrorCode` switche, `code ===`, `RegisterErrorCode` union, mapy).
- **Výstup:** 2 drift seznamy: **BE→FE** (BE posílá, FE nezná) · **FE→BE** (FE čeká, BE neposílá).
- **CI guard.**

## M-SHAPE — BE e2e (`createTestApp` + supertest) — L4
- **Soubor:** `BE/backend/test/error-contract.e2e-spec.ts` (nebo `src/**/*.e2e-spec.ts`).
- **Případy (každý: status + assert tvar `{error:{code,message,timestamp}}`):**
  - 400 validace (nevalidní DTO → `message:string[]`, status 400).
  - 400 `forbidNonWhitelisted` (pole navíc).
  - 401 (chybí token / `BANNED`).
  - 403 (cizí uživatel / `NOT_PLATFORM_ADMIN`).
  - 404 (neexistující id; private world no-leak).
  - 409 (konflikt — duplicate).
  - 410 (Gone — pokud dosažitelné).
  - 429 (>limit na auth endpointu).
  - **500 #3** (vynucený ne-HTTP: CastError na nevalidním ObjectId / test-route throw) → ověř, že tvar je #3 (důkaz K-EC1).
- **Spuštění:** `--runInBand` ([paměť `be_test_mongo_flaky`]).

## M-FE — FE vitest — L5
- **Soubor:** `FE/src/shared/api/__tests__/parseApiError.spec.ts`.
- **Případy:** `parseApiError`/`parseApiErrorCode` × {tvar #1, #2 `string[]`, #3 neobalený, #4, null, non-axios} → očekávaný výstup; **nikdy** `undefined`/`[object Object]`/throw.

## M-FUZZ — `fast-check` + supertest — L8
- Generuj malformed payloady (unicode, oversized, hluboké zanoření, prototype pollution `__proto__`, špatné typy) na vybrané POST/PATCH endpointy.
- **Invariant:** odpověď je **buď** 2xx **nebo** validní error tvar `{error:{code,message,timestamp}}` se statusem 4xx; **nikdy** 500 #3, **nikdy** leak stack/Mongo zprávy.

## M-CRAWL — exhaustive endpoint matrix — L8
- Z router manifestu (~206 endpointů; reuse `route-audit` inventář) projet každý × chybová cesta: bez auth → 401/403 tvar; bad id → 404 tvar; garbage body → 400 tvar.
- **Výstup:** endpointy, co nedrží tvar (cizí 500 / chybí wrapper / špatný status).

## M-FAULT — fault injection — L9
- Mock outage: Mongo (disconnect), Cloudinary (throw v upload), Meili (search down).
- **Ověř:** degradace → error tvar (ideálně 503/500 #1 wrapper), **ne** syrový 500 #3 leak. Cílené na `UE`.

## M-MUT — Stryker (teeth) — L5
- Zmutuj `HttpExceptionFilter` (smaž `code` fallback / wrapper) a `parseApiError` → contract testy (M-SHAPE/M-FE) **musí** zčervenat. Důkaz, že audit má zuby.

## Pasti
- Multiline throw bloky (M-GREP čti do `)`).
- FE kódy v mapách/if, ne jen switch (M-CONTRACT pokrýt).
- Mongo flaky → `--runInBand`.
- `NODE_OPTIONS=--use-system-ca` jen pokud skript sahá na síť.
- Prod větev pro leak test (`NODE_ENV=production`).
