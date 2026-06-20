# bug / 01-auth-ucet — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Soubory prošlé
**BE:**
- `backend/src/modules/auth/auth.controller.ts` — všechny routes, throttle, guard dekorace
- `backend/src/modules/auth/auth.service.ts` — login, register, loginTotp, reactivateDeletion, refresh, logout, forgotPassword, resetPasswordByToken, verifyEmail, resendEmailVerification, confirmEmailChange, sanitize, handlePasswordChanged
- `backend/src/modules/auth/strategies/jwt.strategy.ts` — validate payload
- `backend/src/common/guards/jwt-auth.guard.ts` — per-request gate (isDeleted/bannedAt/deletionRequestedAt)
- `backend/src/modules/security-tokens/security-tokens.service.ts` — issue/consume/peek, sha256 hash
- `backend/src/modules/mailer/mailer.service.ts`, `mailer.module.ts`, `smtp-mailer.provider.ts` — provider factory, stub fallback
- `backend/src/modules/auth/captcha.service.ts` — fail-closed logic
- `backend/src/modules/users/users.controller.ts` — changePassword, requestSelfDeletion, getSelfDeletionStatus, cancelSelfDeletion, requestEmailChange, username-request routes
- `backend/src/modules/users/users.service.ts` (changePassword, requestEmailChange sekce)
- `backend/src/modules/users/services/account-cleanup.cron.ts` — sweep() implementace
- `backend/src/modules/admin/admin.service.ts` — banUser / unbanUser (emit bez revoke)
- `backend/src/modules/admin/users-identity.gateway.ts` — identity.changed listener

**FE:**
- `src/features/auth/api/useAuth.ts` — useLogin, useLoginTotp, useRegister, useLogout, useAuthBootstrap, useCurrentUserHydration
- `src/features/auth/api/useEmailVerify.ts`, `useEmailChangeConfirm.ts`, `useResetPassword.ts`, `useForgotPassword.ts`, `useAvailability.ts`
- `src/features/auth/components/LoginModal.tsx`, `RegisterModal.tsx`, `ForgotPasswordModal.tsx`, `ReactivateAccountModal.tsx`
- `src/features/auth/pages/EmailVerifyPage.tsx`, `EmailChangeConfirmPage.tsx`, `ResetPasswordPage.tsx`
- `src/features/profile/components/SecuritySection.tsx`, `AccountSection.tsx`, `DeleteAccountModal.tsx`
- `src/features/profile/api/useDeleteAccount.ts`, `useEmailChangeRequest.ts`
- `src/features/profile/api/useProfile.ts` (useChangePassword)
- `src/shared/types/index.ts` — LoginResponse, LoginOkResponse, LoginDeletionPendingResponse

### Osy
AU-01 ✅ · AU-02 ✅ · AU-03 🔴 (refresh nechráněný po banu) · AU-04 ✅ · AU-05 ✅ · AU-06 ✅
AU-07 ✅ · AU-10 ✅ · AU-11 ✅ · AU-12 ✅ · AU-13 ✅
AU-20 🟡 (throttle odchylka) · AU-21 🟡 (double revoke) · AU-22 ✅ · AU-23 ✅ · AU-24 ✅
AU-30 ✅ · AU-31 ✅ · AU-32 ✅ · AU-33 ✅ · AU-34 ✅
AU-40 ✅ · AU-41 ✅ · AU-42 ✅ · AU-43 ✅ · AU-44 ✅ · AU-45 ✅ (N-3 opraveno)
AU-50 🟡 (FE type drift deletionReason) · AU-51 ✅ · AU-52 🟡 (forgot-password throttle odchylka od spec)

### M-metody použité
- M1 (statické čtení) — všechny výše
- M2 (kontrakt FE↔BE) — LoginResponse, ResetPasswordResponse, DeletionResponse, EmailChangeConfirm

## Dosažená L vs cílová L

L2 / cílová L3

L3 by vyžadoval spuštění existujících testů pro každou konkrétní cestu — viz PROOF-REQUEST níže.
L2 dosažena: strukturální cross-ref FE↔BE, flow, guard logika, throttle, token lifecycle, sanitize.

## Nálezy

### N-RUN-01 — 🔴 Ban nerevokuje refresh tokeny (AU-03 částečné)
**Osa:** AU-03 / F (bezpečnost)
**Kde:** `backend/src/modules/admin/admin.service.ts:398` (banUser), `backend/src/modules/auth/auth.service.ts:409-420` (refresh)
**Detail:** `banUser()` emituje `user.identity.changed` (WS signál klientovi) ale NEvolá `refreshRepo.revokeAllForUser`. `auth.service.refresh()` na řádku 409 fetchuje uživatele ale **nekontroluje `user.bannedAt`** ani `user.isDeleted`. Výsledek: zabanovaný uživatel:
  1. Dostane WS signál → FE ho odhlásí (pokud je online).
  2. Ale jeho refresh tokeny zůstávají aktivní v DB.
  3. Může volat `POST /auth/refresh` s původním refresh tokenem → dostane nový access token.
  4. Tento access token je pak blokován JwtAuthGuard per-request (401 BANNED) — ale samotné vydání nového tokenu je narušením bezpečnostního invariantu.
  5. Offline útočník (bash script) může opakovaně refreshovat dokud BE cron nevyexpiruje tokeny (30 dní).
**Dopad:** Ban je prakticky obejitelný pro uživatele s refresh tokenem. JwtAuthGuard blokuje faktický přístup, ale token rotace nezastaví. Scénář: zabanovaný uživatel píše bot script, získá nové access tokeny každých 7 dní po dobu 30 dní.
**Návrh:** (A) V `banUser()` přidat volání `revokeAllForUser(userId)` (stejně jako při password change), NEBO (B) v `auth.service.refresh()` přidat `if (user.bannedAt || user.isDeleted) throw UnauthorizedException(...)`. Obě možnosti se doplňují. Varianta B je obranná vrstva navíc.
**L2** · klasifikace: 🆕 nový

---

### N-RUN-02 — 🟡 `LoginDeletionPendingResponse` FE má `deletionReason` navíc (AU-50 drift)
**Osa:** AU-50 / F (kontrakt)
**Kde:** `src/shared/types/index.ts:271-276` vs `backend/src/modules/auth/auth.service.ts:51-55`
**Detail:** FE type `LoginDeletionPendingResponse` deklaruje `deletionReason: string | null`, ale BE `LoginResult` deletion_pending branch toto pole NEVRACÍ (pouze `deletionRequestedAt` a `scheduledHardDeleteAt`). FE DeleteAccountModal ani ReactivateAccountModal `deletionReason` nepoužívají — pole je mrtvé na FE i na BE response. Čistě kontrakt drift.
**Dopad:** Typová nepravdivost — FE čeká pole, které nikdy nepřijde. TypeScript to neodhalí (pole je optional v union). Runtime: žádný (pole se nepoužívá).
**Návrh:** Odebrat `deletionReason` z `LoginDeletionPendingResponse` FE typě.
**L2** · klasifikace: 🆕 nový

---

### N-RUN-03 — 🟡 `forgotPassword` throttle 5/min místo spec 3/15min/IP (AU-20 odchylka)
**Osa:** AU-20 / F (bezpečnost)
**Kde:** `backend/src/modules/auth/auth.controller.ts:220` — `@Throttle({ default: { ttl: 60_000, limit: 5 } })`
**Detail:** Plán AU-20 říká "throttle 3/15min/IP". Implementace má 5 requestů za 1 minutu (`ttl: 60_000, limit: 5`). To je fakticky 300 požadavků za hodinu (vs. spec 12/hod). Endpoint je anti-enumeration (vždy vrací 200), takže throttle je jediná obrana proti zneužití SMTP (floodování) nebo časování.
**Dopad:** Anti-enumeration endpoint může být zahlcen 300×/hod místo 12×/hod na IP. V praxi: SMTP může dostat flood. Nízká exploitability (CF Turnstile není na forgot-password), ale odchylka od spec.
**Návrh:** Zvážit `ttl: 15 * 60_000, limit: 3` (= 3/15min) nebo minimálně `ttl: 60_000, limit: 3` (= 3/min = 180/hod, lepší kompromis). `resend-verification` má správně `limit: 3`.
**L2** · klasifikace: 🆕 nový

---

### N-RUN-04 — 🟡 `resetPasswordByToken` double-revoke refresh tokenů (AU-21 vedlejší)
**Osa:** AU-21
**Kde:** `backend/src/modules/auth/auth.service.ts:540-541` — `revokeAllForUser` pak `emit('user.password.changed')` → `handlePasswordChanged` → `revokeAllForUser` znovu
**Detail:** `resetPasswordByToken` volá `await this.refreshRepo.revokeAllForUser(userId)` na řádku 540, pak emituje `user.password.changed` na řádku 541. To spustí `handlePasswordChanged` (@OnEvent), který volá `revokeAllForUser` podruhé. Druhý call je idempotentní (revoke nad revoked záznamy) ale zbytečná DB operace.
**Dopad:** Pouze efektivnostní, žádný bezpečnostní ani funkcionální dopad. DB update 2× místo 1×.
**Návrh:** Buď (A) v `resetPasswordByToken` nevydávat `user.password.changed` event (revoke je přímý), NEBO (B) nechat jak je (idempotentní). Malé, bez priority.
**L1** · klasifikace: 🆕 nový (minor, 🟡 technický dluh)

---

### Dříve evidované nálezy (kontrola regrese)

- **AU-45 / N-3** (account-cleanup cron) — ✅ OVĚŘENO OPRAVENO: `sweep()` je reálný, implementuje find+anonymize+emit loop. Cron spec vrácen do tsconfig.
- **N-6 contract drift** (email-verify naming) — ✅ OVĚŘENO OPRAVENO: FE volá `/auth/verify-email`, `/auth/resend-verification`, `/auth/confirm-email-change` — sedí na BE routy.
- **AU-03 ban (N-3 část)** — JwtAuthGuard per-request gate ✅ funguje (banAt → 401 BANNED). Ale viz N-RUN-01 výše (refresh gap).

## PROOF-REQUEST

### PR-01 — Smoke: ban + refresh flow (N-RUN-01)
**Co spustit:**
```
# BE jest targeted test:
npx jest --maxWorkers=2 --testPathPattern="auth.service.spec"
# Ověřit: existuje test "refresh odmítne bannedAt uživatele"?
# Pravděpodobně NE — viz N-RUN-01.
```
**Co má dokázat:** Pokud test neexistuje, potvrdit L2→nižší. Pokud existuje a je zelený, eskalovat na L3.

### PR-02 — Smoke: banUser revokes tokens (N-RUN-01)
**Co spustit:**
```
npx jest --maxWorkers=2 --testPathPattern="admin.service.spec"
# Ověřit: existuje test "banUser revokuje refresh tokeny"?
```
**Co má dokázat:** Absence testu = konvenční důkaz L2 toho, že revoke se nevolá.

### PR-03 — Smoke: resetPasswordByToken double-revoke (N-RUN-04)
**Co spustit:**
```
npx jest --maxWorkers=2 --testPathPattern="auth.service.spec" --verbose 2>&1 | grep -i "revokeAll\|resetPassword"
```
**Co má dokázat:** Kolikrát se revokeAllForUser volá v reset flow.
