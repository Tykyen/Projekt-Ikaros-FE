# log-hygiene / 01-auth-secrets — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: plný-audit agent (read-only).

## Pokrytí

Prošel jsem veškerý kód oblasti **01-auth-secrets**:

| Soubor | Prošel | Co obsahuje |
|---|---|---|
| `auth.service.ts` | ✅ | 5 log volání (warn×4 + log×1) |
| `captcha.service.ts` | ✅ | 3 log volání (error×1, warn×2) |
| `jwt-auth.guard.ts` | ✅ | 1 warn (updateLastSeen fail) |
| `strategies/jwt.strategy.ts` | ✅ | 0 log volání |
| `auth.controller.ts` | ✅ | 0 log volání (controller nemá logger) |
| `two-factor.controller.ts` | ✅ | 0 log volání |
| `services/totp.service.ts` | ✅ | 0 log volání |
| `services/totp-crypto.service.ts` | ✅ | 1 warn (statický text) |
| `trusted-devices.service.ts` | ✅ | 2 log volání (jen userId) |
| `security-tokens.service.ts` | ✅ | 0 log volání |
| `common/utils/auth-cookie.ts` | ✅ | 0 log volání |
| `common/logging/log-error.util.ts` | ✅ | redakční wrapper ověřen |
| `common/logging/log-hygiene.spec.ts` | ✅ | M-RUNTIME spec 6/6 zelené (kanárky) |

Crossref: M-SCAN výstup (`logs.txt` RUN-2026-06-20-1621) — BE SEC:1 gated (LH-04 ⚖️ záměr, v plánu baseline).

## Dosažená L vs cílová L

- **Cílová L:** L3 (taint + dosažitelnost v prod) pro osy `SEC`/`OBJ`/`AUD`
- **Dosažená L:** **L3** (statické čtení + taint ověřen kódem + dosažitelnost v prod/dev branche ověřena ručně)
  - L5 (M-RUNTIME) je již postavená a zelená pro auth cestu (kanárky helper + mailer) — viz log-hygiene.spec.ts

## Nálezy

### Potvrzené OK (pozitivní nálezy)

**LH-RUN-01** `SEC` ♻️ ✅ — auth.service.ts nevypouští žádný token/heslo/hash do logu.
- `generateTokenPair()` (ř. 645–678): tokeny vytvořeny, do logu neputují.
- `refresh()` (ř. 366–421): payload.jti/familyId/userId logováno jako reuse warn (ř. 399) — žádný raw token.
- `login()` / `loginTotp()` / `reactivateDeletion()`: 0 log volání.
- `forgotPassword()` (ř. 496): warn loguje jen `user.id` + `err.message` (not token).
- `register()` (ř. 167): warn loguje jen `user.id` + `err.message`.
- `resendEmailVerification()` (ř. 603): warn loguje jen `userId` + `err.message`.
- `handlePasswordChanged()` (ř. 465): log loguje jen `userId`.
- **L3 ✅** — taint čistý, dosažitelnost v prod ověřena.

**LH-RUN-02** `SEC` ♻️ ✅ — captcha.service.ts (ř. 72–74): `logError(this.logger, 'Captcha verify network error', err)`.
- `logError` normalizuje na `err.stack` / `String(err)` (log-error.util.ts ř. 9–11) — předchozí kandidát K-LOG4/`captcha.service.ts:68` byl opravou LH-01 pokryt.
- Turnstile secret (z `process.env.TURNSTILE_SECRET`) **NETEČE** do logu — je jen vložen do URLSearchParams (ř. 59), nikoli logován.
- `logger.warn` ř. 67: loguje pouze `error-codes` z Turnstile response (veřejná chybová pole API).
- **L3 ✅** — taint čistý.

**LH-RUN-03** `OBJ`/`AUD` ♻️ ✅ — jwt-auth.guard.ts (ř. 62): warn = jen `userId` + `err.message`.
- Žádný JWT/token/header neprochází do logu.
- **L3 ✅**.

**LH-RUN-04** `SEC` ♻️ ✅ — totp-crypto.service.ts (ř. 28): warn = statický string bez dat. TOTP secret `plain` (výsledek `decryptSecret()`) není nikde logován ani v `setup()`, ani v `enable()`, ani v `verifyForLogin()`.
- **L3 ✅** — nejcitlivější hodnota (TOTP secret) se logy vůbec nedotýká.

**LH-RUN-05** `SEC` ♻️ ✅ — trusted-devices.service.ts: log volání ř. 92 a 105 logují jen `userId` (event handlery). Plain token zařízení nikde nefiguruje v logu — ani v `createForUser()` ani `match()`.
- **L3 ✅**.

**LH-RUN-06** `AUD` ♻️ ✅ — bezpečnostní eventy (LH-10 potvrzení pro oblast 01):
- Reuse detection (auth.service.ts ř. 399): `warn` loguje `userId` + `familyId` — GOOD pattern.
- Password change (auth.service.ts ř. 465): `log` loguje jen `userId`.
- Trusted device revoke (trusted-devices.service.ts ř. 92,105): loguje jen `userId`.
- 0 log při login fail / TOTP fail → nevyzradit identitu útočníkovi, ale chybí stopa pro auditora (oblast 09, mimo záběr 01).
- **L3 ✅** — bez SEC/PII úniku v AUD logu.

**LH-RUN-07** `SEC` ⚖️ (♻️ LH-04 baseline) — log-mailer.provider.ts ř. 38–40: token[0:8] v DEV logu.
- Scanner hlásí `SEC:1` — toto je přesně tento případ, zakotven jako baseline v CI (`sec: 1` v --ci kontrole ř. 239–240 log-hygiene-scan.mjs).
- Produkční gate ověřen kódem (ř. 27: `if (process.env.NODE_ENV === 'production')` → `return` bez logu obsahu) — M-RUNTIME spec (log-hygiene.spec.ts ř. 117–125) empiricky potvrdil.
- **⚖️ by-design (dev-only, gated, v CI baseline)**.

### Nové nálezy (nulové)

**Žádný nový nález** — oblast 01-auth-secrets je na L3 čistá.

## PROOF-REQUEST

Živé infra vrstvy nebyly ověřeny, žádná důvěra strojovému potvrzení bez prod prostředí:

**PR-01** `M-RUNTIME / SEC` — Kanárky v log-hygiene.spec.ts pokrývají `logError`/`logWarn` + mailer cesty. **Nepokrývají** přímé `auth.service.ts` cesty (login/refresh/forgotPassword) — ty jsou staticky čisté, ale runtime spec (`createTestApp` + real endpoint) nebyl spuštěn. Při L5 variantě Maximum+: vyžaduje spustit `jest common/logging/log-hygiene.spec.ts` + přidat endpoint kanárky (login s CANARY_PWD, refresh s CANARY_TOKEN) → grep stdout. Priorita: nízká (statická analýza L3 čistá).

**PR-02** `M-SCAN / SEC` — SEC:1 baseline v CI = log-mailer.provider.ts dev branch (token[0:8]). Ověřit, že v produkčním Docker containeru je skutečně `NODE_ENV=production` nastavena před startem — jinak by LogMailer dev path šel v prod. Crossref: prod-config-audit PC-01/PC-02. Priorita: střední (prod env ověřit deployem).

> ⚠️ Hodnoty kanárků/tokenů se nikam nezapisují — jen typy lokací.
