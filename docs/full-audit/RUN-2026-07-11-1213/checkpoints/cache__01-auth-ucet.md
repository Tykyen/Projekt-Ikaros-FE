# Checkpoint — cache / 01-auth-ucet

> RUN-2026-07-11-1213 · styl cache (TanStack invalidace) · registr `docs/cache-audit.md` (prefix C-)
> READ-ONLY re-audit oblasti proti HEAD. Předchozí sweep 2026-06-05 (C-27…C-32), re-audit 2026-06-20 (C-RUN-01).
> Osy: FO · CB · P7 · WS · LC. Metody: M1 (čtení) + M2 (prefix-match) + M-CEN (mutation census).

## Dosažená vs cílová L

- **Cílová:** běžné mutace L2+; destruktivní/CB L3+; kritické (cross-user leak) přes runtime → L4.
- **Dosažená:** **L3** pro opravené nálezy (fixy přítomné v HEAD + existující vitest specy `useAuth.spec.tsx`,
  `useThemeSync.spec.tsx`, `useEmailChangeConfirm.spec.tsx` — nespuštěno v tomto běhu, L3 test-exists).
  **L1** (statika) pro nové nálezy → PROOF-REQUEST na runtime (M4).

## Verdikt regrese známých nálezů (♻️ — NEhlásit jako nové)

Fixy C-28/C-29/C-30/C-31 z 2026-06-05 jsou **přítomné v HEAD kódu** (potvrzeno čtením + kotevními komentáři):

| Nález | Stav v HEAD | Kde | Osa | L |
|---|---|---|---|---|
| **C-27** | ⚖️ by-design — invalidate-only cesty spoléhají na hydration bridge `useCurrentUserHydration` (`useAuth.ts:206-208`) | `useEmailVerify.ts:11`, `useAdminUsers.ts:39-40,54-55` | P7 | L2 |
| **C-28** | ✅ opraveno — outbound theme PATCH → `qc.setQueryData(['users','me'])` | `useThemeSync.ts:73-78` | FO | L3 |
| **C-29** | ✅ opraveno — `qc.clear()` v login/loginTotp/register/logout | `useAuth.ts:49,78,105,142` | CB | L3 |
| **C-30** | ✅ opraveno — invalidace v hook `onSuccess` (ne call-site `.then`) | `useEmailChangeConfirm.ts:9-11`; page jen `setState` `EmailChangeConfirmPage.tsx:46-49` | CB | L3 |
| **C-31** | ✅ přítomno — WS `user:identity:changed` → `['users','me']`+`['public-user-profile']` + reconnect refetch | `useFriendshipsSocket.ts:81-84,88-93` | WS | L3 |
| **C-32** | ⚖️ by-design — theme dual-source „local wins"; C-28 fix omezil drift `user.themeId` v cache | `useThemeSync.ts:21-23,43-53` | P7 | L2 |

**♻️ Carry-over z RUN-2026-06-20 (C-RUN-01) — STÁLE NEOPRAVENO:**
`useRequestSelfDeletion` (dryRun=false) čistí atomy + `invalidate(['users','me'])`, ale **NIKDY `qc.clear()`** —
[useDeleteAccount.ts:73-84](../../../../src/features/profile/api/useDeleteAccount.ts#L73). C-29 fix pokryl login/logout/register,
tuto 4. cestu ne. Známé (RUN-2026-06-20 checkpoint), NEhlásit jako nové. 🟡. PROOF-REQUEST PR-01 (carry).

## Nové nálezy (🆕)

### 🆕 C-RUN-01a · `CB`/`P7` · 🟡 — `useReactivateDeletion` nečistí RQ cache (`qc.clear()`) — 5. neošetřená cesta C-29
- **Osa:** CB (cache-clear placement) / bezpečnostní třída C-29 (cross-user leak).
- **Mutace:** `useReactivateDeletion` — [useDeleteAccount.ts:100-120](../../../../src/features/profile/api/useDeleteAccount.ts#L100).
  `onSuccess` dělá `store.set(accessToken/refreshToken/currentUser)` + `qc.invalidateQueries(['users','me'])` — **bez `qc.clear()`**.
- **Rozpor:** login vrátí `deletion_pending` → `useLogin.onSuccess` se **vrací dřív, než doběhne `qc.clear()`**
  ([useAuth.ts:45](../../../../src/features/auth/api/useAuth.ts#L45) `if (result.status !== 'ok') return;` je PŘED `qc.clear()` na `:49`)
  → ReactivateAccountModal → `useReactivateDeletion` nasadí novou identitu bez vyčištění cache. **Návrh C-29 (cache-audit `C-29`)
  přitom explicitně jmenuje „na úspěšný login/register/reactivate"** — reactivate byl v scope původního fixu, ale vypadl.
- **Trigger:** na sdíleném zařízení předchozí uživatel s **expirovanou session bez explicitního logoutu** (interceptor 401,
  `qc.clear()` nikdy neběžel) → jiný uživatel reaktivuje soft-delete účet do gcTime (5 min). **Viditelnost:** RQ-driven sekce
  (`['worlds','my']`, pošta, přátelé, `['users','me','characters']`) drží data předchozího uživatele do refetche. Cizí osobní data.
  **Workaround:** F5. **Závažnost:** 🟡 (stejná třída jako C-29 🟠, ale užší okno — vyžaduje expirovanou-neodhlášenou předchozí session + reaktivaci).
- **Návrh:** do `useReactivateDeletion.onSuccess` přidat `qc.clear()` PŘED nasazením atomů (parita s `useLogin`).

### 🆕 C-RUN-01b · `FO`/`P7` · 🟡 — theme initial-sync „local wins" catchup PATCH nepíše do user cache (reziduum C-28)
- **Osa:** FO (cache write chybí u mutace s user-data deltou). Kód **nepokrytý** C-28 fixem (ten opravil jen outbound-sync effect).
- **Mutace:** `useThemeSync` initial-sync větev — [useThemeSync.ts:43-48](../../../../src/themes/useThemeSync.ts#L43):
  `api.patch('/users/me', { themeId })` v „local wins" bez `setQueryData` / `invalidate` / atom set. Outbound-sync effect
  (`:73-78`) cache write DOSTAL (C-28), initial-sync ne.
- **Rozpor:** cross-device divergence (localStorage theme ≠ `user.themeId` z BE, `hadStoredThemeAtMount=true`) → PATCH dorovná BE
  na local hodnotu, ale `['users','me'].themeId` (a přes bridge i `currentUserAtom.themeId`) drží **starou** BE hodnotu.
  Vizuál OK (`themeAtom`), datové pole stale — přesně symptom C-28.
- **Konzument:** ProfileHeader „Globální motiv" `value={user.themeId}` — [ProfileHeader.tsx:185](../../../../src/features/profile/components/ProfileHeader.tsx#L185).
- **Trigger:** přepnutí motivu na zařízení A → fresh load na zařízení B s vlastním uloženým motivem → otevření profilu do staleTime 30s.
  **Viditelnost:** „Globální motiv" ukazuje starý motiv, ač UI běží na novém. Tiché. **Workaround:** F5 / staleTime 30s.
  **Závažnost:** 🟡 (kořen sdílený s C-28/C-32; jen zobrazené pole stale, vizuál nerozbitý).
- **Návrh:** do „local wins" větve doplnit `qc.setQueryData<User>(['users','me'], old => old ? {...old, themeId} : old)`
  (identicky jako outbound-sync C-28 fix) → sjednotit obě cesty.

## Latentní / VERIFY (neeskalováno)

- **Nové soubory po sweepu 2026-06-05 — čisté (M-CEN):**
  - `useNotificationPreferences.ts` (15.9) — `useUpdateNotificationPreferences` dělá plný dual-write (`setQueryData(['users','me'])` + atom set, `:19-20`). ✅
  - `useDataExport.ts` (20C) — read-only GDPR export, jen blob download, žádná user-data delta. ✅ by-design.
  - `useEmailChangeRequest.ts` — request fáze, delta až po confirm (→ C-30). ✅ by-design.
  - 2FA hooky (`useProfile.ts:116-175`) — `useEnableTotp`/`useDisableTotp` invalidují `['users','me']`(+`['trusted-devices']`); setup/backup-codes bez delty. `TotpCard` čte z `useMyProfile` (RQ), ne z atomu → bez P7 driftu. ✅
- **`['users','me','characters']`** ([useMyCharactersGlobal.ts:15](../../../../src/features/profile/api/useMyCharactersGlobal.ts#L15)) je **child** klíče `['users','me']`
  → `invalidate(['users','me'])` i `qc.clear()` ho pokrývají prefixem. `setQueryData(['users','me'])` (profil/avatar) ho záměrně
  nemíchá (jiná entita — cross-world membership agregát). ✅
- **Profil dual-write vzor** (`useUpdateProfile`/avatar/character-avatar, `useProfile.ts:24-111`) — konzistentně `setQueryData(['users','me'])` + `getDefaultStore().set(currentUserAtom)`. ✅ K-C6 nadále nepotvrzen pro hlavní edit cestu.

## PROOF-REQUESTy

| # | Nález | Co ověřit | Metoda |
|---|---|---|---|
| **PR-01** (carry) | C-RUN-01 (self-delete) | Po dryRun=false smazání účtu → login jiného účtu ve stejném tabu bez F5 → vidí čistou RQ cache, nebo stale data předchozí session? | M4 runtime (2 účty, živá appka) |
| **PR-02** | C-RUN-01a (reactivate) | Předchozí uživatel s expirovanou session (bez logoutu) → reaktivace soft-delete účtu na stejném zařízení → přežijí RQ data předchozího uživatele (worlds/mail/friends) do gcTime? | M4 runtime |
| **PR-03** | C-RUN-01b (theme) | Motiv změněn na zařízení A → fresh load na B s vlastním uloženým motivem → ProfileHeader „Globální motiv" ukazuje starý themeId, ač vizuál běží na novém? | M4 runtime (2 zařízení / clear localStorage) |
| **PR-04** | C-31 (parita) | BE emituje `user:identity:changed` do `user:{id}` po admin approve username / role / ban? Přihlášený cíl obdrží event → refetch `['users','me']`? | M4 runtime (admin + cíl online) |

## Pokrytí

- **Query hooky (konzumenti):** useCurrentUserHydration, useMyProfile, useInvalidateMyProfile, useMyCharactersGlobal, useMyUsernameRequest, useMyLastUnseenDecidedRequest, useTrustedDevices, useMyDeletionRequest — všechny přečteny.
- **Mutace (writers) přečteny do plné hloubky:** useLogin, useLoginTotp, useRegister, useLogout, useAuthBootstrap (`useAuth.ts`); useUpdateProfile, useChangePassword, useUploadAvatar/DeleteAvatar, useUpload/DeleteCharacterAvatar, useTotpSetup/EnableTotp/DisableTotp/RegenerateBackupCodes/RevokeTrustedDevice (`useProfile.ts`); useEmailVerify(+Resend) (`useEmailVerify.ts`); useEmailChangeConfirm; useEmailChangeRequest; useRequestSelfDeletion, useReactivateDeletion (`useDeleteAccount.ts`); useUpdateNotificationPreferences; useDataExport; useRequestUsernameChange, useCancelMyUsernameRequest, useMarkUsernameRequestSeen (`useAdminUsers.ts` user-facing); useThemeSync.
- **Store / most:** `authStore.ts` (currentUserAtom `atomWithStorage`), hydration bridge `useCurrentUserHydration`, WS listener `useFriendshipsSocket.ts` (`user:identity:changed`).
- **Stránky:** EmailVerifyPage, EmailChangeConfirmPage (call-site placement C-30).
- **M-CEN:** jediné mutace s user-data deltou a chybějícím/neúplným cache efektem = C-RUN-01 (carry), C-RUN-01a, C-RUN-01b. Zbytek buď úmyslně bez efektu (request/read-only) nebo plný dual-write.

## Shrnutí

- **🆕 2** nové nálezy (C-RUN-01a reactivate bez qc.clear · C-RUN-01b theme initial-sync bez cache write) — oba 🟡.
- **♻️ 6** známých fixů (C-27…C-32) potvrzeno v HEAD (4 opravené L3, 2 by-design L2) + **1 carry-over** (C-RUN-01 self-delete, stále neopraveno) — NEhlásit jako nové.
- **4 PROOF-REQUESTy** (3× runtime cross-user/theme leak, 1× WS identita parita).
- **🔴/⭐:** žádný 🔴; nejzávažnější = C-RUN-01a (cross-user cache leak, 🟡 užší okno) — bezpečnostní třída C-29.
- Dosažená hloubka **L3** (opravené) / **L1** (nové → PROOF).
