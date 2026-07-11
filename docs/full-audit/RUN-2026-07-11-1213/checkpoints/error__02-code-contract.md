# error__02-code-contract (CO) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/02-code-contract.md` · osa `CO` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (M-CONTRACT parity scan `error-contract-scan.mjs` + statika FE handlerů). READ-ONLY.
Verdikt: **žádný 🔴, žádný ⭐**. **FE→BE drift = 0** potvrzen. Kód-based kontrakt drží. Jediné residuum je **status-based** drift (mimo záběr scanneru) — viz křížový odkaz na 07.

## Co ověřeno (pozitiva — L2)
- **M-CONTRACT drift 0** (`scanners/errors.txt:33-34`): FE 29 handlerů / 41 kódů, žádná mrtvá větev. EC-03 (`*_NOT_APPLICABLE`) a EC-04 (`ALREADY_FRIENDS` vs `REQUEST_EXISTS`) nezregresovaly.
- **366 BE doménových `code` literálů** produkovaných; 306 z nich FE nemapuje na field — ale to je **info, ne drift**: většina se zobrazí jako text přes `parseApiError` (`toast.error`), field-mapping FE dělá jen u hrstky (auth/friendship/email/password). Konzistentní `SCREAMING_SNAKE` napříč.
- **Dedup `ApiError`** hotový: `grep interface ApiError` → **jediný** v `shared/types/index.ts:1221` (EC-08 uzavřeno; dřív dup v ResetPasswordPage/ChangeEmailModal).
- **Guard bez kódu (by-design):** `RolesGuard` → `return false` → NestJS 403 bez doménového `code` → FE dostane `code=HttpStatus[403]='FORBIDDEN'` (generic). Pro UX OK (FE ukáže „Nemáš oprávnění" dle statusu), potvrzeno v plánu jako přijaté.

## Nálezy

### 🆕 EC-RUN CO — status-based FE↔BE drift, který M-CONTRACT nevidí (SecuritySection) — 🟠 L2 · primárně 07
M-CONTRACT porovnává jen **`code` stringy**; nepokrývá větve, co switchují na **HTTP status**. Nalezen jeden živý: `SecuritySection.tsx:97` větví `err.response.status === 401` na „Současné heslo je špatně", ale BE `users.service.ts:362-369` (FIX-50) hází pro špatné staré heslo **400 `INVALID_PASSWORD`** (ne 401) → FE větev **mrtvá**. Detail + severita v checkpointu **07** (EC-RUN-07-01). Sesterský `ChangeEmailModal.tsx:57` už migroval na `parseApiErrorCode(err)==='INVALID_PASSWORD'` (správně) — SecuritySection zůstal na statusu. Poučení pro scanner: parity guard by mohl hlásit i FE `status ===` větve bez kód-fallbacku (mimo tento READ-ONLY běh).

### ♻️ EC-07 residual — 40/1004 throwů (4 %) bez doménového kódu → generic fallback — 🟡 L2
Beze změny poměru (registr 31/818 ~4 %). Filtr dá `code=HttpStatus[status]`. Většina interní/gateway/edge (viz seznam v checkpointu 01). ⚖️ jako v registru.

## Kontrolní body (02-code-contract.md)
- [x] Inventář BE kódů — 366 literálů (M-GREP)
- [x] Inventář FE kódů — 29 handlerů / 41 kódů
- [x] Drift A (BE→FE) — 306 nemapováno = text-only, ne drift ✅
- [x] Drift B (FE→BE) — **0** ✅ (kód-based); 🆕 status-based výjimka viz 07
- [x] `HttpStatus[status]` kolize — FE nikde neswitchuje na generic name jako doménový kód ✅
- [x] Guard kódy — `RolesGuard` false→403 bez kódu (by-design, FE dle statusu)
- [x] Konzistence názvů — SCREAMING_SNAKE ✅

Metoda: M-CONTRACT (`node scripts/error-contract-scan.mjs` → `scanners/errors.txt`) + Read FE handlerů, 2026-07-11. L5 parity testy nespuštěny (READ-ONLY).
