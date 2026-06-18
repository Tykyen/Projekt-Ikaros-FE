# Plán 14.1 — 2FA / TOTP + důvěryhodná zařízení

**Spec:** [spec-14.1.md](spec-14.1.md) (schváleno 2026-06-18)
**Pořadí:** BE celé → restart+test → FE celé → build → `mobil-desktop` → `napoveda`. BE a FE se **nemíchají** v jedné dávce (`feedback_no_mixed_be_fe_batch`).

---

## Dávka BE-1 — Krypto základ + env (nezávislé)
1. `cd backend && npm i otplib qrcode @types/qrcode` (SSL pozor — ověřit).
2. `common/config/env.validation.ts` — `TOTP_ENC_KEY` Joi `.required()`, base64 → 32 B (fail-fast). + `.env.example`, compose `${TOTP_ENC_KEY:?required}`.
3. `modules/auth/services/totp-crypto.service.ts` — AES-256-GCM `encryptSecret/decryptSecret` (klíč z ConfigService). Spec test.

## Dávka BE-2 — Datový model
4. `users/schemas/user.schema.ts` — +5 polí (`totpEnabled` index, `totpSecretEnc`, `backupCodeHashes`, `totpEnabledAt`, `twoFactorMethod`).
5. `users/interfaces/user.interface.ts` — táž pole na `User`.
6. `users/users.repository.ts` `toEntity()` — namapovat (najít definici mapperu; `project_be_field_checklist`).
7. `auth.service.ts` `sanitize()` — vyloučit `totpSecretEnc` + `backupCodeHashes` (+ upravit return typ).

## Dávka BE-3 — Trusted devices modul
8. `modules/trusted-devices/` — schema (`trusted_devices` + TTL index), interface, repository (`save/findByUserId/findByTokenHash/touch/deleteById/deleteAllForUser`), service (`createForUser`→token+cookie hodnota, `matchFromRequest(req,userId)`, `touch`, `list`, `revoke`, `revokeAllForUser`), module.
9. `common/utils/auth-cookie.ts` — `TRUST_COOKIE='ikaros_td'`, `setTrustCookie/clearTrustCookie/readTrustCookie` (vzor refresh, path `/api/auth`, 30 d).
10. Listener `@OnEvent('user.password.changed')` → `revokeAllForUser` (emituje se ze 3 míst — pokryto).

## Dávka BE-4 — Security-token challenge
11. `security-tokens/interfaces/security-token.interface.ts` — typ `'totp_challenge'`.
12. `security-tokens.service.ts` — `peek(plain, type)` (findByHash + kontrola typ/used/expirace, **bez** markUsed).

## Dávka BE-5 — 2FA service + controller (management)
13. `auth/services/totp.service.ts` — `setup(userId)`→{qrDataUrl,secret} (uloží pending enc secret), `enable(userId,code)`→{backupCodes[]}, `disable(userId,password)`, `regenerateBackupCodes(userId,password)`, `verifyCode(user,code)` (otplib window ±1 NEBO backup bcrypt).
14. `auth/two-factor.controller.ts` — `@Controller('auth/2fa')` JwtAuthGuard: `POST setup`, `POST enable`, `POST disable`, `POST backup-codes/regenerate`, `GET trusted-devices`, `DELETE trusted-devices/:id`, `DELETE trusted-devices`. + DTOs.

## Dávka BE-6 — Login integrace
15. `auth.service.ts` `LoginResult` union +`{status:'totp_required',challengeId}`; `login()` větev: `totpEnabled` → trust-zkratka (req cookie) NEBO `issue('totp_challenge',5min)`. `loginTotp(dto, req, res)` nová metoda.
16. `auth.controller.ts` — `login()` přijme `@Req`, předá trust cookie kontext; nový `POST login/totp` (Throttle 5/min) + nastaví trust cookie když `trustDevice`.
17. `auth.module.ts` / `users` DI — zaregistrovat TotpService, TotpCryptoService, TrustedDevices*, imports.
18. `/users/me` response — `totpEnabled`, `twoFactorMethod`.

## Dávka BE-7 — Testy + ověření
19. Spec testy (totp-crypto, totp.service, trusted-devices.service, auth.service login/totp), e2e (`auth.2fa.e2e-spec`), env fail-fast.
20. `npx jest --maxWorkers=2` (`project_be_test_mongo_flaky`) + `npm run typecheck` + lint. **BE restart** (`feedback_be_restart_required`).

---

## Dávka FE-1 — Typy + API
21. `shared/types` — `LoginResponse` union +`totp_required`; `MeResponse.totpEnabled/twoFactorMethod`.
22. `features/auth/api/useAuth.ts` — `useLogin` union handling + `useLoginTotp`.
23. `features/profile/api/useProfile.ts` — `useTotpSetup/useEnableTotp/useDisableTotp/useRegenerateBackupCodes/useTrustedDevices/useRevokeTrustedDevice`.
24. `features/profile/lib/profileSchemas.ts` — zod (code 6 číslic, disable heslo).

## Dávka FE-2 — Login krok
25. `features/auth/components/TotpVerifyStep.tsx` — kód input + backup toggle + trust checkbox.
26. `features/auth/components/LoginModal.tsx` — `status:'totp_required'` → render TotpVerifyStep (vzor deletion_pending switch).

## Dávka FE-3 — Profil
27. `features/profile/components/TotpCard.tsx` + `TotpSetupWizard.tsx` (QR→kód→backup kódy) + `TrustedDevicesCard.tsx`.
28. `features/profile/components/SecuritySection.tsx` — vložit obě karty.

## Dávka FE-4 — Testy + ověření
29. vitest (`TotpVerifyStep`, `TotpSetupWizard`, `TrustedDevicesCard`, hooky) — explicit importy, fireEvent.
30. `npm run build` (tsc -b, `project_fe_build_preexisting_errors`).
31. Skill `mobil-desktop` (wizard, verify krok, karty).
32. Skill `napoveda` (nová profilová sekce 2FA + bezpečnostní workflow).

---

## Po dokončení
- Zaškrtnout 14.1 v `docs/roadmap2.md` + dopsat follow-up body 14.1-a/-c.
- Memory: `project_2fa_architecture` (challenge flow, trust cookie, enc secret).
- Git nechat na uživateli (`feedback_git_manual`).
