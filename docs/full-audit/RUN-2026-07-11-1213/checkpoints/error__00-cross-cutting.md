# error__00-cross-cutting — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/00-cross-cutting.md` · osy: všechny (architektura/tooling/master matice) · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika L1 filtr/pipe/FE client/WS + strojová klasifikace M-GREP/M-CONTRACT `error-contract-scan.mjs`). READ-ONLY — žádná e2e/L4 vrstva spuštěna.
Verdikt: **žádný 🔴, žádný ⭐**. Architektura chybové cesty je dnes **jednotnější než v době registru** (cíl „4 tvary → 1" pro HTTP splněn). Nová jen kosmetika + zastaralost plánu.

## Co ověřeno (pozitiva — L1/L2)
- **Jediný catch-all filtr = jediný zdroj tvaru.** `common/filters/http-exception.filter.ts:26` je `@Catch()` (bez argumentu). Registrace 1× (`main.ts:77-78`). Sjednocuje HttpException/validaci/throttler/Multer/Mongoose/neočekávané do `{error:{code,message,timestamp}}`. Tvar #3 (ne-HTTP mine filtr) a #5 (Multer divergentní) z master matice **uzavřeny**.
- **`ValidationPipe` MÁ `exceptionFactory`** (`main.ts:66-73` → `validation-exception.factory.ts`) — plán/matice ho hlásí jako NEEXISTUJE (zastaralé). Tvar #2 dnes CS + `code:'VALIDATION'`.
- **FE client kompletní** (`shared/api/client.ts`): `parseApiError`/`parseApiErrorCode` s `String()` guardem (EC-12), refresh-fail toast (EC-09), jediný `ApiError` typ (EC-08 dedup). Tvar #4 (WS) má globální `socket.on('error')` (F5, `chat/api/socket.ts:44`).
- **M-GREP/M-CONTRACT scan čerstvý** (`scanners/errors.txt`): 1004 throwů / 87 souborů; 948 objekt+code, 39 string-only, 1 objekt-bez-code, 16 prázdné → **40/1004 (4 %) bez doménového kódu**; `statusCode` v těle **0**; **FE→BE drift 0**; WS `emit('error')×8 · return{error}×4` ve 2 souborech.

## Nálezy

### 🆕 DOC — plán 00 (A/B/C master matice) je zastaralý oproti opravenému kódu — 🟡 L1
Sekce A (bod 4 `@Catch(HttpException)`), tabulka B (tvar #3/#4 jako živé), matice C („ValidationPipe #2 EN", „filtr @Catch(HttpException):10") popisují **PŘED-F1/F2 stav**. Realita HEAD: catch-all filtr + `exceptionFactory` + WS FE listener. Dokument je vstupní hypotéza (plán), ne registr — bez runtime dopadu; jen matoucí pro čtenáře plánu. Registr `error-contract-audit.md` stav oprav odráží správně (F1–F6 hotové).

### 🆕 SCOPE — filtr přibral monitoring vrstvu (Sentry + Alert + BruteForce) — ✅ pozitivum, L1
`http-exception.filter.ts:52-69`: 5xx → `AlertService.alert('critical')` (rate-limit 1/kód/10 min) + `Sentry.captureException`; `INVALID_CREDENTIALS` → `BruteForceMonitor`. Rozšíření nad rámec error-contract auditu (3. noha monitoring). Bez leaku klientovi (jen server-side). Zvyšuje observabilitu tvaru #3, kterou registr (`BD`/`K-EC10`) hlásil jako chybějící → de-facto uzavřeno.

## Kontrolní body (00-cross-cutting.md)
- [x] Architektura BE — 1 catch-all filtr + exceptionFactory + guardy; tvar sjednocen
- [x] 4 tvary chyb — HTTP #1/#2/#3/#5 sloučeny do 1; WS #4 jediný reziduální divergent (viz 06)
- [x] Master matice — obsahově zastaralá (🆕 DOC výše), kód napřed
- [x] Throw klasifikace — M-GREP: 40/1004 (4 %) generic fallback (viz 01/02/EC-07)
- [x] Tooling — `error-contract-scan.mjs` běží, drift 0, CI guard aktivní

Metoda: M1 (Read filtr/main/client/gateway) + M-GREP/M-CONTRACT (`scanners/errors.txt`, 2026-07-11). L4+ nespuštěno (READ-ONLY).
