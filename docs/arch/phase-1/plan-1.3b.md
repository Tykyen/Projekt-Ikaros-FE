# Plán 1.3b — Username change + Admin role infrastruktura

**Datum:** 2026-05-12
**Status:** ✅ Implementováno
**Spec:** [`spec-1.3b.md`](./spec-1.3b.md)
**Odhad rozsahu:** ~9 fází, BE 14 souborů + FE 22 souborů, ~3–4 dny soustředěné práce

---

## Cíl plánu

Rozsekat implementaci do **postupných, ověřitelných fází**. Každá fáze končí zelenými testy + lokálním smoke testem. Komitujeme po fázi (granular commits, jasná hlavička).

---

## Fáze 1 — Type cleanup (D-032 enum mismatch)

**Cíl:** sjednotit `UserRole` enum FE ↔ BE. Bez toho admin role-change UI nelze postavit konzistentně.

### Soubory

| Soubor | Akce |
|---|---|
| `backend/src/modules/users/interfaces/user.interface.ts` | Přejmenovat `SpravceClankuu` → `SpravceClanku`, `SpravceDisukzi` → `SpravceDiskuzi` |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/shared/types/index.ts` | Smazat `SpravceBohu = 10` (dead code); změnit `SpravceClanku = 13` → `SpravceClanku = 10`; `SpravceGalerie` zůstává `= 11`; `SpravceDiskuzi` zůstává `= 12`. **Výsledné FE enum musí bitově odpovídat BE.** |
| Všechny BE/FE callsites | Grep `SpravceClankuu`, `SpravceDisukzi`, `SpravceBohu` → najít a aktualizovat |
| `backend/src/modules/users/schemas/user.schema.ts` | Ověřit, že enum decorator (pokud existuje) odpovídá novým názvům |

### Verifikace dat

Před commitem fáze 1:

```bash
# V MongoDB shellu
db.users.find({ role: { $in: [10, 11, 12, 13] } }, { username: 1, role: 1 })
```

Pokud existují uživatelé s `role = 13` (FE-only `SpravceClanku` z FE) → spike: jak to vůbec vzniklo? Pravděpodobně nikdy nepoužito v admin endpointu. Doplnit migraci `role 13 → 10` (přejmenování bez sémantického posunu).

### Testy

- `pnpm tsc --noEmit` BE i FE — žádné errors
- `pnpm test` BE i FE — všechny stávající testy zelené
- Manuální: otevři `/ikaros/profil` přihlášený, otevři `/ikaros/uzivatele` jako admin → render bez crashe

### Commit

`fix(types): sjednotit UserRole enum FE↔BE (D-032)`

---

## Fáze 2 — BE schemas + interfaces

**Cíl:** datový model pro UsernameChangeRequest + rozšířené pole User.

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `backend/src/modules/users/schemas/username-change-request.schema.ts` | Mongoose schema `UsernameChangeRequestSchemaClass` (viz spec §4.1.2). Partial unique index na `{ userId: 1 }` filter `{ status: 'pending' }`. Index `requestedUsernameLower`. |
| `backend/src/modules/users/interfaces/username-change-request.interface.ts` | `UsernameChangeRequest` interface + `IUsernameChangeRequestsRepository` (spec §4.1.2). |
| `backend/src/modules/users/repositories/username-change-requests.repository.ts` | `MongoUsernameChangeRequestsRepository` — implementuje interface. Aggregate `$lookup` pro `user`/`decidedBy` join. |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/users/schemas/user.schema.ts` | `@Prop` deklarace: `bannedAt`, `bannedBy`, `banReason`, `canManageAdmins`. |
| `backend/src/modules/users/interfaces/user.interface.ts` | Pole na `User` interface (4× nullable + `canManageAdmins: boolean`). |
| `backend/src/modules/users/users.repository.ts` | `toEntity()` namapuje nová pole. |
| `backend/src/modules/users/users.module.ts` | Registrovat nový schema (`MongooseModule.forFeature([{ name: UsernameChangeRequestSchemaClass.name, schema: UsernameChangeRequestSchema }])`) + bind `IUsernameChangeRequestsRepository` na `MongoUsernameChangeRequestsRepository`. |

### Testy

- `username-change-request.schema.spec.ts` — partial unique index funguje (test: create 2× pending pro stejný userId → druhý hodí duplicate key error)
- `users.repository.spec.ts` — `toEntity` mapuje nová pole správně

### Commit

`feat(users): schemas + repos pro UsernameChangeRequest + ban/admin-permissions pole (1.3b)`

---

## Fáze 3 — BE user-facing endpointy (žádost o username)

**Cíl:** `/api/users/me/username-request` (POST/GET/DELETE).

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `backend/src/modules/users/dto/request-username-change.dto.ts` | `@Matches(/^[a-z0-9-]{3,32}$/)` pole `requestedUsername` |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/users/users.service.ts` | Metody: `requestUsernameChange(userId, dto)`, `getMyUsernameRequest(userId)`, `cancelMyUsernameRequest(userId)` (spec §4.2). Inject `IUsernameChangeRequestsRepository`. |
| `backend/src/modules/users/users.controller.ts` | 3 nové endpointy (POST/GET/DELETE `/me/username-request`) — `@UseGuards(JwtAuthGuard)`. |
| `backend/src/modules/users/users.service.ts` `findById()` | Rozšířit response o `bannedAt, canManageAdmins, usernameChangeRequest` (z nového repo) → projeví se v `GET /users/me` shape. |

### Testy

- `users.service.spec.ts` — 5 nových test cases (`requestUsernameChange` × 4 variants + `cancelMyUsernameRequest` happy/404)
- `users.controller.e2e-spec.ts` — full user flow (POST → GET → DELETE)
- E2E: 401 anon, 400 invalid format, 403 cooldown (mockuju `usernameChangedAt`), 409 taken, 409 already pending

### Commit

`feat(users): /me/username-request endpoints (1.3b)`

---

## Fáze 4 — BE admin endpointy + hierarchy

**Cíl:** `/api/admin/username-requests/*`, `/api/admin/users/:id/ban|unban|admin-permissions`. Plus audit existujících (`PATCH /admin/users/:id/role`, `POST /admin/users`).

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `backend/src/modules/admin/dto/ban-user.dto.ts` | `reason?: string` (max 500) |
| `backend/src/modules/admin/dto/reject-request.dto.ts` | `reason?: string` (max 500) |
| `backend/src/modules/admin/dto/set-admin-permissions.dto.ts` | `canManageAdmins: boolean` |
| `backend/src/modules/admin/helpers/hierarchy.ts` | `assertCanChangeRole(actor, target, newRole)`, `assertCanModerate(actor, target, action)` (spec §2.5 — `assertCanChangeRole` + spec §4.5) |

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/admin/admin.service.ts` | Nové metody: `listUsernameRequests`, `approveUsernameRequest` (atomicita přes mongoose session), `rejectUsernameRequest`, `banUser` (+ revoke refresh tokens), `unbanUser`, `setAdminPermissions`. Inject `IUsernameChangeRequestsRepository` + `RefreshTokenService`. |
| `backend/src/modules/admin/admin.controller.ts` | 6 nových endpointů (spec §4.3). `@UseGuards(JwtAuthGuard, AdminGuard)`. |
| `backend/src/modules/admin/admin.service.ts` `updateUserRole` | Doplnit `assertCanChangeRole(actor, target, dto.role)` call |
| `backend/src/modules/admin/admin.service.ts` `createUser` | Doplnit `assertCanChangeRole(actor, virtualTarget, dto.role)` (virtualTarget s role > 2) |
| `backend/src/modules/users/users.service.ts` `findAllPaginated` (přes admin) | Rozšířit response o `bannedAt`, `banReason`, `pendingUsernameRequest` (aggregate `$lookup`) + query param `hasPendingRequest` |

### Testy

- `admin.service.spec.ts` — pro každou novou metodu happy + edge cases (spec §7.1)
- `admin.controller.e2e-spec.ts` — full flow approve/reject + ban/unban + admin-permissions
- Hierarchy unit tests: `hierarchy.spec.ts` — `assertCanChangeRole` × 12 variant z matrix v §4.5

### Commit

`feat(admin): username-requests + ban/unban + canManageAdmins endpoints (1.3b)`

---

## Fáze 5 — Ban gate v auth

**Cíl:** zabanovaný user nedostane se do platformy.

### Soubory (úprava)

| Soubor | Akce |
|---|---|
| `backend/src/modules/auth/strategies/jwt.strategy.ts` (audit cesta) | `validate(payload)`: DB lookup user → pokud `bannedAt != null` → `UnauthorizedException({ code: 'BANNED', bannedAt, banReason })`. Pokud user neexistuje → 401 USER_NOT_FOUND. |
| `backend/src/modules/auth/auth.service.ts` `login` | Pokud `user.bannedAt != null` → `ForbiddenException({ code: 'BANNED', banReason, bannedAt })`. |

### Audit před implementací

Otevřít `backend/src/modules/auth/strategies/jwt.strategy.ts` a ověřit, jestli už dělá DB lookup. Pokud ano → jen rozšíříme check. Pokud ne → přidáme + označíme D-026 (cache) jako follow-up.

### Testy

- `jwt.strategy.spec.ts` — banned user → 401 BANNED; user-not-found → 401
- `auth.service.spec.ts` — login banned → 403 BANNED
- E2E: ban userA → userA má v jiné kartě stále JWT → další request → 401 BANNED

### Commit

`feat(auth): ban gate v JwtStrategy + login (1.3b)`

---

## Fáze 6 — FE shared types + hooks + interceptor

**Cíl:** typing, react-query hooks, axios interceptor pro BANNED.

### Soubory (úprava/nové)

| Soubor | Akce |
|---|---|
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/shared/types/index.ts` | Rozšířit `User` o `bannedAt?, bannedBy?, banReason?, canManageAdmins, usernameChangeRequest?` (a stejně `MeResponse`) |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/shared/store/authStore.ts` | `currentUserAtom` typ rozšíření (refit z `User` interface) |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/shared/types/userRoleLabels.ts` (nový) | `ROLE_LABELS: Record<UserRole, string>` — české labely (spec §2.5) |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/shared/api/client.ts` (audit) | Axios interceptor — 401 BANNED → logout + toast |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/profile/api/useProfile.ts` (audit) | Rozšířit query key pro `useMyProfile` o nová pole (jen typing, BE už vrátí) |
| `src/features/admin/users/api/useAdminUsers.ts` (nový) | Všechny hooky: `useMyUsernameRequest`, `useRequestUsernameChange`, `useCancelMyUsernameRequest`, `useAdminUsers`, `useAdminUpdateRole`, `useAdminBanUser`, `useAdminUnbanUser`, `useAdminSetAdminPermissions`, `useAdminUsernameRequests`, `useAdminApproveUsernameRequest`, `useAdminRejectUsernameRequest` |

### Testy

- `useAdminUsers.spec.ts` — cache keys, invalidace po mutation, error handling
- `client.spec.ts` (pokud existuje) — interceptor BANNED → trigger logout

### Commit

`feat(fe-types): UserRole labels + admin hooks + ban interceptor (1.3b)`

---

## Fáze 7 — FE Profile SecuritySection rozšíření

**Cíl:** odblokovat username field v profilu; pending banner, cooldown UI, request form.

### Soubory (úprava/nové)

| Soubor | Akce |
|---|---|
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/profile/lib/profileSchemas.ts` | Přidat `usernameRequestSchema` (zod) — `requestedUsername: z.string().regex(/^[a-z0-9-]{3,32}$/)` |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/profile/components/SecuritySection.tsx` | Rozšířit (spec §5.3): tři stavy (idle/cooldown/pending) + form. Reuse `useUsernameAvailable` z 1.2. |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/profile/components/ProfileSections.module.css` | Doplnit `.pendingBanner` (warning soft bg, ikona Clock z lucide) + `.cooldownHint` styly |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/profile/components/SecuritySection.spec.tsx` (nový) | RTL: 4 scenarios — idle, cooldown, pending, submit-success |

### Storybook

- `SecuritySection.stories.tsx` — variants: `IdleNoCooldown`, `IdleWithCooldown`, `PendingRequest`, `SubmittingForm`

### Smoke test

Lokální: `/ikaros/profil` → SecuritySection → "Požádat o změnu" → odeslat → banner se objeví; cancel → zmizí.

### Commit

`feat(profile): username change request UI (1.3b)`

---

## Fáze 8 — FE AdminUsersPage (taby + UsersTable + RequestsTable)

**Cíl:** plnohodnotná admin stránka `/ikaros/uzivatele`.

### Soubory (nové)

| Soubor | Obsah |
|---|---|
| `src/features/admin/users/pages/AdminUsersPage.tsx` | Layout + taby `?tab=users\|requests`. Defaults `users`. |
| `src/features/admin/users/pages/AdminUsersPage.module.css` | `.card` pattern (sjednocený s 1.3a), tab pill styling |
| `src/features/admin/users/components/AdminUsersTabs.tsx` | Tab nav (Uživatelé počet, Žádosti pending badge) + URL `?tab=` sync |
| `src/features/admin/users/components/UsersTab/UsersTable.tsx` | Tabulka uživatelů (sloupce per §5.4) + mobile cards pattern |
| `src/features/admin/users/components/UsersTab/UsersTable.module.css` | Desktop `<table>` + `@media (max-width: 768px)` přepne na cards |
| `src/features/admin/users/components/UsersTab/UsersFilters.tsx` | Search (debounce 300ms), Role select, hasPendingRequest checkbox |
| `src/features/admin/users/components/UsersTab/UserRowActions.tsx` | Popover (Lucide `MoreHorizontal`): Změnit roli (dropdown s ROLE_LABELS), Banovat/Odbanovat, Správa adminů toggle (jen Superadmin + role===Admin) |
| `src/features/admin/users/components/UsersTab/BanModal.tsx` | Wrap nad `Modal`. Reason textarea (volitelný). Warning hint o revokaci tokenů. |
| `src/features/admin/users/components/RequestsTab/RequestsTable.tsx` | Tabulka requestů + per-status sub-taby + akce per row |
| `src/features/admin/users/components/RequestsTab/RequestsTable.module.css` | Stejné mobile pattern jako UsersTable |
| `src/features/admin/users/components/RequestsTab/RequestsStatusTabs.tsx` | Sub-filter pending/approved/rejected |
| `src/features/admin/users/components/RequestsTab/RejectRequestModal.tsx` | Wrap nad `Modal`. Reason textarea (optional). |

### Soubory (úprava/smazání)

| Soubor | Akce |
|---|---|
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/app/router.tsx` line 18 | `UsersPage` import → `@/features/admin/users/pages/AdminUsersPage` |
| `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/ikaros/pages/UsersPage.tsx` | **Smazat** (stub nahrazený plnohodnotnou stránkou) |

### Klíčové implementační detaily

**Dropdown role-change:**
- Zobrazí všechny role z `ROLE_LABELS` kromě `Zakaz`
- Bez UI filtrace per actor — BE odmítne s 403 + toast (spec rozhodnutí 2026-05-12)
- Po PATCH 200: TanStack invalidate `['admin', 'users']` + toast „Role aktualizována"
- Po 403 CANNOT_MANAGE_ADMINS: toast `error.response.data.message`

**Ban/unban flow:**
- Ban: BanModal otevře → reason input → submit → POST `/admin/users/:id/ban` → close + toast + invalidate
- Unban: confirm `window.confirm('Opravdu odbanovat?')` → POST → invalidate
- Optimistic update: NE (jistota > rychlost)

**Toggle „Správa adminů":**
- Viditelný **jen** pokud `currentUser.role === Superadmin && row.role === Admin`
- Toggle = checkbox v UserRowActions popover; on/off → POST `/admin/users/:id/admin-permissions`

**Mobile pattern (CSS-only):**

```css
@media (max-width: 768px) {
  table.usersTable, thead, tbody, tr, th, td {
    display: block;
  }
  thead { display: none; }
  tr {
    background: var(--surface-1);
    border: 1px solid var(--frame-border);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
  }
  td {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 8px;
    padding: 4px 0;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-strong);
  }
}
```

(Každý `<td>` v JSX bude mít `data-label="ROLE"` atd.)

### Testy

- `AdminUsersPage.spec.tsx` — taby switching, badge počet pending, query params
- `UsersTable.spec.tsx` — render, search debounce, role change submit, ban toggle (s mocked API + msw)
- `RequestsTable.spec.tsx` — sub-tabs, approve, reject s reason, race handling (USERNAME_TAKEN_RECHECK)
- `BanModal.spec.tsx`, `RejectRequestModal.spec.tsx` — confirm flow, reason optional

### Storybook

- `AdminUsersPage` — všechny stavy (Default, WithBanned, WithPendingRequests, Empty, MobileView)
- `BanModal` — open/closed/submitting
- `RequestsTable` — Pending/Approved/Rejected

### Commit

`feat(admin): /ikaros/uzivatele full implementation (1.3b)`

---

## Fáze 9 — Mobile, lint, build, roadmap update

**Cíl:** zavřít 1.3b — verify + dokumentace.

### Kroky

1. **`mobil-desktop` skill** — projdi všechny nové UI obrazovky (AdminUsersPage desktop & mobile, SecuritySection s pending, BanModal, RejectRequestModal)
2. **CI checks:**
   - `pnpm lint` BE i FE
   - `pnpm lint:colors` FE (no hardcoded hex)
   - `pnpm tsc --noEmit` BE i FE
   - `pnpm test:run` BE i FE (všechny zelené)
   - `pnpm build` BE i FE
3. **Roadmap update** — checknout položky 1.3b v `docs/roadmap-fe.md` lines 199–210
4. **Dluhy update** — `docs/dluhy.md`:
   - D-019 (legacy User pole cleanup) — částečně dořešeno (enum)
   - D-026 (cache pro JwtStrategy ban check) — přidat
   - D-024 (email notifikace approve/reject) — přidat (čeká na 1.7)
   - D-021 (timed ban), D-022 (audit log), D-023 (bulk akce), D-025 (cooldown jako konstanta), D-027, D-028, D-030, D-031 — přidat
   - D-032 (enum mismatch) → ✅ uzavřeno v 1.3b
5. **Manuální smoke test** — checklist v dokumentu:
   - [ ] Tyky (Superadmin) → otevři `/ikaros/uzivatele` → vidí všechny taby
   - [ ] Tyky → změň roli userovi → 200 toast
   - [ ] Tyky → banuj usera → user dostane 401 v jiné kartě
   - [ ] Tyky → toggle „Správa adminů" pro Admina → flag se přepne
   - [ ] User (Hrac) → otevři profil → požádej o username change → banner viditelný
   - [ ] Tyky → otevři tab Žádosti → schval → user vidí update v profilu po refresh
   - [ ] Tyky → odmítni žádost s důvodem → user vidí decisionReason po refresh
   - [ ] Hrac → otevři `/ikaros/uzivatele` → ForbiddenPage
   - [ ] Mobile (DevTools 375×667) — všechny obrazovky funkční, tabulka → cards

### Commit

`docs(1.3b): roadmap + dluhy update + smoke test passed`

---

## Souhrn fází

| Fáze | Co | Soubory | Délka |
|---|---|---|---|
| 1 | Type cleanup (D-032) | ~10 callsites | 2 h |
| 2 | BE schemas + repos | 6 souborů | 3 h |
| 3 | BE user endpointy | 3 soubory | 4 h |
| 4 | BE admin endpointy + hierarchy | 5 souborů | 6 h |
| 5 | BE ban gate v auth | 2 soubory | 2 h |
| 6 | FE types + hooks + interceptor | 5 souborů | 3 h |
| 7 | FE SecuritySection | 4 soubory | 4 h |
| 8 | FE AdminUsersPage | 12 souborů | 10 h |
| 9 | Mobile, lint, build, roadmap | — | 2 h |

**Celkem ≈ 36 hodin soustředěné práce ≈ 4 pracovní dny.**

---

## Po schválení tohoto plánu

Spustím implementaci od **Fáze 1** (type cleanup). Po každé fázi:
- Commit
- Krátký progress update v chatu (1–2 věty + co dál)
- Pokud narazím na nečekaný blocker → zastavím + flag.

Po dokončení všech fází:
- Souhrnný report (co se změnilo, kde jsou rizika, co k otestování)
- Pokud chceš PR, použít `ultrareview` workflow (uživatel-triggered).
