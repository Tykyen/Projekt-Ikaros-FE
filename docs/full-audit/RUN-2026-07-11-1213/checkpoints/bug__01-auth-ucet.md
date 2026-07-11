# bug — 01 Auth & účet · dosažená L2 (kontrakt obě strany) / cílová L3

Styl: bug (registr `docs/bug-audit.md`, prefix N-). READ-ONLY.
Rozsah: BE `auth`, `security-tokens`, `mailer`, `users` (self-service) · FE `features/auth/*`, `features/profile` (Security/Account/Delete/EmailChange).

## Nové nálezy

### N-RUN-01 — [E. změna hesla / AU-41] Špatné staré heslo ukáže generickou chybu místo field-hlášky
- **Kde:** FE `features/profile/components/SecuritySection.tsx:97` × BE `modules/users/users.service.ts:361-369`.
- **Důkaz:** FE `onSubmitPassword` rozlišuje špatné heslo přes `if (isAxiosError(err) && err.response?.status === 401) { passwordForm.setError('oldPassword', {message:'Současné heslo je špatně'}) }`. BE `changePassword` ale u špatného starého hesla háže **400** `INVALID_PASSWORD` (komentář FIX-50: „400, ne 401 … 401 zbytečně spouští refresh-token flow na interceptoru"). Interceptor `shared/api/client.ts:94` refresh dělá jen na 401 → 400 projde beze změny → `status === 401` je NIKDY true → vždy padne do `else` s generickou root hláškou „Nepodařilo se změnit heslo. Zkus to znovu."
- **Kontrast (správný vzor):** `features/profile/components/ChangeEmailModal.tsx:57-61` čte `parseApiErrorCode(err)` a matchuje `code === 'INVALID_PASSWORD'` (EC-08 fix). SecuritySection zůstala na starém 401 kontraktu z doby před FIX-50 = drift.
- **Dopad:** Uživatel se špatným současným heslem při změně hesla dostane matoucí obecnou chybu u kořene formuláře místo jasné field-hlášky „Současné heslo je špatně" pod polem. Field-větev je mrtvý kód. Non-security, UX.
- **Návrh:** matchovat `parseApiErrorCode(err) === 'INVALID_PASSWORD'` (jako ChangeEmailModal), ne `status === 401`.
- **Klasifikace:** 🆕 🟡 · **L2** (ověřeno obě strany).

## Drobné (pod prahem N-, k uvážení)

- **[E/AU-42] DeleteAccountModal case-insensitive vs BE case-sensitive.** FE `DeleteAccountModal.tsx:110` `usernameMatch = typed.toLowerCase() === me.username.toLowerCase()`; BE `users.service.ts:770` porovnává exakt `confirmUsername !== user.username` → USERNAME_MISMATCH 400. Username s velkými písmeny + napsání malými → FE povolí submit, BE odmítne (toast). Nízká UX drift. 🟡
- **[A/AU-04] `LoginDeletionPendingResponse.deletionReason` (required) v `shared/types/index.ts:336`, ale BE login deletion_pending větev (`auth.service.ts:222-229`) pole neposílá.** Runtime `undefined`, TS čeká `string|null`. Nepoužito (LoginModal čte jen data). Type drift, neimpaktní.
- **[C] `resetPasswordByToken` (auth.service.ts:548-598) nemá ban check** — reaktivuje (čistí `deletionRequestedAt`) i BANNED účtu, na rozdíl od `reactivateDeletion` (FIX-6 ban check ř.349-353). Reset ale nevydává tokeny → login dál gated `bannedAt` → žádný ban bypass; jediný efekt = banned pending-deletion účtu se zruší naplánovaný hard-delete. Extrémní edge, nízké. 

## Nepřesnosti plánu (ne bug — impl konzistentní)
- **AU-03** říká „403 BANNED"; impl vrací **401** BANNED (login `auth.service.ts:217`, guard `jwt-auth.guard.ts:51`) a FE `client.ts:78` matchuje `status===401 && code==='BANNED'`. Řetěz konzistentní, plán má špatné číslo.
- **AU-51** cituje `JwtStrategy.validate`; gate stavů (isDeleted/deletionRequestedAt/bannedAt + freshness role) je reálně v `JwtAuthGuard.canActivate` (`jwt-auth.guard.ts:43-69`). Enforcement přítomný a korektní (per-request, `@AllowPendingDeletion` výjimka pro status/cancel).
- **AU-30/AU-20** throttle okna: verify-email 30/min, resend-verification 3/min, forgot/reset/confirm/email-change 5/min, login 5/min, register 10/min (plán uvádí „3/15min" — ochrana existuje, jen jiná čísla).
- **AU-34** stub fallback se volí dle `SMTP_HOST` + `SMTP_USER` (`mailer.module.ts:15`), ne `MAIL_PASS`; dev bez SMTP → `LogMailerProvider`, `dispatch` polyká chyby → nespadne. OK.

## Ověřeno OK (bez nálezu)
- AU-01 identifier email/přezdívka dle `@` (`auth.service.ts:191`); email/username case-insensitive přes repo (`users.repository.ts:27,38` toLowerCase) — login i register konzistentní.
- AU-02 špatné heslo → 401 INVALID_CREDENTIALS, žádný token. AU-05 isDeleted → 401 DELETED. AU-07 lastLoginAt v login (`:250`) i register (`:151`).
- AU-04 deletion_pending → 200 union `{status}` → LoginModal → ReactivateAccountModal (`LoginModal.tsx:100`). AU-06 mapErrorToMessage rozlišuje 401/429/network/5xx/400 (`LoginModal.tsx:32`).
- AU-10 EMAIL_TAKEN/USERNAME_TAKEN rozlišeno (`RegisterModal.tsx:157`). AU-11 check-username/email debounced, throttle 60/min, `u`/`e` param sedí (`useAvailability.ts` × controller). AU-12 username regex bez `@` + password match (registerSchema). AU-13 auto-login + verify mail (`auth.service.register`).
- AU-20 forgot vždy `{ok:true}` (`auth.service.ts:518`). AU-21 reset revokuje všechny refresh + žádný auto-login (`:580`, FE redirect `/?openLogin=1`). AU-22 sha256 hash + single-use + TTL 1h + invalidace předchozích (`security-tokens.service.ts`). AU-23 reset reaktivuje pending-delete (D-037, `:569-595`). AU-24 ResetPasswordPage mapuje INVALID/EXPIRED/ALREADY_USED (`:18`).
- AU-30 verify-email anon + resend JWT (`auth.controller.ts:257,270`), emailVerifiedAt set. AU-31 request-email-change vyžaduje currentPassword, confirm na NOVÝ + notice na STARÝ (`users.service.ts:602-631`). AU-32 confirm race → 409 EMAIL_TAKEN (`auth.service.ts:670`). AU-33 EmailVerify/EmailChangeConfirm auto-fire on mount, 3 stavy.
- AU-40 logout 5s undo, tokeny až po timeru (`useAuth.ts:133`). AU-41 change-password vyžaduje staré heslo + revoke všech refresh přes `user.password.changed` (kromě N-RUN-01 UX). AU-42 typing username + checkbox + dryRun preview (DeleteAccountModal). AU-43 SOLE_PJ_BLOCK + auto-promote (`requestSelfDeletion` assessPJHandover). AU-44 reaktivace přes reactivate-deletion (D-034b promotions revert = známý dluh, BE nevrací). AU-45 = N-3 (cron už reálný, potvrzeno `account-cleanup.cron.ts:44 sweep`).
- AU-50 sanitize odstraní passwordHash/totpSecretEnc/backupCodeHashes (auth+users). AU-51 gate viz výše. AU-52 throttle na citlivých endpointech přítomen.
- Kontrakt N-6a (verify-email/resend-verification/confirm-email-change/request-email-change/reactivate-deletion/deletion-request/password) — FE volá kanonické BE routy, drift z 1. kola opraven.

## Co jsem prošel
BE: auth.controller, auth.service (celý), security-tokens.service, mailer.service+module, jwt.strategy, jwt-auth.guard, users.service (changePassword/reset/requestEmailChange/requestUsernameChange/self-deletion), users.controller (routy+guardy), DTO (register/login/reset/forgot/verify/change-password/request-email-change/self-deletion), account-cleanup.cron (potvrzení N-3). FE: client.ts, useAuth, useAvailability, useEmailVerify/ChangeConfirm/ChangeRequest/ForgotPassword/ResetPassword/DeleteAccount/Profile(changePassword), LoginModal, RegisterModal+schema, ResetPasswordPage, EmailVerifyPage, EmailChangeConfirmPage, SecuritySection, DeleteAccountModal, ChangeEmailModal, ReactivateAccountModal, shared/types LoginResponse union.

## PROOF-REQUESTy (na proof-vrstvu, read-only nespuštěno)
- **M7 gap-fill:** test pro N-RUN-01 — mock BE 400 `INVALID_PASSWORD`, assert že SecuritySection ukáže field error na `oldPassword` (dnes selže → po fixu zelený).
- **M3:** spustit `features/profile` + `features/auth` vitest (SecuritySection.spec pokud existuje) — ověřit, že žádný test dnes neasertuje 401-větev (jinak by chránil starý kontrakt).
- **+authz-runtime:** e2e — banned pending-deletion účet: forgot→reset zruší deletion, ale login zůstane 401 BANNED (ověřit, že reset není ban bypass).
