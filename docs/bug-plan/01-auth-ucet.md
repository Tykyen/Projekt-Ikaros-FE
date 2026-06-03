# 01 — Auth & účet

Přihlášení, registrace, reset hesla, e-mail verifikace/změna, odhlášení, ban, smazání/reaktivace účtu.

**BE:** `auth`, `security-tokens`, `mailer`, `users` (self-service část)
**FE:** `features/auth/*` (modaly + mailové stránky), `features/profile` (SecuritySection, AccountSection)

---

## A. Login

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AU-01 | `identifier` přijímá e-mail i přezdívku; rozhoduje podle `@` `[auto]` | M1+M2 | ⬜ |
| AU-02 | Špatné heslo → 401, error banner, žádný zápis tokenu `[auto]` | M1 | ⬜ |
| AU-03 | BANNED účet → 403 BANNED + revokace refresh tokenů `[auto]` | M1 | ⬜ |
| AU-04 | `deletion_pending` účet → 200 `{status}`, LoginModal → ReactivateAccountModal `[auto]` | M1+M2 | ⬜ |
| AU-05 | `isDeleted` → 401 DELETED `[auto]` | M1 | ⬜ |
| AU-06 | 429 throttle / 5xx / network → odlišné error hlášky `[auto]` | M1 | ⬜ |
| AU-07 | `lastLoginAt` se aktualizuje v login i register `[auto]` | M1 | ⬜ |
| AU-08 | Login → naviguje na uložený intent (deep-link) `[human]` | — | ⏭️ |

## B. Registrace

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AU-10 | Konflikt → `code: EMAIL_TAKEN \| USERNAME_TAKEN`, FE rozliší `[auto]` | M1+M2 | ⬜ |
| AU-11 | `check-username` / `check-email` debounced availability (throttle 60/min) `[auto]` | M1 | ⬜ |
| AU-12 | Username zakazuje `@`; password match validace (zod) `[auto]` | M1 | ⬜ |
| AU-13 | Auto-login po registraci (tokeny zapsány) + verify mail odeslán `[auto]` | M1 | ⬜ |
| AU-14 | Indikátor síly hesla — heuristika (5 segmentů) `[human]` | — | ⏭️ |

## C. Reset hesla

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AU-20 | `forgot-password` vždy 200 (anti-enumeration), throttle 3/15min/IP `[auto]` | M1+M4 | ⬜ |
| AU-21 | `reset-password` revokuje **všechny** refresh tokeny, žádný auto-login `[auto]` | M1 | ⬜ |
| AU-22 | Token: sha256 hash v DB, single-use, TTL 1h `[auto]` | M1 | ⬜ |
| AU-23 | Reset u pending-deletion účtu zruší soft-delete (D-037) `[auto]` | M1 | ⬜ |
| AU-24 | `ResetPasswordPage` mapuje BE error kódy (expired/invalid token) `[auto]` | M1+M2 | ⬜ |

## D. E-mail verify & change

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AU-30 | `email-verify` (anon) + `resend` (JWT, throttle 3/15min); `emailVerifiedAt` set `[auto]` | M1 | ⬜ |
| AU-31 | `email-change-request` vyžaduje `currentPassword`; confirm na NOVÝ + info na STARÝ `[auto]` | M1 | ⬜ |
| AU-32 | `email-change-confirm` race check → 409 EMAIL_TAKEN `[auto]` | M1+M2 | ⬜ |
| AU-33 | `EmailVerifyPage` / `EmailChangeConfirmPage` auto-fire on mount, 3 stavy `[auto]` | M1 | ⬜ |
| AU-34 | Mailer **stub fallback** když chybí `MAIL_PASS` (dev nespadne) `[auto]` | M1 | ⬜ |

## E. Odhlášení, ban, smazání

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AU-40 | Logout 5s „Vrátit" — tokeny se mažou až po vypršení timeru `[auto]` | M1 | ⬜ |
| AU-41 | Změna hesla (SecuritySection) vyžaduje staré heslo, revokuje rodinu refresh tokenů `[auto]` | M1 | ⬜ |
| AU-42 | Smazání účtu: typing username + checkbox + PJ handover preview (`dryRun`) `[auto]` | M1+M2 | ⬜ |
| AU-43 | `SOLE_PJ_BLOCK` — nelze smazat jediného PJ bez Pomocného; auto-promote `[auto]` | M1 | ⬜ |
| AU-44 | Reaktivace přes `reactivate-deletion`; `<UserAvatar deleted />` overlay `[auto]` | M1 | ⬜ |
| AU-45 | **Account-cleanup cron je stub → účty se reálně nemažou** (N-3) | M1 | 🐛 |

## F. Bezpečnost (průřez)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| AU-50 | Žádný token/hash/heslo v response shapes (privacy test) `[auto]` | M2+M4 | ⬜ |
| AU-51 | `JwtStrategy.validate` gate: isDeleted/deletionRequestedAt/bannedAt `[auto]` | M1+M4 | ⬜ |
| AU-52 | Throttle na všech citlivých endpointech (forgot/reset/verify/email-change) `[auto]` | M1 | ⬜ |

---

### Známá rizika (vstup do kontroly)
- **N-3** account-cleanup cron stub (AU-45) — hard delete nefunguje.
- D-037 reaktivace přes reset — ověřit že stále drží.
- Mailer stub fallback — ověřit že prod cesta není omylem vypnutá.
