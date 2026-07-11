# error__08-throttler-misc (TH · IM) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/08-throttler-misc.md` · osy `TH` `IM` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika throttler config + response interceptor + FE 429 handlery). READ-ONLY — L4 429-vystřel nespuštěn.
Verdikt: **žádný 🔴, žádný ⭐**. 429 tvar drží (projde catch-all filtrem). Residua beze změny od registru.

## Co ověřeno (L1/L2)
- **429 projde filtrem** — `ThrottlerException extends HttpException` → catch-all filtr větev 1 → `{error:{code,message,timestamp}}`, status 429. `throttler.config.ts` NEmá custom `getErrorMessage`/`code` → filtr dá `code=HttpStatus[429]='TOO_MANY_REQUESTS'` (generic) + message = default EN „ThrottlerException: Too Many Requests". Tvar je tedy **obalený a čitelný** (ne tvar-#3).
- **FE auth flows řeší 429 dle STATUSu** (ne message) → CS hláška: `LoginModal.tsx:36`, `RegisterModal.tsx:30`, `ForgotPasswordModal.tsx:22`, `TotpVerifyStep.tsx:45` → „Příliš mnoho pokusů. Zkus to znovu za chvíli." Testy potvrzují (`LoginModal.spec:114`, `RegisterModal.spec:244`). Citlivé endpointy mají `@Throttle` (login/register/refresh 5-10/min, `auth.controller.ts:51-162`).
- **`ResponseInterceptor`** (`common/interceptors/response.interceptor.ts`) obaluje success do `{data}` přes `map`.

## Nálezy

### ♻️ TH/LN residual — ne-auth mutace bez 429 handleru → EN throttler text v toastu — 🟡 L2
Protože default `ThrottlerException` message je EN a filtr ji propustí jako `message`, každá **ne-auth** mutace, co spoléhá na `parseApiError(err)` v toastu (a nemá vlastní `status===429` větev), ukáže uživateli anglické „ThrottlerException: Too Many Requests". Auth cesty jsou kryté (status-based, viz výše), ale globální rate-limit (100/min) na běžných mutacích ne. Nízká priorita (limit 100/min/IP se běžný uživatel nedotkne). Beze změny od registru. Levný fix (mimo záběr): custom `getErrorMessage`→CS v ThrottlerGuard, pak by to bylo CS všude bez FE větví.

### ♻️ IM residual — success `{data}` wrapper aplikován selektivně — 🟡 (success contract, ne error)
K-EC9: `ResponseInterceptor` se registruje jen na části controllerů → FE někde čte `r.data`, jinde `r.data.data`. **Success** kontrakt, mimo error scope. Cross-ref/dluh, neeskaluji (jak registr).

## Kontrolní body (08-throttler-misc.md)
- [x] 429 tvar — obalený `{error:{code:'TOO_MANY_REQUESTS',message,timestamp}}` ✅
- [x] Message jazyk — default EN (LN residual 🟡, kryto status-based FE u auth)
- [x] FE zobrazení — auth flows status-based CS ✅; ne-auth mutace EN (residual 🟡)
- [ ] Retry-After header — neověřeno do hloubky (READ-ONLY; ThrottlerGuard default posílá `Retry-After`, FE ho nečte — mimo scope)
- [x] `IM` success parita — selektivní `{data}` (residual 🟡, success ≠ error)

Metoda: M1 (Read `throttler.config.ts`, `response.interceptor.ts`, FE 429 handlery + specy), 2026-07-11. M-SHAPE 429-vystřel (L4) nespuštěn (READ-ONLY).
