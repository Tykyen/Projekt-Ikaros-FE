# form-schema / 01-auth — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20  
Auditor: agent  
Git: FE HEAD (main), BE HEAD (main)

---

## Pokrytí

Prošel jsem:
- FE: `loginSchema.ts`, `registerSchema.ts`, `resetPasswordSchema.ts`, `forgotPasswordSchema.ts`
- FE API: `useAuth.ts`, `useResetPassword.ts`, `useForgotPassword.ts`
- FE komponenty: `RegisterModal.tsx`, `LoginModal.tsx` (grep), `TotpVerifyStep.tsx`, `TotpSetupWizard.tsx`, `TotpCard.tsx`
- FE profil: `profileSchemas.ts`, `emailChangeSchema.ts`, `SecuritySection.tsx`, `useProfile.ts` (2FA mutations)
- FE typy: `shared/types/index.ts` (RegisterRequest, LoginRequest, LoginTotpRequest, ChangePasswordRequest)
- BE DTO: `auth/dto/` — register, login, reset-password, forgot-password, login-totp, enable-totp, password-confirm, confirm-email-change, verify-email, logout, refresh
- BE DTO: `users/dto/` — change-password, reset-password, request-username-change, request-email-change
- BE controller: `auth.controller.ts` (resetPassword import), `two-factor.controller.ts`
- BE service: `auth.service.ts` (register flow, TERMS_VERSION)
- DB: `user.schema.ts`
- Testy: `useResetPassword.spec.tsx` (F-01), `useRequestUsernameChange.spec.tsx` (F-27)
- Registr: `form-schema-audit.md` (F-01..F-28 + F-RUN-01)
- Plán: `form-schema-plan/01-auth.md`

---

## Dosažená L vs cílová L

| Flow | Dosaženo | Cíl |
|------|----------|-----|
| Login (identifier/password) | L2 (statická shoda ověřena) | L2 |
| Register (email/username/password/acceptedTerms/hp/captcha) | L2 | L2 |
| Forgot-password (email) | L2 | L2 |
| Reset-password token flow | L3 (F-01 kontrakt test existuje + zelený) | L3 |
| 2FA login TOTP (TotpVerifyStep) | L1 | L2 |
| 2FA enable (TotpSetupWizard) | L1 | L2 |
| 2FA disable/regenerate (TotpCard) | L1 | L2 |
| Change password (SecuritySection) | L2 | L2 |
| Email change confirm (useEmailChangeConfirm) | L2 | L2 |
| Username change (useRequestUsernameChange) | L3 (F-27 test existuje) | L3 |

Celkový dosažený průměr: **L2** (statická shoda). L4 (round-trip) neprovedeno — vyžaduje živou DB.

---

## Nálezy

### 🆕 F-RUN-AU-01 — `RQ` `NM` RegisterRequest.acceptedTerms optionální v TS, povinný v DTO · 🟡

- **Pole:** `acceptedTerms` v `RegisterRequest`
- **FE:** `src/shared/types/index.ts:243` — `acceptedTerms?: boolean` (optional)
- **BE DTO:** `auth/dto/register.dto.ts:27` — `@IsBoolean()` bez `@IsOptional()` = required
- **Drift:** TS typ říká "optional", DTO vyžaduje boolean. RegisterModal.tsx:138 vždy posílá `acceptedTerms: values.acceptedTerms`, takže v praxi nevadí — ale statické typy jsou lživé. Někdo, kdo čte `RegisterRequest` typově, může omylem pole vynechat → BE 400.
- **Dopad na existující data:** žádný (runtime path se neshoduje s typem, ale funguje)
- **Návrh:** sjednotit `acceptedTerms: boolean` (non-optional) v `RegisterRequest` nebo přidat `@IsOptional()` do DTO (ale pak se poruší server-side enforcement, co přidal F-03). Lepší: FE typ opravit na `boolean`.
- **L1** (jen statické čtení)

---

### 🆕 F-RUN-AU-02 — `LN` `RQ` TotpCard password gate jen `!password` (min 1) vs BE `@MinLength(6)` → 400 · 🟠

- **Pole:** `password` v `POST /auth/2fa/disable` a `POST /auth/2fa/backup-codes/regenerate`
- **FE (TotpCard.tsx):** `src/features/profile/components/TotpCard.tsx:155` — submit disabled pouze když `!password` (prázdné string) — chybí délková validace; žádný zod/RHF, raw `useState`
- **FE schema (definováno, ale nepoužito):** `src/features/profile/lib/profileSchemas.ts:56-58` — `totpDisableSchema` má `min(1)` — ale ani to by nestačilo, a navíc schema je **importováno jen do spec souboru**, ne do komponenty
- **BE DTO:** `auth/dto/password-confirm.dto.ts:8` — `@IsString() @MinLength(6)` bez `@MaxLength`
- **Drift:** FE pustí heslo délky 1-5 znaků → BE `@MinLength(6)` → **400**. Uživatel dostane generickou chybu bez vysvětlení.
- **Dopad na existující data:** žádný (request kontrakt)
- **Návrh:** (a) přidat `@MaxLength(128)` do `PasswordConfirmDto` (chybí na BE — parity s ostatními heslovými DTO); (b) v `TotpCard.tsx` použít `totpDisableSchema` přes RHF nebo aspoň `min(6)` inline check; (c) opravit `totpDisableSchema.password` z `min(1)` na `min(6)`.
- **L1**

---

### 🆕 F-RUN-AU-03 — `RG` TotpSetupWizard posílá nevalidovaný TOTP kód → BE `@Matches(/^\d{6}$/)` → 400 · 🟡

- **Pole:** `code` v `POST /auth/2fa/enable`
- **FE (TotpSetupWizard.tsx):** `src/features/profile/components/TotpSetupWizard.tsx:41-42` — `enable.mutateAsync(code.trim())` s gate pouze `!code.trim()` (disabled check) — žádná regex validace
- **FE schema (definováno, ale nepoužito):** `src/features/profile/lib/profileSchemas.ts:53-55` — `totpCodeSchema` `regex(/^\d{6}$/)` existuje ale není hooknut do TotpSetupWizard
- **BE DTO:** `auth/dto/enable-totp.dto.ts:7-10` — `@Matches(/^\d{6}$/, 'Kód musí být 6 číslic.')`
- **Drift:** FE pustí libovolný neprázdný string (např. "abc", "1234", "123 456") → BE regex selže → 400 bez jasné UX zprávy v komponentě.
- **Dopad na existující data:** žádný
- **Návrh:** hooknou `totpCodeSchema` do `TotpSetupWizard` přes RHF nebo aspoň inline `code.match(/^\d{6}$/)` check + UX hlášku před odesláním.
- **L1**

---

### 🆕 F-RUN-AU-04 — `LN` PasswordConfirmDto chybí `@MaxLength` · 🟡

- **Pole:** `password` v `PasswordConfirmDto` (disable 2FA, regenerate backup codes)
- **BE DTO:** `auth/dto/password-confirm.dto.ts:8` — `@IsString() @MinLength(6)` bez `@MaxLength`
- **Kontext:** všechna ostatní heslová BE DTO mají `@MaxLength(128)` (RegisterDto, ChangePasswordDto, ResetPasswordDto). Chybějící max = DoS vektor (velmi dlouhý string → bcrypt.compare + hash time).
- **Dopad na existující data:** žádný
- **Návrh:** přidat `@MaxLength(128)` do `PasswordConfirmDto`.
- **L1**

---

### ♻️ F-23 (K-F1) — username 3 různá pravidla — potvrzena platnost · 🟡

- **Stav z minulého sweepu:** F-23 `@RG` username drift — register `/^[^@]+$/` vs change FE `/^[a-z0-9-]+$/` vs change BE `/^[^@]+$/`
- **Ověření HEAD:**
  - `registerSchema.ts:14` — `regex(/^[^@]+$/)` ✅ (lenient)
  - `register.dto.ts:17` — `@Matches(/^[^@]+$/)` ✅ shodné s FE register
  - `profileSchemas.ts:46-49` — `regex(/^[a-z0-9-]+$/)` (přísnější slug)
  - `request-username-change.dto.ts:8` — `@Matches(/^[^@]+$/)` (lenient jako register, ne slug)
  - Registr: F-23 stav „lživý komentář opraven, kanonická rozhodnutí odložena"
- **Závěr:** drift trvá — register DTO+schema lenient, change DTO lenient, ale change FE přísnější. Stávající uživatelé registrovaní s mezerami/verzálemi nemohou tytéž přezdívky přes change flow přejmenovat zpět (change FE by odmítl). Nový nález → zachytit jako ♻️ F-23 trvá.
- **L2** (staticky ověřeno ve 3 vrstvách)

---

### ♻️ F-01 — reset hesla FE `newPassword` → BE `password` — OPRAVENO, ověřeno L3 ✅

- `useResetPassword.ts:28-31` — mapuje `newPassword → password` v body. Komentář a test potvrzují.
- Test `useResetPassword.spec.tsx` ověřuje payload klíče.
- **L3**

---

### ♻️ F-03 — GDPR acceptedTerms — OPRAVENO, ověřeno L2 ✅

- `register.dto.ts:27` — `@IsBoolean()` přítomno
- `auth.service.ts:116,150-151` — BE validuje `=== true` + ukládá `acceptedTermsAt`+`termsVersion`
- `user.schema.ts:84-85` — `acceptedTermsAt`, `termsVersion` v DB
- Ale: `RegisterRequest.acceptedTerms?: boolean` (optional typ) — viz F-RUN-AU-01.
- **L2**

---

### ♻️ F-27 — username change payload — OPRAVENO, ověřeno L3 ✅

- `useAdminUsers.ts:36` — mapuje `requestedUsername → newUsername`
- Test `useRequestUsernameChange.spec.tsx` ověřuje payload.
- **L3**

---

### Potvrzená shoda (bez nálezů) — základní auth flow

| Flow | FE | BE DTO | DB | Status |
|------|----|---------|----|--------|
| Login `identifier` `min(1)/max(255)` | `loginSchema:4-6` | `LoginDto:10-12` | — | ✅ L2 |
| Login `password` `min(1)` | `loginSchema:8` | `LoginDto:16` | — | ✅ L2 |
| Register `email` `.email()/max(255)` | `registerSchema:7-9` | `RegisterDto:12` `@IsEmail` | `required unique lowercase` | ✅ L2 (FE max255, BE bez max — ⚖️ by-design) |
| Register `username` `min(3)/max(32)/regex` | `registerSchema:11-14` | `RegisterDto:15-17` | `required unique` | ✅ L2 |
| Register `password` `min(6)/max(128)` | `registerSchema:16-18` | `RegisterDto:19` | `passwordHash` | ✅ L2 |
| Register `hp` `max(0)` | `registerSchema:27` | `RegisterDto:51` `@MaxLength(0)` | — | ✅ L2 |
| Register `captchaToken` optional | component state | `RegisterDto:38-39` `@IsOptional @MaxLength(2048)` | — | ✅ L2 |
| Forgot `email` `.email()/max(255)` | `forgotPasswordSchema:4-8` | `ForgotPasswordDto:12-14` | — | ✅ L2 |
| Reset `token` `min(32)/max(128)` | (z URL, bez FE validace) | `ResetPasswordDto:6-8` | — | ✅ L2 |
| Reset `password` `min(8)/max(128)` | `resetPasswordSchema:5-8` | `ResetPasswordDto:12-14` | — | ✅ L2 (FE pole `newPassword`, ale useResetPassword mapuje → `password`) |
| Change password `oldPassword/newPassword` | `passwordSchema:21,23-25` | `ChangePasswordDto:4-5` | — | ✅ L2 |
| Email change confirm `token` | `useEmailChangeConfirm:8` string | `ConfirmEmailChangeDto:6-8` `min(32)/max(128)` | — | ✅ L1 (FE posílá raw string z URL, bez délkové FE validace — nízké riziko) |
| 2FA login TOTP `challengeId/code/trustDevice` | `TotpVerifyStep:55-59` | `LoginTotpDto:9,14,22` | — | ✅ L1 (pole sedí; backup kód projde LoginTotpDto code `@MaxLength(64)`) |
| 2FA disable `password` | `TotpCard:44/password` | `PasswordConfirmDto:8` | — | 🐛 F-RUN-AU-02 |
| Request email change `newEmail/currentPassword` | `emailChangeSchema:4-13` | `RequestEmailChangeDto:7-14` | — | ✅ L2 |

---

## PROOF-REQUEST

**PR-AUTH-01** — Round-trip (M4) reset hesla: zavolat `POST /auth/forgot-password` → najít token v DB → `POST /auth/reset-password { token, password }` → ověřit nové heslo funguje a staré ne. Nutná živá DB. Potvrdí, že F-01 fix skutečně umožňuje dokončit flow.

**PR-AUTH-02** — Red-team (M5) 2FA disable s heslem délky 1-5: `POST /auth/2fa/disable { password: "x" }` (autorizovaný JWT). Očekávaný výsledek: 400 `@MinLength(6)`. Potvrdí F-RUN-AU-02 bez živé infrastruktury: BE test se dá napsat.

**PR-AUTH-03** — Red-team (M5) 2FA enable s nevalidním kódem: `POST /auth/2fa/enable { code: "abc" }`. Očekávaný výsledek: 400 `@Matches`. Potvrdí F-RUN-AU-03.

**PR-AUTH-04** — Ověřit, zda `totpCodeSchema` a `totpDisableSchema` mají **testy** (`profileSchemas.spec.ts`) — a pokud ne, přidat je. Statickým čtením spec souboru (M3).
