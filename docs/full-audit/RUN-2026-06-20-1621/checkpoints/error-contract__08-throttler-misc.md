# error-contract / 08-throttler-misc — checkpoint RUN-2026-06-20-1621

## Pokrytí

- **TH (Throttler/429):** `ThrottlerException` tvar přes filtr, `Retry-After` header, FE zobrazení 429 (auth modály, non-auth mutace, `TotpVerifyStep`).
- **IM (success parita):** `ResponseInterceptor` aplikace, `{data}` obal, FE `r.data` čtení.
- **LN (lokalizace 429 message):** EN vs CS message v ThrottlerException tělě.
- Soubory projety: `throttler.config.ts`, `throttler.config.spec.ts`, `http-exception.filter.ts`, `auth.controller.ts`, `two-factor.controller.ts`, `upload.controller.ts`, `users.controller.ts`, `pending-actions.controller.ts`, `app.module.ts`, `response.interceptor.ts`, `response.interceptor.spec.ts`, `RegisterModal.tsx`, `LoginModal.tsx`, `ForgotPasswordModal.tsx`, `TotpVerifyStep.tsx`, `ChangeEmailModal.tsx`, `useFriendshipMutations.ts`, `client.ts`, `@nestjs/throttler/dist/throttler.guard.js`, `throttler.exception.js`, `throttler.service.js`, registr `error-contract-audit.md`.

## Dosažená L vs cílová L

- Cíl plánu: `TH`/`IM` na L2–L3; `M-SHAPE` (L4) pro 429 bylo poskytnuto v rámci předchozí M-SHAPE 12/12 (existující audit).
- Dosažená: **L3** (statické čtení + dosažitelnost; L4 nevyžaduje infru — 429 M-SHAPE probe potvrzena existujícím e2e výsledkem 12/12).

## Nálezy

### 🟠 EC-RUN-01 — [TH/FE] `TotpVerifyStep` čte `data.code` flat místo `data.error.code` → větve NEVER trigger · 🆕

**Kde:** `src/features/auth/components/TotpVerifyStep.tsx:32-41`

```tsx
const data = err.response?.data as { code?: string } | undefined;
// data je { error: { code: 'TOTP_INVALID_CODE', ... } } — wrapper!
if (data?.code === 'TOTP_INVALID_CODE') { ... }  // NIKDY nenastane
if (data?.code === 'EXPIRED_TOKEN' || data?.code === 'INVALID_TOKEN' || data?.code === 'ALREADY_USED') { ... }  // NIKDY nenastane
```

BE filtr (`http-exception.filter.ts:40`) zabalí VŠECHNY výjimky do `{ error: { code, message, timestamp } }`. `TotpVerifyStep` čte `data.code` (flat) místo `data.error.code` (wrapped). Všechny 4 větve v `mapError` jsou tedy mrtvé:
- `TOTP_INVALID_CODE` (auth.service.ts:282) → uživatel zadá špatný 6místný kód → padá na fallback `'Ověření se nezdařilo.'` (generické, ne specifické `'Neplatný kód.'`)
- `EXPIRED_TOKEN` / `INVALID_TOKEN` / `ALREADY_USED` (security-tokens.service.ts:70,76,105,111,128) → expirovaný TOTP challenge → fallback místo `'Platnost přihlášení vypršela...'`

**Poznámka:** 429 větev (line 44) používá `status`, ne `code` — ta funguje správně.

**Dosažitelnost:** Vysoká — každý uživatel se špatným TOTP kódem dostane generickou hlášku.

**Dopad:** UX — uživatel vidí `'Ověření se nezdařilo.'` místo smysluplného `'Neplatný kód.'` nebo `'Platnost přihlášení vypršela...'`. Funkčně se přihlásit nemůže, ale neví proč přesně.

**Návrh:** Použít `parseApiErrorCode(err)` nebo `data?.error?.code`.

**L3** 🆕

---

### 🟡 EC-RUN-02 — [TH/LN] `ThrottlerException` message je EN v tělě odpovědi · 🆕

**Kde:** `node_modules/@nestjs/throttler/dist/throttler.exception.js` → `http-exception.filter.ts:55-58`

`ThrottlerException` předá plain string `"ThrottlerException: Too Many Requests"` jako message. Filtr to zabalí jako-je: `{ error: { code: 'TOO_MANY_REQUESTS', message: 'ThrottlerException: Too Many Requests', timestamp } }`.

FE auth modály (Login/Register/ForgotPassword/TotpVerifyStep/ChangeEmail) ignorují `message` a detekují 429 přes `status === 429` → zobrazí vlastní CS hlášku ✅.

**Ale:** non-auth mutace (upload, profile, world lifecycle, friendships, admin) dostanou 429 a volají `parseApiError(err)` → vrátí `"ThrottlerException: Too Many Requests"` (EN) → toast zobrazí EN text.

Throttlované non-auth endpointy: `/users/me/avatar` (20/min), `/users/me/character/avatar` (20/min), upload controler (20/min), users (5–60/min), pending-actions (60–120/min).

**Dosažitelnost:** Nízká (globální limit 100/min musí překročit user výrazně rychle); auth cesty mají jinak vlastní handling.

**Dopad:** EN text `'ThrottlerException: Too Many Requests'` v toastu pro non-auth mutace při 429.

**Návrh:** Přidat do `parseApiError` nebo do axiosError interceptoru: pokud `status === 429` a `message` je generické EN throttler string → přeložit na CS. NEBO `ThrottlerGuard` override s lokalizovanou message (třída odvozena od `ThrottlerGuard`, override `getErrorMessage`).

**L3** 🆕

---

### ✅ EC-RUN-03 — [TH] 429 tvar přes filtr: `{ error: { code: 'TOO_MANY_REQUESTS', message, timestamp } }` · ♻️

`ThrottlerException extends HttpException` → filtrem projde větví 1 (`instanceof HttpException`). Status = 429. `code = HttpStatus[429] = 'TOO_MANY_REQUESTS'` (filtr fallback, žádný doménový kód na ThrottlerException). Tvar je konzistentní. Potvrzeno čtením filtru + existující M-SHAPE 12/12 (zahrnovala 429 probe). ✅ **shoda**

---

### 🟡 EC-RUN-04 — [TH] `Retry-After` header = `NaN` při standardním překročení limitu (bez `blockDuration`) · 🆕

**Kde:** `@nestjs/throttler/dist/throttler.guard.js:121`, `throttler.service.js:73`, `throttler.config.ts:10`

Config: `{ ttl: 60_000, limit: 100 }` bez `blockDuration`. Při překročení limitu guard nastaví `blockExpiresAt = Date.now() + undefined = NaN` → `timeToBlockExpire = Math.ceil((NaN - Date.now()) / 1000) = NaN`. Guard odesílá `res.header('Retry-After', NaN)` → klient dostane `Retry-After: NaN` (neplatná hodnota dle RFC 7231).

FE tento header vůbec nečte (ověřeno grep — nula výskytů `Retry-After` v FE zdrojích).

**Dopad:** `Retry-After: NaN` je technicky neplatný HTTP header. Žádný FE kód ho ale nečte → dopad null. Potenciální future-proofing issue, pokud by někdo chtěl header použít.

**Návrh:** Nastavit `blockDuration: 60_000` v `throttler.config.ts` (nebo min shodnou s `ttl`) → pak `Retry-After` bude platné číslo vteřin. Alternativa: ignorovat ⚖️ (FE ho stejně nečte).

**L3** 🆕

---

### ✅ EC-RUN-05 — [IM] `ResponseInterceptor` není aplikovaný globálně → success parita ⚖️ · ♻️

`ResponseInterceptor` (`response.interceptor.ts`) existuje ale **není nikdy aplikovaný** (ani `APP_INTERCEPTOR` v `app.module.ts`, ani `@UseInterceptors(ResponseInterceptor)` kdekoli). `UseInterceptors` v codebase = jen `FileInterceptor` (Multer). FE čte `r.data` = raw controller return. Žádné `r.data.data` v FE kódu.

`ResponseInterceptor` je **mrtvý kód**. Success contract je konzistentní — přímý controller return bez obalování. ✅ by-design ⚖️

Registr (existující audit) zaznamenal `K-EC9` jako `IM 🟡 okrajové` — tato oblast potvrzuje: interceptor NENÍ aplikovaný, žádný drift success tvaru nenastává.

---

### ✅ EC-RUN-06 — [TH] FE 429 handling auth modálů · ♻️

Čteno, ověřeno čtením + existující spec testy:
- `RegisterModal.tsx:30` ✅ `status === 429 → 'Příliš mnoho pokusů...'`
- `LoginModal.tsx:36` ✅ idem
- `ForgotPasswordModal.tsx:22` ✅ idem
- `TotpVerifyStep.tsx:44` ✅ idem (status větev funguje)
- `ChangeEmailModal.tsx:72` ✅ idem

Existující spec testy: `LoginModal.spec.tsx:114`, `RegisterModal.spec.tsx:232` — pokrývají 429. ✅

## PROOF-REQUEST

Žádný. Oblast je plně staticky ověřitelná na L3. M-SHAPE 429 probe byla součástí předchozího auditu (12/12 ✅, `backend/test/error-contract.e2e-spec.ts`). Spustitelná vrstva (live infra) by ověřila EC-RUN-04 (`Retry-After: NaN` v reálném response headeru) — ale dopad je nulový (FE header nečte), takže L3 dostatečná.
