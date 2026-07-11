# log-hygiene — 01 auth & secrets (RUN-2026-07-11-1213)

**Osy SEC/OBJ/AUD. Verdikt: ✅ čisté, 0 nových nálezů.**

## Ověřeno (L3)
- **Žádný raw token/hash/heslo v logu.** auth.service loguje jen `user.id` + `err.message`:
  - [auth.service.ts:181] register verify-email init fail → `user.id` + `err.message`. ✅
  - [auth.service.ts:505] password.changed → `payload.userId`. ✅ (AUD pozitivní)
  - [auth.service.ts:536] forgotPassword mailer fail → `user.id` + `err.message`. ✅
  - reuse detection / pwd change (K-LOG10) = pozitivní AUD vzor, jen IDs.
- **captcha.service.ts** (K-LOG4) — `logError(this.logger, 'Captcha verify network error', err)` [:73] → helper normalizuje na stack string, ne celý `Error`. [:47] error-codes/status, [:68] `error-codes` join (Turnstile kódy, ne secret). ✅ Captcha secret (`TURNSTILE_SECRET`) se nikde neloguje.
- **token/refresh-family** — grep bez raw token/hash v log argumentu.

## Scanner false-positive
`user.iderr` na auth 181/536 = concat `user.id` + `err.message` (rozbitá boundary jméno-based heuristiky, viz plán). Ručně čisté.

## 🆕 tento run: 0
Auth cesta beze změny leaku. Poznámka: nové egress (Sentry) na auth 5xx cestě řešeno v log__03 (LH-13) — auth request body (heslo) NENÍ Sentrym připojeno díky SDK default `sendDefaultPii:false`.
