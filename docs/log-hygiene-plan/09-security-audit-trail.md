# 09 — Security audit trail (inverzní hygiena)

> **Otázka (inverzní):** loguje se **dost** bezpečnostních událostí pro detekci průniku — a **bez** citlivé
> části? A jde auth log forgnout přes log injection? **Osy:** `AUD` `INJ`. **Plocha:** auth/login/ban/admin
> cesty, RolesGuard/AdminGuard denials, user input na auth cestě.

📚 **Proč inverzní:** log hygiene není jen „neloguj moc". Je i „loguj **dost** těch správných věcí". Failed
login, eskalace práv, ban, mazání účtu, admin akce **mají** zanechat stopu (jinak nelze detekovat útok ani
forenzně dohledat), ale **bez hesla / tokenu**. Chybějící security audit log je taky defekt hygieny.

## AUD — co se loguje dnes (recon)

| Event | Logováno? | Kde | Verdikt |
|---|---|---|---|
| Refresh token reuse (krádež tokenu) | ✅ `warn` `userId`+`familyId` | auth.service.ts:298 | 🟢 vzor |
| Password change | ✅ `log` `userId` | auth.service.ts:364 | 🟢 |
| Mailer fail (reset/verify) | ✅ `warn` `userId`+`err.message` | auth.service.ts:148,395,502 | 🟢 |
| **Failed login** (špatné heslo) | ⬜ ? | — | ověřit — měl by |
| **Authz denial** (RolesGuard `return false`) | ⬜ pravděp. ne | roles.guard.ts | 🟡 chybí stopa |
| **Ban / unban** | ⬜ ? | users/admin | ověřit |
| **Account delete** (self/admin) | ⬜ ? | users.service | ověřit |
| **Admin akce** (role change, world transfer) | ⬜ ? | admin/worlds | ověřit (cross-ref R-20) |

## Co ověřit

1. **K-LOG10** `AUD` — auth má **dobrý základ** (reuse detection, pwd change jen s IDs). Ověřit **úplnost**:
   failed login (rate-limit už je — Throttler), authz denial, ban, admin akce. Návrh: jednotný
   `logger.warn('security.event', { type, userId })` na klíčových branách — **bez** hesla/tokenu/e-mailu.
2. **`INJ`** (K-LOG11) — kde se na auth/admin cestě loguje **user input** (username při login, e-mail při
   reset)? Recon: auth loguje `userId` (ID, ne vstup) → nízké riziko. Ale pokud někde `logger.warn('login
   fail for ${username}')` → username s `\n` forguje řádky. Ověřit + sanitizovat (logovat ID, ne vstup; nebo
   escape `\r\n`).
3. **Trade-off `AUD` × `PII`** — audit log nesmí přidat PII. Logovat `userId` (pseudonym), ne e-mail/username.
   Stejná pole jako existující vzor.

## Pasti
- `AUD` může kolidovat s `PII`/`INJ` — řešit logováním **ID**, ne vstupu/e-mailu. Jeden vzor pro obojí.
- RolesGuard `return false` (error-contract C) neloguje → tichý 403; přidat audit log denials je nice-to-have,
  ne nutnost (zváž objem — každý 403 by logoval).
- Nepřehánět — single-instance hobby nepotřebuje SIEM; cíl = **klíčové** eventy (login fail, ban, role/owner
  change, delete), ne každý request.
