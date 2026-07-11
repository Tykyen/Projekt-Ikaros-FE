# error__07-fe-consumption (FE · BD · RT) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/07-fe-consumption.md` · osy `FE` `BD` `RT` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika `client.ts` + FE error handlerů; cílené ověření SecuritySection dle zadání). READ-ONLY.
Verdikt: **žádný 🔴**. Jádro FE konzumace je robustní (EC-08/09/12 uzavřeny). **Jeden 🆕 🟠 nález:** status-based mrtvá větev u změny hesla (přesně bod z mého zadání).

## Co ověřeno (pozitiva — L1/L2)
- **`parseApiError`** (`client.ts:130-142`) — `axios.isAxiosError` guard, `String()` guard na `first` (EC-12: number/boolean→String, objekt/null/''→`err.message`, nikdy `[object Object]`), non-axios → „Neznámá chyba". Žádný throw v parseru.
- **`parseApiErrorCode`** (`:146-153`) — `code!=null ? String(code) : null` (EC-12 guard).
- **Refresh-fail toast** (`:110-115`, EC-09) — `catch → toast.info('Přihlášení vypršelo, přihlas se prosím znovu.')` + logout. Tichý redirect uzavřen.
- **Dedup `ApiError`** (EC-08) — jediný `interface ApiError` (`shared/types/index.ts:1221`); ResetPasswordPage/ChangeEmailModal už importují centrální typ. `ChangeEmailModal.tsx:57` čte `parseApiErrorCode(err)==='INVALID_PASSWORD'` (kód-based, správně).
- **`_retry` flag** (`:94-95`) — jednorázový refresh, žádná nekonečná smyčka. `retry:1` na queries (ne agresivní 4xx retry).
- **401 kódové zkratky** (`:78-92`) — `BANNED/DELETED/DELETION_PENDING` → instant logout bez refresh.

## Nálezy

### 🆕 EC-RUN-07-01 `FE`/`RT` — změna hesla: FE větví na status 401, BE hází 400 → mrtvá UX větev — 🟠 L2
`SecuritySection.tsx:96-105` (onSubmitPassword):
```ts
if (isAxiosError(err) && err.response?.status === 401) {
  passwordForm.setError('oldPassword', { message: 'Současné heslo je špatně' });
} else {
  passwordForm.setError('root', { message: 'Nepodařilo se změnit heslo. Zkus to znovu.' });
}
```
BE `users.service.ts:362-369` (FIX-50) hází pro špatné staré heslo **`BadRequestException` (400) `code:'INVALID_PASSWORD'`** — vědomě 400, ne 401 (aby nespouštěl refresh-token flow na interceptoru; „mirror requestEmailChange"). → FE `status === 401` větev je **mrtvá** → špatné současné heslo spadne do `else` a uživatel vidí matoucí generické „Nepodařilo se změnit heslo. Zkus to znovu." (implikuje přechodnou chybu + retry) místo přesného field-hintu „Současné heslo je špatně" na poli `oldPassword`.
- **Dosažitelnost: vysoká** — běžná akce (překlep v současném hesle při změně).
- **Proč M-CONTRACT nechytil:** scanner porovnává jen `code` stringy; tato větev switchuje na **HTTP status**, ne na kód → mimo záběr parity guardu.
- **Fix (vzor existuje vedle):** sesterský `ChangeEmailModal.tsx:57` už na to samé BE chování používá `parseApiErrorCode(err)==='INVALID_PASSWORD'`. SecuritySection při migraci FIX-50→kód-based zůstal pozadu. Náprava = nahradit `status===401` za `parseApiErrorCode(err)==='INVALID_PASSWORD'`.

### ♻️ BD residual — `GlobalErrorBoundary` bez reportu — 🟡 (dluh, ne contract)
Beze změny od registru (K-EC10). Observabilita render-chyb; ne error-contract. Pozn.: HTTP 5xx observabilita je pokryta BE (Sentry+Alert ve filtru, viz checkpoint 05).

## Kontrolní body (07-fe-consumption.md)
- [x] parser tvar #1/#2/#3/#4 + null → guardy OK (EC-12) ✅
- [x] Duplikovaný `interface ApiError` — dedup hotový (EC-08) ✅
- [x] `catch(err)` typování — `unknown` + `isAxiosError` guard ✅
- [x] `retry:1` / `_retry` smyčka — OK ✅
- [x] refresh-fail toast — EC-09 ✅
- [x] **status-vs-kód větvení** — 🆕 EC-RUN-07-01 SecuritySection 401-check mrtvý (BE 400) 🟠
- [x] `BD` boundary — console-only (residual 🟡, dluh)

Metoda: M1 (Read `client.ts`, `SecuritySection.tsx`, `ChangeEmailModal.tsx`, `users.service.ts:354-373`) + grep FE `status===401`, 2026-07-11. M-FE vitest nespuštěn (READ-ONLY).
