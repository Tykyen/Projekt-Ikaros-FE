# 01 — Auth & secrets v logu

> **Otázka:** loguje se kdekoli na auth cestě **token / heslo / hash / JWT / refresh / captcha secret**?
> **Osy:** `SEC` `OBJ` `AUD`. **Plocha:** [auth.service.ts] (6 log), [captcha.service.ts] (5),
> [jwt-auth.guard.ts] (2), token/refresh-family služby, [users.service.ts] (5).

## Povrch

| Soubor | Log míst | Co loguje (recon) | Riziko |
|---|---|---|---|
| auth.service.ts | 6 | `userId`/`familyId` + `err.message` (init/reuse/pwd-change/mailer-fail) | nízké — IDs, ne hesla |
| captcha.service.ts | 5 | Turnstile `error-codes`; `error('...', err)` celý objekt [:68] | 🟠 `OBJ` (celý err) |
| jwt-auth.guard.ts | 2 | ban/delete kódy? (ověřit obsah) | ? |
| users.service.ts | 5 | ověřit (e-mail/username při ban/delete?) | ? |
| token / refresh family | ? | **nikde nelogovat raw token / hash** | 🔴 pokud leak |

## Co ověřit (L3 + L5)

1. **Žádný raw token/hash** — grep + taint: refresh token, reset/verify token, `passwordHash`, `password`
   (i z dto) **nesmí** do žádného log argumentu. Recon zatím čistý (auth loguje IDs) → potvrdit M-SCAN.
2. **`captcha.service.ts:68`** `logger.error('Captcha verify network error', err as Error)` — loguje celý
   `Error` (stack). Captcha secret v něm? (fetch err může nést URL s query) → `OBJ`/`SEC`, ověřit.
3. **Reuse detection / pwd change** [auth.service.ts:298,364] = **pozitivní** `AUD` (security event s jen
   `userId`/`familyId`) → potvrdit, že je to vzor, ne výjimka.
4. **M-RUNTIME** — register/login/reset s kanárkem `CANARY_PWD`/`CANARY_TOKEN` → assert stdout je neobsahuje.

## Seed
- **K-LOG10** `AUD` 🟢→ověřit — security eventy logované jen s IDs (pozitivní, ověřit úplnost). → oblast 09.
- (nový kandidát) `OBJ` — captcha `error('...', err)` celý objekt. Sdílí vzor s [03](03-exception-error-path.md).

## Pasti
- `tokenizer` (search) ≠ token; `emailVerified` (bool) ≠ e-mail — whitelist.
- Login fail se **nesmí** logovat s heslem, ale **měl by** se logovat jako event (`AUD`, oblast 09).
