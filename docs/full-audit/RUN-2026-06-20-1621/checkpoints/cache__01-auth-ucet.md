# cache / 01-auth-ucet — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem CELOU oblast 01 proti aktuálnímu HEAD (2026-06-20):

- `src/features/auth/api/useAuth.ts` — useLogin, useLoginTotp, useRegister, useLogout, useCurrentUserHydration, useMyProfile
- `src/features/auth/api/useEmailVerify.ts` — useEmailVerify, useEmailVerifyResend
- `src/features/auth/api/useEmailChangeConfirm.ts` — useEmailChangeConfirm
- `src/features/auth/api/useAuth.spec.tsx` — regresní testy (logout qc.clear, login, register, authBootstrap)
- `src/features/auth/api/useEmailChangeConfirm.spec.tsx` — C-30 regresní test
- `src/features/auth/pages/EmailChangeConfirmPage.tsx` — call-site callback
- `src/features/profile/api/useProfile.ts` — useUpdateProfile, useUploadAvatar, useDeleteAvatar, useUploadCharacterAvatar, useDeleteCharacterAvatar, useChangePassword, useTotpSetup, useEnableTotp, useDisableTotp, useRegenerateBackupCodes, useTrustedDevices, useRevokeTrustedDevice
- `src/features/profile/api/useDeleteAccount.ts` — useRequestSelfDeletion, useReactivateDeletion, useMyDeletionRequest
- `src/features/admin/users/api/useAdminUsers.ts` — useMyUsernameRequest, useRequestUsernameChange, useCancelMyUsernameRequest, useMarkUsernameRequestSeen, useAdminApproveUsernameRequest, useAdminRejectUsernameRequest, useAdminBulkBan/Unban/RoleChange + všechny admin akce
- `src/themes/useThemeSync.ts` + `src/themes/useThemeSync.spec.tsx`
- `src/features/friendships/hooks/useFriendshipsSocket.ts` — C-31 WS listener

Osy: FO, CB, P7, WS, LC. Metody: M1 (čtení), M2 (key-match), M3 (existence testů).

## Dosažená L vs cílová L

- **C-28, C-29 (login/logout/register), C-30, C-31** — opraveno + testy = **L3**
- **C-27, C-32** — by-design (potvrzeno čtením) = **L2**
- **C-RUN-01 (nový nález — viz níže)** — identifikováno staticky = **L1** → PROOF-REQUEST (M4 runtime)
- Celková dosažená hloubka oblasti: **L3** pro opravené; **L1** pro nový nález

## Nálezy

### C-RUN-01 · `CB`/`P7` · useRequestSelfDeletion (dryRun=false) nečistí RQ cache — C-29 fix neúplný
- **Kde:** `src/features/profile/api/useDeleteAccount.ts:70-81`
- **Popis:** `useRequestSelfDeletion` s `dryRun=false` dělá `qc.invalidateQueries(['users','me'])` + vyčistí atomy, ale **NIKDY nevolá `qc.clear()`**. Původní nález C-29 byl opraven pro useLogin/useRegister/useLogout (každý teď volá `qc.clear()`). `useDeleteAccount.ts` ale zůstal se starou implementací — fix se ho nedotkl.
- **Dopad:** Po potvrzení smazání účtu uživatel je okamžitě odhlášen (atomy null), ale RQ cache (`['worlds','my']`, `['friends']`, `['pending-actions']`, `['world-chat',…]`, pošta atd.) přežívá gcTime (5 min). Pokud by na stejném zařízení **okamžitě** zaregistroval nový účet (useRegister volá `qc.clear()` ✅), stará cache se odstraní. Ale pokud by se přihlásil jiný existující uživatel přes LoginModal (`useLogin` zavolá `qc.clear()` ✅), taky OK. **Okno je:** registrace přes `/auth/register` route přímo (bez modalu) nebo přihlášení přes TOTP flow — ale oba tyto tahy taky mají `qc.clear()`. Reálné okno je tedy úzké (gcTime 5 min, jen stale data, `enabled: !!accessToken` blokuje refetche). Přesto jde o nezáměrné opomenutí (C-29 fix pokryl jen 3 ze 4 míst).
- **Severity:** 🟡 (tiché stale; bezpečnostní dopad tlumený, stejný cleanup dostane `qc.clear()` při příštím loginu/registraci; undo okno pro logout neexistuje, takže zpoždění clear je jen gcTime)
- **Návrh:** Přidat `qc.clear()` do `useRequestSelfDeletion.onSuccess` po vyčištění atomů (stejný vzor jako useLogout):
  ```ts
  store.set(currentUserAtom, null);
  qc.clear(); // ← doplnit, parita s useLogout C-29
  ```
- **L1** · 🆕

## Potvrzené opravy (HEAD verifikace)

| Nález | Stav v kódu (HEAD) | Osa | L |
|---|---|---|---|
| C-27 | ⚖️ `useCurrentUserHydration` bridge funguje; záměrná implicitní propagace | P7 | L2 |
| C-28 | ✅ `useThemeSync.ts:76` → `qc.setQueryData(['users','me'])` po PATCH; test v spec.tsx | FO | L3 |
| C-29 | ✅ useLogin:44, useLoginTotp:67, useRegister:90, useLogout:123 — všechny mají `qc.clear()` | CB | L3 |
| C-29 (self-delete) | ❌ `useDeleteAccount.ts:70-81` — chybí `qc.clear()` → **C-RUN-01** | CB | — |
| C-30 | ✅ `useEmailChangeConfirm.ts:9-11` — invalidace v `onSuccess` (hook), ne na call-site | CB | L3 |
| C-31 | ✅ `useFriendshipsSocket.ts:81-84` — `user:identity:changed` → invaliduje `['users','me']` + reconnect re-fetch | WS | L3 |
| C-32 | ⚖️ dual-source by-design; C-28 fix omezil drift `user.themeId` v cache | P7 | L2 |

### 2FA oblast (nová, nebyla v původním sweep 2026-06-05)

| Mutace | Cache efekt | Správně? |
|---|---|---|
| `useTotpSetup` | žádný (jen vrátí QR/secret — žádná user delta) | ✅ by-design |
| `useEnableTotp` | `invalidate(['users','me'])` → `totpEnabled` se obnoví v RQ | ✅ |
| `useDisableTotp` | `invalidate(['users','me'])` + `invalidate(['trusted-devices'])` | ✅ |
| `useRegenerateBackupCodes` | žádný (záložní kódy se vrátí v response, FE je zobrazí ze state — žádná query je nečte) | ✅ by-design |
| `useRevokeTrustedDevice` | `invalidate(['trusted-devices'])` | ✅ |

`TotpCard` a `TrustedDevicesCard` čtou `totpEnabled` z `useMyProfile()` (RQ `['users','me']`), **ne** z `currentUserAtom` → pro 2FA sekci platí jednoduché RQ invalidace, žádný P7 dual-store drift. ✅

### Admin mutace (username approve/reject/bulk) — potvrzeno

Všechny admin akce v `useAdminUsers.ts` obsahují kompletní fan-out:
- `adminKeys.users` + `adminKeys.stats` + `adminKeys.auditLog` (C-51/C-52)
- `['public-users']` + `['public-user-profile']` (C-12)
- `['pending-actions']` u approve/reject username (C-45)

✅ Žádný nový nález.

## PROOF-REQUEST

| # | Nález | Co ověřit | Metoda |
|---|---|---|---|
| PR-01 | C-RUN-01 | Po potvrzení smazání účtu (dryRun=false) — navigovat pryč a zpět na login — vidí nový uživatel čistou RQ cache, nebo stale data z předchozí session? | M4 runtime (vyžaduje živou appku + 2 účty) |
| PR-02 | C-31 | BE emituje `user:identity:changed` do `user:{id}` roomu po admin approve username? Klient (přihlášený jako žadatel) obdrží event a obnoví `['users','me']`? | M4 runtime (admin + žadatel oba online) |
