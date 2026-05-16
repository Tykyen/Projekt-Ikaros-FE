# Plán 1.3c — Smazání účtu + tombstone + cleanup

**Datum:** 2026-05-12
**Status:** ✅ Implementováno
**Spec:** [`spec-1.3c.md`](./spec-1.3c.md)
**Odhad rozsahu:** ~9 fází, BE ~12 souborů + FE ~14 souborů, ~2–3 dny soustředěné práce

---

## Cíl plánu

Rozsekat implementaci do **postupných, ověřitelných fází**. Každá fáze končí zelenými testy + lokálním smoke testem. Komitujeme po fázi (granular commits).

**Klíč:** Fáze 1–6 jsou BE (lze testovat e2e bez FE), Fáze 7–9 jsou FE (na hotovou BE), Fáze 10 docs + cleanup.

---

## Fáze 0 — Pre-implementation audit

**Cíl:** Ověřit otevřené body ze spec §11 a aktualizovat plán pokud najdeme překvapení.

### Akce

1. **`@nestjs/schedule` audit:**
   ```bash
   grep -r "ScheduleModule" backend/src
   cat backend/package.json | jq '.dependencies["@nestjs/schedule"]'
   ```
   - Pokud chybí → `pnpm add @nestjs/schedule` v BE + `ScheduleModule.forRoot()` v `AppModule`
   - Pokud existuje → potvrdit registraci v root modulu

2. **`UserBanCacheService` shape audit:**
   - Přečíst `backend/src/modules/users/services/user-ban-cache.service.ts` (z 1.3b)
   - Ověřit, zda cache entry obsahuje celý User snapshot nebo jen ban-fields
   - **Pokud jen ban-fields** → rozšířit cache entry o `isDeleted`, `deletionRequestedAt`, `deletionRequestedBy`, `deletionReason` (Fáze 4 oprava)
   - **Pokud celý User snapshot** → automaticky bez úprav

3. **`WorldsService` existence audit:**
   ```bash
   ls backend/src/modules/worlds
   grep -l "class WorldsService" backend/src/modules/worlds
   ```
   - Pokud existuje → přidat `findWorldsWhereUserIsSolePJ` metodu tam
   - Pokud ne (pravděpodobné, fáze 2 ještě nezačala) → implementovat přímý dotaz v `UsersService` přes `world_members` kolekci + tracked dluh D-pozdější na refactor

4. **`WorldMember` role konstanta:**
   ```bash
   grep -r "WorldRole.PJ\|role.*PJ" backend/src/modules/worlds backend/src/modules/world-members 2>/dev/null
   ```
   - Pokud kolekce / model existuje (`world_members`) → použít pro check
   - Pokud ne → `findWorldsWhereUserIsSolePJ` vrací vždy `[]` (žádné světy zatím) + tracked dluh **D-pozdější** na real check po 2.x

5. **`GET /admin/users` aggregate audit:**
   - Přečíst `backend/src/modules/admin/services/admin-users.service.ts` (nebo equiv.)
   - Zjistit, kde je `$match` pipeline → kam přidat `isDeleted` filter

### Output Fáze 0

Krátký „audit report" inline v commitu Fáze 1 (commit message bude obsahovat findings).

### Commit

Žádný — Fáze 0 nemění kód, jen informuje další fáze.

---

## Fáze 1 — BE schema + interfaces

**Cíl:** Datový model rozšíření `User` o soft-delete pole.

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/users/schemas/user.schema.ts` | `@Prop` deklarace: `deletionRequestedAt`, `deletionRequestedBy`, `deletionReason`, `deletedAt`, `isDeleted` (viz spec §4.1.1). Index `isDeleted: 1`. |
| `backend/src/modules/users/interfaces/user.interface.ts` | Pole na `User` interface (4× nullable + `isDeleted: boolean`). |
| `backend/src/modules/users/repositories/users.repository.ts` (Mongo impl.) | `toEntity()` namapuje nová pole. |

### Testy

- `user.schema.spec.ts` — nová pole defaultují správně (null/false), `isDeleted` index existuje
- `users.repository.spec.ts` — `toEntity` mapuje pole

### Verifikace

- `pnpm tsc --noEmit` v BE — bez chyb
- Existující testy `users.repository.spec.ts` — zelené (regression)

### Commit

`feat(users): schema fields pro 1.3c soft delete + tombstone`

---

## Fáze 2 — BE user-facing endpointy (self-delete)

**Cíl:** `/api/users/me/deletion-request` POST/GET/DELETE + integrace do MeResponse.

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `backend/src/modules/users/dto/request-account-deletion.dto.ts` | `confirmUsername: string` (length 3-32) |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/users/users.service.ts` | Metody: `requestSelfDeletion(userId, dto)`, `getMyDeletionRequest(userId)`, `cancelMyDeletionRequest(userId)` (spec §4.2). PJ blokace přes `WorldsService.findWorldsWhereUserIsSolePJ` (Fáze 6 implementuje; Fáze 2 použije stub `() => []` + TODO marker, který Fáze 6 nahradí). |
| `backend/src/modules/users/users.controller.ts` | 3 nové endpointy POST/GET/DELETE `/me/deletion-request` — `@UseGuards(JwtAuthGuard)`. |
| `backend/src/modules/users/users.service.ts` `findById/getMe()` | Rozšířit MeResponse o `deletionRequestedAt`, `scheduledHardDeleteAt` (computed: `deletionRequestedAt + 30d`). |
| `backend/src/modules/users/interfaces/me-response.interface.ts` | Doplnit nová pole. |

### Testy

**Unit:**
- `users.service.spec.ts` — `requestSelfDeletion` happy + username mismatch + already pending + (stub) sole PJ skip
- `users.service.spec.ts` — `getMyDeletionRequest`, `cancelMyDeletionRequest`
- `users.controller.spec.ts` — endpointy chráněné `JwtAuthGuard`

**E2E:**
- `users.deletion-self.e2e-spec.ts` — POST happy, GET pending, DELETE pending; bad username 400; double request 409

### Verifikace

- POST `/users/me/deletion-request` jako přihlášený uživatel → 200 + refresh token revokován (manuální curl + ověřit, že další request s refresh tokenem hodí 401)

### Commit

`feat(users): self-delete endpoints + MeResponse rozšíření (1.3c)`

---

## Fáze 3 — BE auth (login union + reactivate)

**Cíl:** Rozšířit `AuthService.login` o `deletion_pending` response + nový `POST /auth/reactivate-deletion`.

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `backend/src/modules/auth/dto/reactivate-deletion.dto.ts` | `identifier: string`, `password: string` (MinLength 6) |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/auth/interfaces/login-response.interface.ts` (nový nebo existující) | Union type `LoginResponse = LoginOkResponse | DeletionPendingResponse`. **Doplnit `status: 'ok' \| 'deletion_pending'` field na response.** |
| `backend/src/modules/auth/auth.service.ts` | `login()` rozšíření (spec §4.3.1): pokud `isDeleted` → 401 DELETED; pokud `deletionRequestedAt != null` → return `{ status: 'deletion_pending', ... }`; jinak `{ status: 'ok', ... }`. Nová metoda `reactivateDeletion(dto)`. |
| `backend/src/modules/auth/auth.controller.ts` | Nový endpoint `POST /auth/reactivate-deletion`. |

### Backward compat

- Existující FE 1.1/1.2/1.3a code volá `useLogin` a expectuje `{ accessToken, refreshToken, user }`. Nový shape je `{ status: 'ok', accessToken, refreshToken, user }`. **FE už ne-přizpůsobená k union typu** → FE typeguard `if (response.status !== 'ok') ...` musí být přidaný v Fáze 8 PŘED merge BE změny.
- **Strategie:** BE + FE změny v jedné PR/commit (oba se mergují společně) ALE BE je first-deployable (pokud FE pošle credentials a uživatel je deletion_pending, BE response má status field, který starý FE ignoruje → ale starý FE pak nedostane `accessToken` a spadne). → **Acceptable přechodný stav:** během dev hot-reload se aktualizuje současně.

### Testy

**Unit:**
- `auth.service.spec.ts` — login isDeleted 401, login deletion_pending response shape, login ok response zachová `status: 'ok'`
- `auth.service.spec.ts` — reactivateDeletion happy, bad creds 401, no pending 400, isDeleted 401

**E2E:**
- `auth.deletion-pending-login.e2e-spec.ts` — full flow: register → self-delete request → login → deletion_pending response → reactivate-deletion → ok response

### Verifikace

- Manuální curl flow: register testuser → login OK → POST `/users/me/deletion-request` → login → `deletion_pending` → POST `/auth/reactivate-deletion` → ok

### Commit

`feat(auth): deletion_pending login response + reactivate endpoint (1.3c)`

---

## Fáze 4 — BE JwtStrategy gate + UserBanCacheService rozšíření

**Cíl:** Sjednocený JWT gate: ban / deletion_pending / deleted. Cache rozšíření.

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/users/services/user-ban-cache.service.ts` | Per Fáze 0 audit: pokud cachuje jen `bannedAt`, rozšířit o `isDeleted`, `deletionRequestedAt`. Přejmenovat na `UserStatusCacheService`? **NE** — zachovat název pro stabilitu importu, jen rozšířit shape interní entry. Komentář v souboru o rozšíření. |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | `validate()` rozšíření (spec §4.6): `isDeleted` → 401 DELETED; `deletionRequestedAt != null` → 401 DELETION_PENDING; (zachovaná ban kontrola z 1.3b). |
| `backend/src/modules/users/users.service.ts` | Všechna místa, která mění `deletionRequestedAt` (Fáze 2, 5, 6) volají `userBanCache.invalidate(userId)` po commitu. |

### Testy

**Unit:**
- `jwt.strategy.spec.ts` — banned (regression), isDeleted, deletionRequestedAt
- `user-ban-cache.service.spec.ts` — entry obsahuje nová pole, invalidate funguje

**E2E:**
- `auth.deletion-gate.e2e-spec.ts` — soft-deleted user JWT → další request 401 DELETION_PENDING; hard-deleted user → 401 DELETED

### Verifikace

- Manuální: existující JWT v cookie → POST `/users/me/deletion-request` → další request `/users/me` → 401 DELETION_PENDING (auto-logout v FE Fáze 7)

### Commit

`feat(auth): JwtStrategy gate pro isDeleted + deletionRequestedAt (1.3c)`

---

## Fáze 5 — BE admin moderační endpointy

**Cíl:** `/api/admin/users/:id/deletion-request` POST/DELETE + rozšíření `GET /admin/users` response.

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `backend/src/modules/admin/dto/admin-delete-user.dto.ts` | `reason: string` (length 1-500) |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/admin/services/admin-users.service.ts` | `requestDeletion(actorId, targetId, dto)` (spec §4.4.1) — `assertCanModerate(actor, target, 'DELETE')` + PJ blokace + state checks + invalidate cache + revoke tokens. `cancelDeletion(actorId, targetId)` (spec §4.4.2). |
| `backend/src/modules/admin/admin-users.controller.ts` | 2 nové endpointy: POST/DELETE `/admin/users/:id/deletion-request`. |
| `backend/src/modules/admin/services/admin-users.service.ts` `listUsers()` | Rozšíření aggregate o nová pole `deletionRequestedAt`, `deletionReason`, `isDeleted` + query filter `?hasPendingDeletion=true`, `?includeDeleted=true` (default false). |
| `backend/src/modules/admin/admin-users.controller.ts` `listUsers()` | Query params validace. |

### Testy

**Unit:**
- `admin-users.service.spec.ts` — `requestDeletion` happy + self + Superadmin hierarchy + canManageAdmins + already-pending + already-deleted + (stub) sole PJ
- `admin-users.service.spec.ts` — `cancelDeletion` happy + hierarchy + not-found + already-deleted
- `admin-users.service.spec.ts` `listUsers` — `includeDeleted=true` zobrazuje tombstones; default false skrývá; `hasPendingDeletion` filter

**E2E:**
- `admin.deletion.e2e-spec.ts` — admin flow: list → POST deletion-request → list (chip viditelný) → DELETE cancel → list

### Verifikace

- Manuální curl jako admin: POST `/admin/users/<id>/deletion-request` body `{ reason: "test" }` → 200; GET `/admin/users` → target má `deletionRequestedAt`

### Commit

`feat(admin): deletion-request moderační endpoints + list rozšíření (1.3c)`

---

## Fáze 6 — BE PJ blokace + cron

**Cíl:** Sole-PJ check (nahradí stub z Fáze 2) + `AccountCleanupCron` (daily 03:00).

### Soubory (úprava nebo nové, dle Fáze 0 auditu)

| Soubor | Akce |
|---|---|
| `backend/src/modules/worlds/worlds.service.ts` (nebo `users.service.ts`) | `findWorldsWhereUserIsSolePJ(userId)` (spec §4.5). Pokud `WorldsService` neexistuje a `world_members` kolekce ano → impl v UsersService + tracked dluh. Pokud `world_members` neexistuje → vrací `[]` + tracked dluh **D-pozdější**. |
| `backend/src/modules/users/users.service.ts` | Nahradit stub `[]` z Fáze 2 reálným voláním `findWorldsWhereUserIsSolePJ`. |
| `backend/src/modules/admin/services/admin-users.service.ts` | Stejně — nahradit stub v `requestDeletion`. |

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `backend/src/modules/users/crons/account-cleanup.cron.ts` | `AccountCleanupCron` třída (spec §4.7). `@Cron('0 3 * * *', { timeZone: 'Europe/Prague' })`. Inject `IUsersRepository`, `MediaUploadService`, `RefreshTokenService`, `UserBanCacheService`. |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/app.module.ts` | `ScheduleModule.forRoot()` (pokud Fáze 0 audit zjistil, že chybí). |
| `backend/src/modules/users/users.module.ts` | Registrovat `AccountCleanupCron` jako provider. |

### Testy

**Unit:**
- `account-cleanup.cron.spec.ts` — Mock Date → eligible (31d) → hard-delete proběhne (anonymize email, smazat avatar, isDeleted=true); not-eligible (29d) → no-op; already-deleted → idempotent; no-request → no-op
- `account-cleanup.cron.spec.ts` — Mock MediaUploadService.delete → ověřit, že je volaný pro avatarUrl + characterAvatarUrl
- `worlds.service.spec.ts` (nebo `users.service.spec.ts`) — `findWorldsWhereUserIsSolePJ` happy / empty / multi-PJ

### Verifikace

- Manuální: vytvořit user, set `deletionRequestedAt = new Date(Date.now() - 31*86400_000)`, spustit cron metodu přes test → user má `isDeleted: true`, email `deleted-<id>@deleted.local`

### Commit

`feat(users): PJ blokace + account-cleanup cron (1.3c)`

---

## Fáze 7 — FE shared primitives

**Cíl:** Stavební prvky pro FE komponenty: `<UserAvatar deleted />`, axios interceptor, `currentUserAtom` typy.

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `src/shared/ui/UserAvatar/UserAvatar.tsx` | Nová prop `deleted?: boolean`. Wrap `<img>` do `<div className={styles.wrap}>`; pokud `deleted` → render overlay `<span className={styles.deletedBand}>` + apply `.deletedWrap` na wrap (grayscale + brightness 0.6 na img). `alt` override na "Smazaný účet". |
| `src/shared/ui/UserAvatar/UserAvatar.module.css` | Nové třídy `.wrap`, `.deletedWrap`, `.deletedBand` (spec §5.9 CSS). |
| `src/shared/types/index.ts` | `CurrentUser` rozšíření o `deletionRequestedAt?: string \| null`, `scheduledHardDeleteAt?: string \| null`. **Stávající `MeResponse` typ — pokud existuje samostatně, rozšířit.** |
| `src/shared/api/client.ts` | Interceptor 401 — code `DELETED` / `DELETION_PENDING` → `logout()` + toast (spec §5.11). Regression test pro `BANNED` (1.3b zachován). |

### Soubory (nové testy)

| Soubor | Obsah |
|---|---|
| `src/shared/ui/UserAvatar/UserAvatar.deleted.spec.tsx` | RTL: deleted=true rendruje overlay; alt="Smazaný účet"; deleted=false neviditelný |
| `src/shared/api/client.deleted.spec.ts` | Interceptor 401 DELETED → logout; 401 DELETION_PENDING → logout |

### Storybook (volitelně, ale doporučeno)

- `UserAvatar/Deleted` — varianty md/lg/xl, default types male/female/being

### Verifikace

- `pnpm test` FE — zelené
- Storybook → `UserAvatar/Deleted` → vizuálně overlay drží

### Commit

`feat(shared): UserAvatar deleted overlay + axios DELETED/DELETION_PENDING (1.3c)`

---

## Fáze 8 — FE profile (AccountSection + DeleteAccountModal)

**Cíl:** Sekce Účet v profilu plnohodnotná + modal pro self-delete + handle PJ blokace.

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `src/features/profile/components/DeleteAccountModal.tsx` | Modal (spec §5.4) — typing username confirm + checkbox + danger button. Submit přes `useRequestSelfDeletion`. PJ blokace → switch na PJBlockView (sub-component) se seznamem světů. |
| `src/features/profile/components/DeleteAccountModal.module.css` | Styly modalu — `.warningList`, `.confirmInput`, `.checkboxRow`, `.pjBlockView`, `.worldLink` |
| `src/features/profile/api/useDeleteAccount.ts` | `useRequestSelfDeletion()` — POST `/users/me/deletion-request`; onSuccess: toast + `useAuthStore.logout()` + navigate `/?accountDeletion=scheduled`. |
| `src/features/profile/lib/deleteAccountSchema.ts` | Zod schema: `confirmUsername` musí matchnout `user.usernameLower` (case-insensitive). |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `src/features/profile/components/AccountSection.tsx` | Z 1.3a stubu na plnohodnotnou sekci (spec §5.3): pokud `me.deletionRequestedAt` → banner se scheduledHardDeleteAt + návod; jinak read view s tlačítkem otevírajícím `<DeleteAccountModal>`. |
| `src/features/profile/components/ProfileSections.module.css` | Nová třída `.deletionBanner` (warning variant) |

### Testy

**Unit:**
- `deleteAccountSchema.spec.ts` — case-insensitive match, mismatch
- `useDeleteAccount.spec.ts` — TanStack hook cache, onSuccess logout

**Component (RTL):**
- `AccountSection.spec.tsx` — idle, pending banner, modal open
- `DeleteAccountModal.spec.tsx` — typing matching enables button, checkbox required, submit, error SOLE_PJ_BLOCK switchuje na PJBlockView

**Storybook:**
- `AccountSection/Idle`, `AccountSection/PendingDeletion`
- `DeleteAccountModal/Default`, `DeleteAccountModal/PJBlocked`

### Verifikace

- Manuální: přihlas se, otevři `/ikaros/profil`, klikni "Smazat účet" → modal → napiš username + check → submit → toast + logout + redirect

### Commit

`feat(profile): AccountSection + DeleteAccountModal (1.3c)`

---

## Fáze 9 — FE auth (LoginModal + ReactivateAccountModal) + admin moderační UI

**Cíl:** LoginModal handle deletion_pending response → ReactivateAccountModal. Admin tabulka má akce Smazat / Obnovit smazání + status chip.

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `src/features/auth/components/ReactivateAccountModal.tsx` | Modal (spec §5.6) — zobrazí scheduledHardDeleteAt, dvě tlačítka. "Obnovit a přihlásit" → POST `/auth/reactivate-deletion` přes `useReactivateDeletion`. |
| `src/features/auth/api/useReactivateDeletion.ts` | `useReactivateDeletion()` mutation — POST credentials, onSuccess: setAuth + toast + redirect domů. |
| `src/features/admin/users/components/UsersTab/AdminDeleteUserModal.tsx` | Modal (spec §5.7) — typing target username + povinný reason. Submit přes `useAdminDeleteUser`. |
| `src/features/admin/users/components/UsersTab/AdminDeleteUserModal.module.css` | Styly podobné DeleteAccountModal, povinný reason field |
| `src/features/admin/users/api/useAdminDeletion.ts` | `useAdminDeleteUser()`, `useAdminUndoDeleteUser()` — POST/DELETE `/admin/users/:id/deletion-request`. |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `src/features/auth/components/LoginModal.tsx` | `useLogin` onSuccess switch: pokud `response.status === 'deletion_pending'` → render `<ReactivateAccountModal>` (jako sub-modal nebo replace content). |
| `src/features/auth/api/useLogin.ts` | Typeguard na union response — `status` field; vrací `LoginOkResponse \| DeletionPendingResponse`. Update callsites. |
| `src/features/admin/users/components/UsersTab/UserRowActions.tsx` | Nové akce: "Smazat účet" (pokud `!deletionRequestedAt && !isDeleted`) → AdminDeleteUserModal; "Obnovit smazání" (pokud `deletionRequestedAt && !isDeleted`) → confirm modal → DELETE. Self-row: akce disabled. |
| `src/features/admin/users/components/UsersTab/UserStatusChips.tsx` (nebo equiv.) | Priorita chipů (spec §5.8): `isDeleted` → 🪦 DELETED; `bannedAt` → BANNED; `deletionRequestedAt` → ⏳ DELETION PENDING; pendingUsernameRequest → PENDING USERNAME. |
| `src/features/admin/users/api/useAdminUsers.ts` | Query queryFn: option include `?includeDeleted=true` (default false, hidden behind UI toggle „Zobrazit smazané" — volitelně). |

### Testy

**Unit:**
- `useReactivateDeletion.spec.ts` — happy
- `useAdminDeletion.spec.ts` — cache invalidate

**Component (RTL):**
- `ReactivateAccountModal.spec.tsx` — confirm flow, cancel flow
- `AdminDeleteUserModal.spec.tsx` — povinný reason, typing target username, submit, hierarchy error toast
- `LoginModal.spec.tsx` — deletion_pending switch na ReactivateAccountModal (mocked API)
- `UserRowActions.spec.tsx` — Smazat / Obnovit smazání renderování + disabled na self-row

**Storybook:**
- `ReactivateAccountModal/Default`
- `AdminDeleteUserModal/Default`

### Verifikace

- Manuální: jako admin smaž jiného usera → tabulka má chip → revertni → chip mizí
- Manuální: jako self-deleted user → login → ReactivateAccountModal → klikni Obnovit → přihlášen

### Commit

`feat(auth+admin): LoginModal reactivate + admin moderační delete (1.3c)`

---

## Fáze 10 — Mobile, validace, docs

**Cíl:** Finální polishing, dokumentace, dluhy.

### Akce

1. **Skill `mobil-desktop`** — projít všechny nové modaly + AccountSection na mobile, fix breakpointy
2. **Lint:**
   ```bash
   pnpm lint           # FE
   pnpm lint:colors    # FE — žádné hardcoded barvy
   ```
3. **Build:**
   ```bash
   pnpm build          # FE
   pnpm build          # BE
   ```
4. **Test suite:**
   ```bash
   pnpm test:run       # FE
   pnpm test           # BE (unit + e2e)
   ```
5. **Aktualizovat `docs/roadmap-fe.md`:**
   - Zaškrtnout všechny položky pod 1.3c
   - Status sekce → ✅ hotovo s datem
6. **Aktualizovat `docs/dluhy.md`:**
   - Přidat **D-034** až **D-043** (spec §10)
   - Uzavřít žádný (1.3c neuzavírá z 1.3b)
7. **Commit dokumentace:**
   ```bash
   docs(1.3c): roadmap check + dluhy D-034..D-043
   ```

### Verifikace

- `pnpm test:run` všechny zelené
- `pnpm build` zelený
- Manuální end-to-end:
  1. Register → confirm self-delete → logout
  2. Login → ReactivateAccountModal → Obnovit → přihlášen
  3. Z admin: smaž jiného usera → chip → revertni
  4. Mock time → cron tick → hard delete tombstone

### Commit

`docs(1.3c): roadmap check + dluhy + finalizace`

---

## Souhrn commitů (10 fází)

| # | Fáze | Commit |
|---|---|---|
| 1 | BE schema | `feat(users): schema fields pro 1.3c soft delete + tombstone` |
| 2 | BE self-delete | `feat(users): self-delete endpoints + MeResponse rozšíření (1.3c)` |
| 3 | BE auth | `feat(auth): deletion_pending login response + reactivate endpoint (1.3c)` |
| 4 | BE JwtStrategy | `feat(auth): JwtStrategy gate pro isDeleted + deletionRequestedAt (1.3c)` |
| 5 | BE admin | `feat(admin): deletion-request moderační endpoints + list rozšíření (1.3c)` |
| 6 | BE PJ + cron | `feat(users): PJ blokace + account-cleanup cron (1.3c)` |
| 7 | FE shared | `feat(shared): UserAvatar deleted overlay + axios DELETED/DELETION_PENDING (1.3c)` |
| 8 | FE profile | `feat(profile): AccountSection + DeleteAccountModal (1.3c)` |
| 9 | FE auth + admin | `feat(auth+admin): LoginModal reactivate + admin moderační delete (1.3c)` |
| 10 | Docs | `docs(1.3c): roadmap check + dluhy + finalizace` |

---

## Závěr

Po schválení tohoto plánu spouštím implementaci od Fáze 0 (audit). Mezi fázemi BE (1–6) a FE (7–9) BE smoke test přes curl/Postman (existující infra `requests/` pokud je). FE změny ověřím v devu (`pnpm dev` FE + `pnpm start:dev` BE).

Pokud nějaký audit ve Fázi 0 odhalí překvapení (chybějící `WorldsService`, jiný shape `UserBanCacheService`), zastavím a aktualizuji plán před pokračováním.
