# Spec 1.3b — Username change + Admin role infrastruktura

**Datum:** 2026-05-12
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.3b
**Závisí na:** 1.3a (Profil self-edit) ✅
**Předchází:** 1.3c (Tombstone + cleanup), 1.4 (Adresář uživatelů)
**Souvisí s:** existující `AdminGuard`, `RolesGuard`, `@Roles()` decorator (BE)

---

## 1. Cíl

Doplnit do platformy tři propojené capability:

1. **Žádost o změnu username** — uživatel pošle žádost; admin/superadmin schválí nebo odmítne (per roadmap, brainstorm 2026-05-12). Cooldown 30 dní mezi **schválenými** změnami (reject neresetuje cooldown).
2. **Ban uživatele** — admin/superadmin uživatele zabanuje (zachová původní roli, označí `bannedAt`/`bannedBy`/`banReason`); zabanovaný uživatel se nedostane do platformy a jeho refresh tokeny jsou revokovány. Ban gate v `JwtStrategy.validate` (per-request DB lookup).
3. **Minimální FE administrace uživatelů** — stránka `/ikaros/uzivatele` (gated `Superadmin | Admin`, slot z `IkarosLayout` RightPanel — viz [project_admin_panel_decision](../../../../../../Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/project_admin_panel_decision.md)) se **dvěma taby**: *Uživatelé* (list + role change + ban) a *Žádosti o username* (approve/reject).

**Pozn.: "Role machinery aktivní"** z roadmapy je už hotové (existují `AdminGuard`, `RolesGuard`, `@Roles()` decorator, `@CurrentUser()`, číselný `UserRole` enum). 1.3b ji jen **využije** + dotáhne tam, kde dosud chybí guard (audit existujících admin endpointů — §3.6).

---

## 2. Klíčová rozhodnutí (brainstorm 2026-05-12)

| Téma | Volba |
|---|---|
| Ban mechanismus | Flagy na User (`bannedAt`, `bannedBy`, `banReason`) — zachová původní roli |
| Username change | Schvalovací flow (per roadmap) — admin approve/reject |
| Cooldown | 30 dní jen od posledního **approved**; reject ho neresetuje |
| Žádosti UI | **Tab** v `/ikaros/uzivatele` (Uživatelé \| Žádosti) — jedno admin místo |
| Banned gate | DB lookup v `JwtStrategy.validate` (cache = dluh D-026) |
| Hierarchy | Granular flag `canManageAdmins`: defaultně Admin smí jen non-Admin role; s flagem (uděluje Superadmin) smí Admin operace na Adminech. Superadmin operace jen Superadmin. |
| Admin role-change UI | Dropdown plnohodnotný (všechny role kromě `Zakaz`) — BE vrátí 403 pokud actor nemá oprávnění (fail-safe, transparentní chyba) |
| Self-action | Nikdo (ani Superadmin) nesmí banovat sebe ani měnit svou roli |
| Notifikace approve/reject | Jen banner v profilu (po pollu `/users/me`); email = D-024 (1.7) |
| `UserRole.Zakaz` | Ignorovat — nech v enum, nezobrazuj v dropdown; existující záznamy nemigrovat |
| Cesta admin stránek | `/ikaros/uzivatele` (per memory `project_admin_panel_decision`, ne roadmap `/admin/uzivatele`) |
| Self-row v tabulce | Zobrazit s disabled akcemi (transparentnější) |
| Ban trvání | Trvalý dokud admin nezruší (timed = D-021 dluh) |

---

## 2.5 Adminské pozice a pravomoci

Platforma má **5 typů adminských pozic** (z roadmap-fe.md tabulky oprávnění):

| Pravomoc | Superadmin (1) | Admin (2) | Spr. diskuzí (12) | Spr. článků (10) | Spr. galerie (11) |
|---|:---:|:---:|:---:|:---:|:---:|
| Schvalování diskuzí | ✓ | ✓ | ✓ | — | — |
| Schvalování článků | ✓ | ✓ | — | ✓ | — |
| Schvalování galerie | ✓ | ✓ | — | — | ✓ |
| Správa příspěvků | ✓ | ✓ | ✓ | ✓ | ✓ |
| Úprava profilů uživatelů | ✓ | ✓ | — | — | — |
| **Správa uživatelů (role, ban)** | ✓ | ✓ | — | — | — |
| Správa obsahu platformy | ✓ | ✓ | — | — | — |
| Systémová nastavení | ✓ | — | — | — | — |

### Dopady na 1.3b

**V scope 1.3b je pouze "Správa uživatelů"** — tj. endpointy pro role-change, ban/unban, schvalování username žádostí. To znamená:

- Všechny admin endpointy 1.3b (`/admin/users/*`, `/admin/username-requests/*`) jsou gated `AdminGuard` → propustí **jen Superadmin (1) a Admin (2)**.
- `AdminGuard.canActivate` aktuálně testuje `user.role > UserRole.Admin` → throw. Číselný enum `Admin = 2` a Spr. * jsou 10–12 → AdminGuard je **správně** odmítne. **Nevyžaduje se žádná úprava guardu.**
- Spr. diskuzí / článků / galerie **nemají žádné endpointy v 1.3b**. Jejich pravomoci (schvalování obsahu, správa příspěvků) jsou out-of-scope a budou implementované v dalších fázích (3.x — diskuze/články/galerie pipeline).
- Ostatní role (PJ, Korektor, Hrac, Ctenar, Zadatel, Ikarus) **nemají administrativní práva** v 1.3b vůbec.

### Granular permission `canManageAdmins`

Nové pole na `User`: `canManageAdmins: boolean` (default `false`). Toto pole má smysl jen pro `role === Admin` (Superadmin má všechna oprávnění implicitně; ostatní role nemají admin endpoint přístup).

**Sémantika:**
- Admin s `canManageAdmins=false` (default) → smí operace **jen** na uživatelích s `target.role > 2` (tj. PJ, Korektor, Hrac, Ctenar, Zadatel, Ikarus, Spr. *) a smí přiřadit jen role > 2. Nesmí banovat ani měnit roli Adminům, nesmí povýšit nikoho na Admin/Superadmin.
- Admin s `canManageAdmins=true` → smí operace na uživatelích s `target.role === Admin` (jiný Admin). Smí povýšit nižší role na Admin. **Stále nesmí** operace na Superadminech ani vytvořit nového Superadmina.
- Superadmin → cokoli kromě sebe.

**Nastavení flagu:** jen Superadmin přes nový endpoint:
- `POST /api/admin/users/:id/admin-permissions` (body `{ canManageAdmins: boolean }`) — Superadmin-only check uvnitř service. Response `200 { user: SafeUser }`.

**FE UI:** v admin tabulce u řádků s `role === Admin` Superadmin vidí akci „Správa adminů: zapnuto/vypnuto" (toggle). Ostatní role tuto akci nevidí (skrytá).

### Role-change dropdown — pravidla

**FE strategie: plnohodnotný dropdown + BE odmít** (brainstorm 2026-05-12, fail-safe — admin vidí všechny role v dropdownu, BE validuje a vrátí 403 pokud nemá oprávnění; UI toast s konkrétní hláškou).

Dropdown obsahuje **všechny role kromě `Zakaz`** (ten je deprecated, viz §2 rozhodnutí). Pro všechny actors stejný seznam.

**BE-side validace** (`AdminService.updateUserRole`):

```ts
function assertCanChangeRole(actor: User, target: User, newRole: UserRole) {
  if (actor.id === target.id) throw new BadRequestException({ code: 'SELF_ROLE_CHANGE_FORBIDDEN' });

  // Superadmin operace = jen Superadmin
  if (target.role === UserRole.Superadmin && actor.role !== UserRole.Superadmin) {
    throw new ForbiddenException({ code: 'INSUFFICIENT_ROLE', message: 'Jen Superadmin smí měnit Superadmina' });
  }
  if (newRole === UserRole.Superadmin && actor.role !== UserRole.Superadmin) {
    throw new ForbiddenException({ code: 'INSUFFICIENT_ROLE', message: 'Jen Superadmin smí vytvořit Superadmina' });
  }

  // Admin operace = Superadmin, nebo Admin s canManageAdmins
  const isAdminOp = target.role === UserRole.Admin || newRole === UserRole.Admin;
  if (isAdminOp && actor.role === UserRole.Admin && !actor.canManageAdmins) {
    throw new ForbiddenException({ code: 'CANNOT_MANAGE_ADMINS', message: 'Nemáš oprávnění spravovat Adminy' });
  }

  // Zakaz role nikdy nepřiřazujeme (D-029)
  if (newRole === UserRole.Zakaz) {
    throw new BadRequestException({ code: 'ZAKAZ_DEPRECATED', message: 'Role Zákaz je deprecated, použij ban' });
  }
}
```

Stejná logika v `assertCanBanUser` (pro ban/unban):

```ts
function assertCanModerate(actor: User, target: User, action: 'BAN' | 'UNBAN') {
  if (actor.id === target.id) throw new BadRequestException({ code: `SELF_${action}_FORBIDDEN` });

  if (target.role === UserRole.Superadmin && actor.role !== UserRole.Superadmin) {
    throw new ForbiddenException({ code: 'INSUFFICIENT_ROLE' });
  }
  if (target.role === UserRole.Admin && actor.role === UserRole.Admin && !actor.canManageAdmins) {
    throw new ForbiddenException({ code: 'CANNOT_MANAGE_ADMINS' });
  }
}
```
3. **Source-of-truth seznam rolí:**
   - Číselný enum `UserRole` v `backend/src/modules/users/interfaces/user.interface.ts`
   - FE strana = `src/shared/types/userRole.ts` (musí být v sync s BE; D-019 cleanup je tracked)
   - Lidský český popisek per role v FE konstantě `ROLE_LABELS` (přidat 1.3b):
     ```ts
     export const ROLE_LABELS: Record<UserRole, string> = {
       [UserRole.Superadmin]: 'Superadmin',
       [UserRole.Admin]: 'Admin',
       [UserRole.PJ]: 'PJ',
       [UserRole.Korektor]: 'Korektor',
       [UserRole.Hrac]: 'Hráč',
       [UserRole.Ctenar]: 'Čtenář',
       [UserRole.Zadatel]: 'Žadatel',
       [UserRole.Zakaz]: 'Zákaz (deprecated, nepoužívat)',
       [UserRole.Ikarus]: 'Ikarus',
       [UserRole.SpravceClankuu]: 'Správce článků',
       [UserRole.SpravceGalerie]: 'Správce galerie',
       [UserRole.SpravceDisukzi]: 'Správce diskuzí',
     };
     ```

### Vizuální identifikace rolí — RoleStar (existující komponenta)

**Použijeme existující `RoleStar`** (`src/shared/ui/RoleStar/RoleStar.tsx`) — komponenta už obsahuje **přesně** 5 barev z tabulky oprávnění:

| Role | Barva | Hex |
|---|---|---|
| Superadmin | zelená | `#3ecf8e` |
| Admin | oranžová | `#f5a623` |
| Spr. diskuzí | žlutá | `#f0c040` |
| Spr. článků | červená | `#c04040` |
| Spr. galerie | modrá | `#3b82f6` |

Vizuálně je to **Lucide `<Star>` ikona** s `fill` v barvě role + tooltip s českým názvem. Pro ostatní role (PJ, Hrac, …) vrací `null` (neviditelná) — což je v admin tabulce OK; lidský label vedle bude pocházet z konstanty `ROLE_LABELS`.

**Žádný nový `RoleBadge` komponent.** Spec dříve plánovaný `RoleBadge` = nahrazený `RoleStar` (existuje, otestovaný, vizuálně sladěný).

### Status chip — existující `Badge` komponenta

Pro BANNED / PENDING USERNAME / canManageAdmins indikátory **použijeme existující `Badge`** (`src/shared/ui/Badge/Badge.tsx`) s variantami:

| Stav | Badge variant | Text + ikona |
|---|---|---|
| BANNED | `danger` | "BANNED" + 🚫 (Lucide `Ban`) |
| PENDING USERNAME | `warning` | "PENDING USERNAME" + ⏳ (Lucide `Clock`) |
| canManageAdmins (Admin s flagem) | `accent` | "A+" + 🔑 (Lucide `KeyRound`) |

Žádný nový komponent — Badge má již `--success-soft / --warning-soft / --danger-soft` token přes `Badge.module.css`.

### Co všechny role (vč. Spr. *) mohou v 1.3b

Všechny role (PJ, Korektor, Hrac, Ctenar, Zadatel, Ikarus, Spr. diskuzí/článků/galerie) mohou — stejně jako Admin a Superadmin — jako **běžní přihlášení uživatelé**:
- žádat o změnu vlastního username (`/users/me/username-request` — guard jen `JwtAuthGuard`)
- být zabanováni Superadminem/Adminem (per hierarchy v §4.5)
- vidět vlastní `MeResponse` s polem `canManageAdmins` (pro role ≠ Admin bude vždy `false` a FE ho ignoruje)

### Co Spr. *, PJ, Korektor a další **nemohou** v 1.3b

- volat `/api/admin/*` endpointy → `AdminGuard` vrátí 403 (role > 2)
- otevřít `/ikaros/uzivatele` → `RoleGuard([Superadmin, Admin])` vrátí ForbiddenPage
- mít flag `canManageAdmins` aktivní — pole sice na entitě existuje, ale BE check vyžaduje `role === Admin` (`POST /admin/users/:id/admin-permissions` vrátí `400 NOT_ADMIN`)

Spr. diskuzí/článků/galerie **získají vlastní pravomoci až v 3.x fázích** (schvalování obsahu) přes endpointy chráněné `RolesGuard` + `@Roles(...)`. 1.3b je nezavádí.

### Out-of-scope poznámka (důležitá pro 1.3c+)

Když 1.3c bude implementovat tombstone smazaného účtu, musí dořešit:
- Smazaný uživatel s rolí Spr. diskuzí/článků/galerie → kdo přebere ne-vyřízené žádosti? **Pro 1.3b ignorováno** (žádný takový stav neexistuje, pipeline pro schvalování ještě není).

A pro 3.x (obsah platformy):
- Endpointy pro `/admin/articles/pending`, `/admin/discussions/pending`, `/admin/gallery/pending` budou používat **`RolesGuard` + `@Roles(...)`** s konkrétními rolemi (per tabulka). 1.3b je nezavádí.

---

## 3. Rozsah

### 3.1 V rozsahu 1.3b

**BE:**
- Nová Mongoose kolekce `UsernameChangeRequest` (schema + repository + interface)
- Pole na `User`: `bannedAt`, `bannedBy`, `banReason` (3 nullable; `usernameChangedAt` už existuje z 1.3a)
- Endpointy user-facing:
  - `POST /api/users/me/username-request` — vytvoří pending request (validace: cooldown + duplicate + same + jedna pending)
  - `GET /api/users/me/username-request` — vrátí poslední pending nebo `null`
  - `DELETE /api/users/me/username-request` — uživatel zruší vlastní pending
- Endpointy admin:
  - `GET /api/admin/username-requests` — list (filter status, paginate)
  - `POST /api/admin/username-requests/:id/approve` — atomicky přepíše `User.username` + `usernameChangedAt`, request → `approved`
  - `POST /api/admin/username-requests/:id/reject` — request → `rejected` (volitelný důvod)
  - `POST /api/admin/users/:id/ban` — set `bannedAt/By/Reason`, revoke refresh tokens
  - `POST /api/admin/users/:id/unban` — clear ban fields
- `JwtStrategy.validate` — DB check `user.bannedAt` (per-request lookup; cache = D-026)
- `AuthService.login` — odmítne banned user s `403 BANNED`
- Rozšíření `MeResponse` o `bannedAt`, `canManageAdmins` + `usernameChangeRequest: { id, requestedUsername, status, requestedAt } | null`
- Rozšíření `GET /admin/users` response items o `bannedAt`, `pendingUsernameRequest`
- Hierarchy guards (self/Superadmin) v admin service metodách (ban, role change)
- Audit existujících admin endpointů (§3.6)
- BE testy (§7.1)

**FE:**
- **Profil — `SecuritySection`** odblokovat username pole:
  - Idle bez pending: button "Požádat o změnu" → form
  - Pending: banner "Žádost o `<requestedUsername>` čeká na schválení" + button "Zrušit žádost"
  - Cooldown aktivní (`now - usernameChangedAt < 30d`): button disabled + tooltip s datem odblokování
- **Stránka `/ikaros/uzivatele`** (nahradí stub):
  - Top-level taby: **Uživatelé** | **Žádosti o username** (badge s počtem pending)
  - Tab Uživatelé: tabulka (avatar, username + display, role chip, status chip, created, actions)
    - Search po username (debounce 300 ms)
    - Filter: role, "jen s pending request"
    - Paginace 20/stránka
    - Akce: změnit roli (dropdown), ban/unban (toggle s confirm/modal)
  - Tab Žádosti: tabulka (user, requestedUsername, requestedAt, status)
    - Sub-filter: pending (default) | approved | rejected
    - Akce na pending: Schválit (confirm) / Odmítnout (modal s volitelným reason)
- Hooky (TanStack Query):
  - `useMyUsernameRequest()` / `useRequestUsernameChange()` / `useCancelMyUsernameRequest()`
  - `useAdminUsers({ page, search, role, hasPendingRequest })`
  - `useAdminUpdateRole()` / `useAdminBanUser()` / `useAdminUnbanUser()`
  - `useAdminUsernameRequests({ status, page })`
  - `useAdminApproveUsernameRequest()` / `useAdminRejectUsernameRequest()`
- `currentUserAtom` rozšířit o `bannedAt`, `usernameChangeRequest`
- `RoleBadge` komponenta (extrahovat z 1.3a header) + nový `BannedBadge` chip
- Axios interceptor — `401 BANNED` / `403 BANNED` → force logout + toast
- FE testy (§7.2)

### 3.2 Mimo rozsah 1.3b (explicitně)

- **Tombstone smazání účtu** — 1.3c
- **Email change verification** — 1.7 (mailer)
- **Reset hesla z forgot flow** — 1.7
- **Veřejný profil `/ikaros/uzivatel/:id`** — 1.4 (v admin tabulce akce "Detail" skryta)
- **Email notifikace** o approve/reject — D-024 (čeká na 1.7 mailer)
- **Soft-ban (timed)** — D-021
- **Bulk akce** v admin tabulce — D-023
- **Plnohodnotný audit log** (kdo komu kdy co) — D-022; 1.3b uchovává jen poslední záznam (`bannedBy`, `decidedBy`)
- **Cooldown jako admin-konfigurovatelná konstanta** — D-025; 1.3b hardcoded 30 dní

---

## 4. Backend změny

### 4.1 Datový model

#### 4.1.1 User schema (rozšíření)

`backend/src/modules/users/schemas/user.schema.ts` — přidat:

```ts
@Prop({ type: Date, default: null }) bannedAt: Date | null;
@Prop({ type: String, default: null }) bannedBy: string | null;     // admin userId
@Prop({ type: String, default: null, maxlength: 500 }) banReason: string | null;
@Prop({ type: Boolean, default: false }) canManageAdmins: boolean;
```

`backend/src/modules/users/interfaces/user.interface.ts`:

```ts
bannedAt?: Date;
bannedBy?: string;
banReason?: string;
canManageAdmins: boolean;
```

`MongoUsersRepository.toEntity()` — namapovat nová pole.

Existující pole už máme: `usernameChangedAt`, `username`, `usernameLower`.

#### 4.1.2 UsernameChangeRequest schema (nová kolekce)

```ts
// backend/src/modules/users/schemas/username-change-request.schema.ts
@Schema({
  collection: 'username_change_requests',
  timestamps: { createdAt: 'requestedAt', updatedAt: false },
})
export class UsernameChangeRequestSchemaClass {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true, maxlength: 32 }) requestedUsername: string;
  @Prop({ required: true, lowercase: true, maxlength: 32 }) requestedUsernameLower: string;
  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  })
  status: 'pending' | 'approved' | 'rejected';
  @Prop({ type: String, default: null }) decidedBy: string | null;        // admin userId
  @Prop({ type: Date, default: null }) decidedAt: Date | null;
  @Prop({ type: String, default: null, maxlength: 500 }) decisionReason: string | null;
}
```

**Index pro „jedna pending na uživatele":** partial unique na `{ userId: 1 }` s filtrem `{ status: 'pending' }`.
**Index pro reverse lookup:** non-unique na `requestedUsernameLower`.

`backend/src/modules/users/interfaces/username-change-request.interface.ts`:

```ts
export interface UsernameChangeRequest {
  id: string;
  userId: string;
  requestedUsername: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
  decisionReason?: string;
}

export interface IUsernameChangeRequestsRepository {
  create(data: Omit<UsernameChangeRequest, 'id' | 'requestedAt' | 'status'>): Promise<UsernameChangeRequest>;
  findById(id: string): Promise<UsernameChangeRequest | null>;
  findPendingByUserId(userId: string): Promise<UsernameChangeRequest | null>;
  listPaginated(opts: { status?: 'pending' | 'approved' | 'rejected'; page: number; limit: number }): Promise<{ items: UsernameChangeRequest[]; total: number }>;
  update(id: string, patch: Partial<UsernameChangeRequest>): Promise<UsernameChangeRequest | null>;
  deletePending(userId: string): Promise<boolean>;
}
```

### 4.2 Endpointy — user-facing

#### 4.2.1 `POST /api/users/me/username-request`

DTO `RequestUsernameChangeDto`: `requestedUsername: string` (`@Matches(/^[a-z0-9-]{3,32}$/)`).

**Service flow** (`UsersService.requestUsernameChange(userId, dto)`):
1. Načti user
2. **Cooldown:** pokud `user.usernameChangedAt && (Date.now() - usernameChangedAt) < 30 * 86400_000` → throw `ForbiddenException({ code: 'COOLDOWN', message, allowedAt })`
3. **Same:** `dto.requestedUsername.toLowerCase() === user.usernameLower` → throw `BadRequestException({ code: 'SAME_USERNAME' })`
4. **Conflict:** `usersRepo.findByUsername(dto.requestedUsername)` → throw `ConflictException({ code: 'USERNAME_TAKEN' })`
5. **Existing pending:** `requestsRepo.findPendingByUserId(userId)` → throw `ConflictException({ code: 'REQUEST_PENDING' })`
6. `requestsRepo.create({ userId, requestedUsername, requestedUsernameLower })`
7. Return `{ request }`

#### 4.2.2 `GET /api/users/me/username-request`

Return `{ request: UsernameChangeRequest | null }` (poslední pending).

#### 4.2.3 `DELETE /api/users/me/username-request`

`requestsRepo.deletePending(userId)` → `false` → throw `NotFoundException`. Response `204`.

### 4.3 Endpointy — admin

#### 4.3.1 `GET /api/admin/username-requests`

Query: `status` (default `pending`), `page = 1`, `limit = 20`. Guard: `AdminGuard`.

Response:
```ts
{
  items: Array<{
    id: string;
    user: { id: string; username: string; avatarUrl: string | null; defaultAvatarType: string };
    requestedUsername: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: ISO;
    decidedAt: ISO | null;
    decidedBy: { id: string; username: string } | null;
    decisionReason: string | null;
  }>;
  total: number;
}
```

Implementace: aggregate s lookup do users (pro `user.username/avatarUrl` a `decidedBy.username`).

#### 4.3.2 `POST /api/admin/username-requests/:id/approve`

**Atomicky** (mongoose session/transaction):
1. Načti request → musí být `pending` jinak `409 ALREADY_DECIDED`
2. **Recheck conflict:** `usersRepo.findByUsername(request.requestedUsername)`:
   - Pokud někdo jiný má → mark request jako `rejected` s `decisionReason: 'Username byl mezitím obsazen'` + return `409 USERNAME_TAKEN_RECHECK`
3. Update target user: `username = requestedUsername`, `usernameLower = requestedUsernameLower`, `usernameChangedAt = now`
4. Update request: `status = 'approved'`, `decidedAt = now`, `decidedBy = admin.id`
5. Response `200 { request, user: SafeUser }`

**Pozn.:** refresh tokeny neresetujeme — username change je benign (JWT obsahuje `sub` = id, ne username).

#### 4.3.3 `POST /api/admin/username-requests/:id/reject`

Body `{ reason?: string }` (max 500).

1. Request musí být `pending` → `409 ALREADY_DECIDED`
2. Update: `status = 'rejected'`, `decidedAt = now`, `decidedBy = admin.id`, `decisionReason = body.reason ?? null`
3. Response `200 { request }`

#### 4.3.4 `POST /api/admin/users/:id/ban`

Body `{ reason?: string }` (max 500). Guard: `AdminGuard`.

1. `targetUser.id === admin.id` → `400 SELF_BAN_FORBIDDEN`
2. `targetUser.role === UserRole.Superadmin && admin.role !== UserRole.Superadmin` → `403 INSUFFICIENT_ROLE` (jen Superadmin smí banovat Superadmina)
3. `targetUser.bannedAt != null` → `409 ALREADY_BANNED`
4. Update: `bannedAt = now`, `bannedBy = admin.id`, `banReason = body.reason ?? null`
5. **`refreshTokenService.revokeAllForUser(targetUser.id)`** — revoke všech refresh tokenů zabanovaného
6. Response `200 { user: SafeUser }`

#### 4.3.5 `POST /api/admin/users/:id/unban`

1. `targetUser.bannedAt == null` → `409 NOT_BANNED`
2. `assertCanModerate(actor, target, 'UNBAN')` (hierarchy + canManageAdmins check, viz §2.5)
3. Update: `bannedAt = null`, `bannedBy = null`, `banReason = null`
4. Response `200 { user: SafeUser }`

#### 4.3.5b `POST /api/admin/users/:id/admin-permissions` (Superadmin-only)

Body `{ canManageAdmins: boolean }`.

1. **Superadmin-only:** `actor.role !== UserRole.Superadmin` → `403 INSUFFICIENT_ROLE` (uvnitř service, ne v guard — `AdminGuard` propustí i Admina, ten by ale měl dostat 403)
2. `targetUser.role !== UserRole.Admin` → `400 NOT_ADMIN` (flag dává smysl jen pro Adminy)
3. `actor.id === target.id` → `400 SELF_FORBIDDEN`
4. Update: `canManageAdmins = body.canManageAdmins`
5. Response `200 { user: SafeUser }`

#### 4.3.6 Rozšíření `GET /api/admin/users`

Existující endpoint — response items navíc:
- `bannedAt: ISO | null`
- `banReason: string | null`
- `pendingUsernameRequest: { id, requestedUsername, requestedAt } | null`

Implementace: aggregate `$lookup` do `username_change_requests` s `status: 'pending'`.

Query param navíc: `hasPendingRequest=true` (boolean) — filter jen uživatele s pending.

### 4.4 Banned user gate v auth

**`JwtStrategy.validate(payload)`:**
- Načti user z DB (audit aktuální impl. — pokud už lookuje, jen rozšíříme check)
- Pokud `user.bannedAt != null` → `UnauthorizedException({ code: 'BANNED', bannedAt, banReason })`
- Pokud user neexistuje → `UnauthorizedException({ code: 'USER_NOT_FOUND' })`
- Otherwise vrátí `{ id, role }`

**`AuthService.login`:**
- Pokud `user.bannedAt != null` → `ForbiddenException({ code: 'BANNED', banReason, bannedAt })` (banner v LoginModal s důvodem)

**Audit (před implementací):** ověřit jestli `JwtStrategy.validate` aktuálně lookuje user v DB nebo jen čte payload. Pokud čte payload, přidáme DB lookup (cache jako D-026).

### 4.5 Hierarchy a self-action pravidla

Sjednocené v §2.5 (`assertCanChangeRole`, `assertCanModerate`). Souhrnná matrix:

| Akce | Self | non-Admin target | Admin target | Superadmin target |
|---|---|---|---|---|
| `updateUserRole` actor=Superadmin | ❌ | ✅ | ✅ | ✅ (jiný Superadmin) |
| `updateUserRole` actor=Admin (canManageAdmins=true) | ❌ | ✅ | ✅ | ❌ |
| `updateUserRole` actor=Admin (canManageAdmins=false) | ❌ | ✅ | ❌ | ❌ |
| `setRoleTo === Admin` actor=Superadmin | – | ✅ | – | – |
| `setRoleTo === Admin` actor=Admin (canManageAdmins=true) | – | ✅ | – | – |
| `setRoleTo === Admin` actor=Admin (canManageAdmins=false) | – | ❌ | – | – |
| `setRoleTo === Superadmin` actor=Superadmin | – | ✅ | ✅ | – |
| `setRoleTo === Superadmin` actor=Admin (any) | – | ❌ | ❌ | – |
| `banUser` actor=Superadmin | ❌ | ✅ | ✅ | ✅ |
| `banUser` actor=Admin (canManageAdmins=true) | ❌ | ✅ | ✅ | ❌ |
| `banUser` actor=Admin (canManageAdmins=false) | ❌ | ✅ | ❌ | ❌ |
| `unbanUser` | identicky jako `banUser` |
| `setAdminPermissions` (set canManageAdmins) | ❌ | – | ✅ (jen Superadmin) | – |

### 4.6 Audit existujících admin endpointů

| Endpoint | Aktuální stav | 1.3b oprava |
|---|---|---|
| `PATCH /admin/users/:id/role` | `AdminGuard` (Admin+Superadmin) — chybí self/hierarchy/canManageAdmins check | Doplnit `assertCanChangeRole` |
| `POST /admin/users` (create) | `AdminGuard` — admin smí vytvořit Superadmina nebo Admina bez kontroly | Pro create použít `assertCanChangeRole(actor, virtualTarget, dto.role)` — virtualTarget má role > 2 (vznikne nový user) |
| `GET /admin/recent-pages` | `RolesGuard` `[Superadmin, Admin, PJ]` — OK | – |

### 4.7 BE testy (§7.1)

---

## 5. Frontend — architektura

### 5.1 Router

`/ikaros/uzivatele` už v routeru existuje s `RoleGuard(Superadmin, Admin)` — beze změny.
**Nová subroute pro hluboký link na tab:** ne — taby jsou state v komponentě + URL query param `?tab=requests` (přijatelné bez routes navíc).

### 5.2 Komponentní strom

```
features/admin/
├── pages/
│   ├── PlatformAdminPage.tsx               (existující stub, beze změny)
│   └── DungeonBuilderPage.tsx
├── users/
│   ├── pages/
│   │   └── AdminUsersPage.tsx              (nová — taby + obě views)
│   ├── components/
│   │   ├── AdminUsersTabs.tsx              (Uživatelé | Žádosti, badge s počtem)
│   │   ├── UsersTab/
│   │   │   ├── UsersTable.tsx
│   │   │   ├── UsersTable.module.css
│   │   │   ├── UsersFilters.tsx            (search + role + has-pending)
│   │   │   ├── UserRowActions.tsx          (role dropdown + ban/unban)
│   │   │   └── BanModal.tsx                (confirm + reason)
│   │   └── RequestsTab/
│   │       ├── RequestsTable.tsx
│   │       ├── RequestsTable.module.css
│   │       ├── RequestsStatusTabs.tsx      (sub-filter pending|approved|rejected)
│   │       └── RejectRequestModal.tsx      (reason input optional)
│   └── api/
│       └── useAdminUsers.ts                (všechny admin hooky 1.3b)
└── components/
    └── RoleGuard.tsx                       (existující, beze změny)

# Reusované UI primitive — nepsat nové:
src/shared/ui/RoleStar/   (5 barev per role — Superadmin/Admin/Spr.*)
src/shared/ui/Badge/      (variant=danger pro BANNED, warning pro PENDING, accent pro A+)
src/shared/ui/Modal/      (BanModal a RejectRequestModal jsou jen content props do Modal)
src/shared/ui/UserAvatar/ (z 1.3a — fallback na defaultAvatarType)
src/shared/ui/Input/, Button/, Spinner/  (primitives)
```

**Router import:** `c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/app/router.tsx` line 18 přepneme z `@/features/ikaros/pages/UsersPage` na `@/features/admin/users/pages/AdminUsersPage`. Stub `features/ikaros/pages/UsersPage.tsx` smažeme.

### 5.2.1 Card pattern — sjednocený s 1.3a profilem

AdminUsersPage **NEPOUŽÍVÁ** `IkarosCard` (ten je rezervovaný pro home/welcome/news karty s corner ornamenty). Pro sekce použijeme stejný **`.card` pattern** jako Profile sekce 1.3a:

```css
.card {
  background: var(--surface-1);
  border: 1px solid var(--frame-border);
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 16px;
}
.sectionTitle {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-strong);
}
```

Token mapping per téma se aplikuje automaticky přes `--surface-1, --frame-border, --text-strong` (viz `themes/_shared/tokens.css` lines 80–89). Žádné per-theme přepisy v admin/* CSS souborech (per [feedback_theme_isolation](../../../../../../Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/feedback_theme_isolation.md)).

### 5.3 Profile — SecuritySection rozšíření

```tsx
// pseudokód v c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src/features/profile/components/SecuritySection.tsx

const { data: usernameRequest } = useMyUsernameRequest();
const cooldownActive = user.usernameChangedAt && daysSince(user.usernameChangedAt) < 30;

// Read view:
{usernameRequest && (
  <Banner>
    Žádost o změnu na <strong>{usernameRequest.requestedUsername}</strong> čeká na schválení.
    <Button onClick={cancelRequest}>Zrušit žádost</Button>
  </Banner>
)}
{!usernameRequest && cooldownActive && (
  <p>Další žádost o změnu username můžeš podat po {formatDate(allowedAt)}.</p>
)}
{!usernameRequest && !cooldownActive && (
  <Button onClick={() => setEditing(true)}>Požádat o změnu</Button>
)}

// Edit view (form):
<Input {...register('requestedUsername')} />
<UsernameAvailabilityHint />  {/* reuse z 1.2 */}
<Button type="submit">Odeslat žádost</Button>
<Button onClick={cancel}>Zrušit</Button>
```

`useUsernameAvailable(value)` — reuse z 1.2 (`GET /users/exists/:username`).

### 5.4 Admin Users tabulka

**Desktop sloupce:**
```
[ avatar | username + displayName + email | role chip | status chip | created | actions ]
```

**Mobile:** card per uživatel (vertikální stack + actions v collapsable footer).

**Status chip (priorita):**
- `bannedAt != null` → ❌ červený "BANNED"
- `pendingUsernameRequest != null` → 🕐 žlutý "PENDING USERNAME"
- jinak nic

**Akce na řádku (popover):**
- "Změnit roli" → dropdown **plnohodnotný** (všechny role kromě `Zakaz`); BE odmítne s 403 + toast pokud actor nemá oprávnění
- "Banovat" → BanModal (potvrzení + reason input) / "Odbanovat" → confirm-only
- "Správa adminů: zapnuto/vypnuto" toggle — **viditelné jen pro Superadmina** a jen u řádků s `role === Admin`; toggle volá `POST /admin/users/:id/admin-permissions`
- "Detail" — skryto (1.4)

**Self-row:** zobrazí se s disabled akcemi + tooltip "Sebe nelze upravit".

### 5.5 Žádosti tab

**Sub-filter (status tabs):** Pending (default, s badge počtu) | Schválené | Odmítnuté

**Tabulka:**
```
[ user (avatar+username) | aktuální username | → requestedUsername | requestedAt | decidedAt | status | actions ]
```

**Akce (pending only):**
- ✅ Schválit → confirm modal "Schválit změnu z `<old>` na `<new>`?" → POST → optimistic remove z listu
- ❌ Odmítnout → RejectRequestModal (reason volitelný) → POST

**Race condition handling:** pokud BE vrátí `USERNAME_TAKEN_RECHECK` → toast „Username byl mezitím obsazen, žádost byla zamítnuta" + refresh listu.

### 5.6 currentUserAtom rozšíření

```ts
// src/shared/store/authStore.ts
type CurrentUser = {
  // ... existing 1.3a
  bannedAt?: string | null;
  usernameChangeRequest?: {
    id: string;
    requestedUsername: string;
    status: 'pending';
    requestedAt: string;
  } | null;
};
```

`useAuthBootstrap` (z 1.3a) je už nastavený na `setUser(data)` z `/users/me` — nová pole se dostanou automaticky.

### 5.7 Banned user UX

Když je current user zabanován:
- **Login:** BE `403 BANNED` → LoginModal banner: „Tvůj účet byl zabanován. Důvod: `<reason>`. Kontaktuj support."
- **Aktivní session:** další API request `401 BANNED` (z JwtStrategy) → globální axios interceptor v `src/shared/api/client.ts`:
  ```ts
  if (status === 401 && error.response.data?.code === 'BANNED') {
    logout();
    toast.error('Tvůj účet byl zabanován');
  }
  ```
- **Profil:** redirect na `/?banned=1` (query param zobrazí banner na home).

---

## 6. UI/UX detail

### 6.1 Theme

Všechny komponenty respektují aktuální `data-theme`. Žádné per-theme přepisy v admin stránkách — token-only ([feedback_theme_isolation](../../../../../../Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/feedback_theme_isolation.md)).

### 6.2 Mobile

- Tabulka uživatelů → na mobilu cards (≤ 768px)
- Žádosti tabulka → cards
- Skill `mobil-desktop` po grafických úpravách

### 6.3 A11y

- `<table>` semantic s `<th scope="col">`
- Ikon-only akce mají `aria-label`
- Modaly: focus trap, ESC zavírá, focus na první input
- Status chipy: text + ikona (ne jen barva)
- Confirm text obsahuje konkrétní username (ne „tohoto uživatele")
- `aria-live="polite"` pro badge počtu pending

### 6.4 Loading / error states

- TanStack Query `isPending` → skeleton rows
- Mutace error → toast s `error.response.data.message` (CZ fallback)
- Ban toggle: žádný optimistic update (chceme jistotu)

---

## 7. Akceptační kritéria

### 7.1 Žádost o username change (user-side)

- [ ] Bez pending a bez cooldown: profil Bezpečnost → "Požádat o změnu" → form → odeslat → POST 201 → banner "čeká na schválení"
- [ ] S pending: banner viditelný hned po načtení profilu
- [ ] Pending → kliknu "Zrušit žádost" → DELETE 204 → banner zmizí, button znovu viditelný
- [ ] Cooldown ≤ 30 dní od posledního approved → button disabled + tooltip s datem odblokování
- [ ] Reject neresetuje cooldown — uživatel může odeslat další request hned po rejectu (pokud nemá approved v cooldown okně)
- [ ] Pošlu request s neplatným formátem → 400 → field error
- [ ] Pošlu request s obsazeným username → 409 → form error
- [ ] Pošlu request shodný se současným username → 400 SAME → form error "Zadej jiný username"

### 7.2 Admin schvalování (Tab Žádosti)

- [ ] `/ikaros/uzivatele?tab=requests` → tab Žádosti aktivní → sub-tab Pending → seznam aktuálních
- [ ] Kliknu Schválit → confirm → POST 200 → request mizí z Pending, target user má nový username (ověř v tabulce Uživatelé)
- [ ] Kliknu Odmítnout → modal s reason (volitelný) → POST 200 → request v sub-tabu Odmítnuté
- [ ] Race: mezitím někdo zabere username → kliknu Schválit → toast "Username byl mezitím obsazen, žádost byla zamítnuta" + refresh
- [ ] Empty state: žádné pending → "Žádné žádosti o změnu username čekají na schválení"
- [ ] Badge na tabu Žádosti zobrazuje počet pending (refresh po každé akci)

### 7.3 Admin tabulka uživatelů (Tab Uživatelé)

- [ ] `/ikaros/uzivatele` → tab Uživatelé default → načte prvních 20
- [ ] Search "tyky" → debounced GET → matching
- [ ] Filter role "PJ" → jen PJ
- [ ] Filter "Jen s pending request" → jen ti s pending
- [ ] Stránkování → další 20
- [ ] Změnit roli (jiný user): dropdown → PATCH 200 → chip se aktualizuje
- [ ] Změnit svou roli → action disabled + tooltip "Sebe nelze upravit"
- [ ] Admin → Admin role change: 200 (jsou si rovni)
- [ ] Admin → Superadmin role change: 403 → toast "Pouze Superadmin může"
- [ ] Dropdown role-change obsahuje všechny role kromě `Zakaz` (pro Admina i Superadmina, plnohodnotný — UI checky neprovádíme)
- [ ] Admin (canManageAdmins=false) zkusí přiřadit roli `Admin` → BE 403 CANNOT_MANAGE_ADMINS → toast „Nemáš oprávnění spravovat Adminy"
- [ ] Admin (canManageAdmins=false) zkusí přiřadit roli `Superadmin` → BE 403 INSUFFICIENT_ROLE → toast
- [ ] Admin (canManageAdmins=true) přiřadí `Admin` → 200 OK
- [ ] Admin (canManageAdmins=true) přiřadí `Superadmin` → BE 403 (jen Superadmin smí vytvořit Superadmina)
- [ ] Admin (canManageAdmins=false) zkusí banovat jiného Admina → BE 403 CANNOT_MANAGE_ADMINS
- [ ] Admin (canManageAdmins=true) banuje jiného Admina → 200 OK
- [ ] Admin (any) zkusí banovat Superadmina → BE 403 INSUFFICIENT_ROLE
- [ ] Superadmin vidí v admin tabulce u Admina toggle „Správa adminů" → kliknu → POST 200 → flag se přepne, chip se případně doplní
- [ ] Admin nevidí toggle „Správa adminů" (skryté UI)
- [ ] Admin zkusí POST `/admin/users/:id/admin-permissions` → 403 (jen Superadmin)
- [ ] Role chip má správnou barvu per role (Superadmin zelená, Admin oranžová, Spr. diskuzí žlutá, Spr. článků červená, Spr. galerie modrá, PJ neutrální); Admin s `canManageAdmins=true` má drobný indikátor (např. „A+" / ikona klíče)
- [ ] Spr. diskuzí/článků/galerie se přihlásí a otevře `/ikaros/uzivatele` → ForbiddenPage (RoleGuard odmítne — Spr. * není v `[Superadmin, Admin]`)
- [ ] Spr. diskuzí/článků/galerie POST na admin endpoint → 403 (AdminGuard odmítne)
- [ ] Banovat: kliknu Banovat → BanModal s reason → POST 200 → status chip BANNED
- [ ] Banovat sám sebe → action disabled
- [ ] Banovaného odbanovat: confirm → POST 200 → chip zmizí
- [ ] Admin banuje Admina: 200 (jsou si rovni)
- [ ] Admin banuje Superadmina: 403

### 7.4 Banned user gate

- [ ] Banned user pokusí login → 403 BANNED → LoginModal banner s reason
- [ ] Banned user měl aktivní session → další API request → 401 BANNED → axios interceptor → logout + toast
- [ ] Banned user otevře `/ikaros/profil` → redirect na `/?banned=1` (banner na home)

### 7.5 BE

- [ ] `POST /users/me/username-request` všechny validace (§4.2.1)
- [ ] `GET /users/me/username-request` vrátí pending nebo null
- [ ] `DELETE /users/me/username-request` 204; jinak 404
- [ ] `GET /admin/username-requests?status=pending` 200 + paginace + `user` lookup
- [ ] `POST /admin/username-requests/:id/approve` happy + atomicita (race)
- [ ] `POST /admin/username-requests/:id/reject` happy + reason ukládán
- [ ] `POST /admin/users/:id/ban` happy + self 400 + Superadmin hierarchy 403 + already 409 + refresh tokeny revokovány
- [ ] `POST /admin/users/:id/unban` happy + not-banned 409 + hierarchy
- [ ] `POST /admin/users/:id/admin-permissions` happy (Superadmin) + 403 pro Admina + 400 NOT_ADMIN pokud target není Admin + 400 SELF_FORBIDDEN
- [ ] `JwtStrategy.validate` vyhodí pro banned user
- [ ] `AuthService.login` vrátí 403 BANNED
- [ ] `PATCH /admin/users/:id/role` self 400 + Superadmin hierarchy 403

### 7.6 Mobile / a11y

- [ ] Skill `mobil-desktop` prošel
- [ ] Tabulky přepnou na cards ≤ 768px
- [ ] Modaly mají focus trap, ESC zavírá
- [ ] Akce ikon-only mají aria-label
- [ ] Badge počtu pending má aria-live

---

## 8. Testy

### 8.1 BE

**Unit (jest):**
- `users.service.spec.ts` rozšíření:
  - `requestUsernameChange` — happy, cooldown, same, taken, duplicate pending
  - `cancelMyUsernameRequest`
  - `getMyUsernameRequest`
- `admin.service.spec.ts` rozšíření:
  - `listUsernameRequests` (filter status, pagination, user lookup)
  - `approveUsernameRequest` — happy, already-decided, race (re-take)
  - `rejectUsernameRequest` — happy, with reason, already-decided
  - `banUser` — happy, self 400, Superadmin hierarchy 403, already 409
  - `unbanUser` — happy, not-banned 409, hierarchy
  - `updateUserRole` — self 400, Superadmin hierarchy 403
- `jwt.strategy.spec.ts` — banned 401, user-not-found 401
- `auth.service.spec.ts` — login banned 403

**E2E (supertest):**
- `users.username-request.e2e-spec.ts` — full user flow
- `admin.username-requests.e2e-spec.ts` — full admin flow + race
- `admin.ban.e2e-spec.ts` — ban, unban, hierarchy, existing access token denied

**Schema:**
- `username-change-request.schema.spec.ts` — partial unique index (jen jeden pending na user)

### 8.2 FE

**Unit (vitest):**
- `usernameRequestSchema.spec.ts` — zod (formát, délka)
- `useAdminUsers.spec.ts` — TanStack hooky cache keys, invalidace
- `RoleBadge.spec.tsx` — render per role + BANNED

**Component (RTL):**
- `SecuritySection.spec.tsx` — pending state, cooldown state, submit, cancel
- `AdminUsersPage.spec.tsx` — taby switching, badge počtu
- `UsersTable.spec.tsx` — render, search debounce, role change, ban toggle (mocked API)
- `RequestsTable.spec.tsx` — sub-tabs, approve, reject s reason, race handling
- `BanModal.spec.tsx` — confirm s reason
- `RejectRequestModal.spec.tsx` — reason optional

**Storybook:**
- `AdminUsersPage/UsersTab/Default`, `UsersTab/WithBanned`, `UsersTab/WithPendingRequests`, `UsersTab/Empty`
- `AdminUsersPage/RequestsTab/Pending`, `RequestsTab/Approved`, `RequestsTab/Empty`
- `SecuritySection/IdleWithCooldown`, `SecuritySection/PendingRequest`

---

## 9. Migrace / breaking changes

### 9.1 BE

- **Nová kolekce** `username_change_requests` — non-breaking (vznikne při prvním save)
- **Nová pole na User** (`bannedAt`, `bannedBy`, `banReason`) — Mongoose default `null`, non-breaking
- **`MeResponse` rozšíření** — additive
- **`AdminUsersResponse` rozšíření** — additive
- **`JwtStrategy.validate` — DB lookup pro ban** — drobný overhead per request (cache = D-026)
- **Login response** — banned user `403` (předtím by se loginl)

### 9.2 FE

- `currentUserAtom` type rozšíření — TS errors navedou na callsites
- Router import `UsersPage` → `AdminUsersPage` (jeden řádek v `src/app/router.tsx`)
- `features/ikaros/pages/UsersPage.tsx` stub smažeme
- `SecuritySection` — username pole odblokované

### 9.3 Závislosti

Žádné nové npm balíčky (vše máme: react-hook-form, zod, TanStack Query, axios, lucide-react).

---

## 10. Tracked dluhy

- **D-021** — Časově omezený ban (`bannedUntil` + cron auto-unban). 1.3b: trvalý.
- **D-022** — Audit log feed (kdo komu kdy co). 1.3b: jen poslední záznam.
- **D-023** — Bulk akce v admin tabulce (multi-select, batch ban/role).
- **D-024** — Email notifikace o approve/reject. Čeká na mailer (1.7).
- **D-025** — Cooldown jako admin-konfigurovatelná konstanta. 1.3b: hardcoded 30 dní.
- **D-026** — Cache pro `JwtStrategy.validate` ban check (Redis-based). 1.3b: per-request DB lookup.
- **D-027** — Veřejný profil link z admin tabulky (akce "Detail"). Závisí na 1.4.
- **D-028** — Toast/badge při login s rozhodnutou žádostí (`seenAt` flag na requestu).
- **D-029** — `UserRole.Zakaz` deprecate z enum (1.3b ji ignoruje, ale enum value zůstává).
- **D-030** — Audit log toggle `canManageAdmins` (kdy/kým zapnut/vypnut). 1.3b: jen aktuální stav na User.
- **D-031** — Granular permissions framework (více flagů než jen `canManageAdmins`) — pokud bude potřeba (např. `canEditPlatformPages`, `canModerateContent` atd.). 1.3b: jen jeden flag.
- **D-032** ✅ **vyřešeno v 1.3b (rozhodnutí 2026-05-12)** — **Enum mismatch FE ↔ BE** (objeveno během design auditu 2026-05-12):
  - FE `src/shared/types/index.ts`: `SpravceBohu=10, SpravceGalerie=11, SpravceDiskuzi=12, SpravceClanku=13`
  - BE `backend/src/modules/users/interfaces/user.interface.ts`: `SpravceClankuu=10` (dvojité `u`!), `SpravceGalerie=11, SpravceDisukzi=12` (přehozené `ku` → `kuz` v `Disukzi`), **bez `SpravceBohu`**
  - Hodnoty 10 a 12 mají rozdílné významy mezi FE a BE → existující uživatelé s rolí 10 (BE = "SpravceClankuu", FE = "SpravceBohu") jsou inkonzistentně typovaní
  - **Rozhodnutí pro 1.3b:** doplnit explicitní mapování v jednom místě + flag jako blocking dluh. Návrh: BE je source-of-truth (data v DB má číselné hodnoty z BE enum). FE enum přejmenovat na shodné názvy + opravit překlepy. Riziko: rebuild všech callsites s `UserRole.SpravceBohu` (FE-only) — buď migrate na novou roli nebo dohledat data.
  - **Plán řešení v 1.3b (Phase 1 v plan-1.3b.md):** BE je source-of-truth (existující data v DB). FE enum přejmenovat na shodné názvy + opravit BE překlepy. `SpravceBohu` (FE-only) = dead code (chybí v tabulce oprávnění a v BE) → smažeme. Finální enum (1=Superadmin, 2=Admin, 3=PJ, 4=Korektor, 5=Hrac, 6=Ctenar, 7=Zadatel, 8=Zakaz [deprecated], 9=Ikarus, 10=SpravceClanku, 11=SpravceGalerie, 12=SpravceDiskuzi) — sjednocený FE i BE.
  - **Migrace dat:** v MongoDB najít všechny `User.role = 10/11/12` a ověřit. Pokud existují s nesprávným významem (BE = SpravceClankuu místo Clanku) → nutná migrace dat (nepravděpodobné — překlep byl v kódu, ne v datech).

---

## 10.5 Vizuální mockupy (design audit 2026-05-12)

### AdminUsersPage — desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│  ADMINISTRACE UŽIVATELŮ                                              │
│                                                                      │
│  ┌─────────────────┐ ┌──────────────────────────┐                    │
│  │ Uživatelé · 142 │ │ Žádosti o username  ⚠ 3  │                    │
│  └─────────────────┘ └──────────────────────────┘                    │
│  ──────────────────                                                  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🔍 Hledat uživatele...   [Role: vše ▾]  ☐ Jen s pending req. │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ AVATAR │ USER (username + displayName)   │ ROLE  │ STATUS │ ⋯ │ │
│  ├────────┼─────────────────────────────────┼───────┼────────┼───┤ │
│  │  [@]   │ tyky                            │ ★ S   │   —    │⋯ │ │
│  │        │ Pavel J. · 8.5.2025             │       │        │   │ │
│  ├────────┼─────────────────────────────────┼───────┼────────┼───┤ │
│  │  [@]   │ dragon123                       │ ★ A   │ [BAN]  │⋯ │ │
│  │        │ Dračí Pán · 1.4.2025  🔑 A+     │       │        │   │ │
│  ├────────┼─────────────────────────────────┼───────┼────────┼───┤ │
│  │  [@]   │ xandra                          │   —   │[PEND]  │⋯ │ │
│  │        │ Aleksandra · 2.3.2025           │       │        │   │ │
│  └────────┴─────────────────────────────────┴───────┴────────┴───┘ │
│                                                                      │
│          ←  Strana 1 z 8  →                                          │
└──────────────────────────────────────────────────────────────────────┘
```

★ = `RoleStar` (Lucide Star ikona vyplněná barvou per role). 🔑 A+ = `Badge variant=accent` pro `canManageAdmins=true`. [BAN] = `Badge variant=danger`. [PEND] = `Badge variant=warning`.

### AdminUsersPage — mobile (≤ 768px)

CSS přepne tabulku na cards (`@media`, `display: grid`):

```
┌──────────────────────────┐
│ ADMIN. UŽIVATELŮ         │
│ [Uživ. 142] [Žádosti ⚠3] │
│                          │
│ 🔍 Hledat...             │
│ [Role ▾] ☐ S pending     │
│                          │
│ ┌──────────────────────┐ │
│ │ [@]  tyky            │ │
│ │      Pavel J.         │ │
│ │      ★ Superadmin     │ │
│ │      Vytvořeno: 8.5.25│ │
│ │      ─────────       │ │
│ │      [Změnit roli]    │ │
│ │      [Banovat]        │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [@]  dragon123        │ │
│ │      Dračí Pán        │ │
│ │      ★ Admin  🔑 A+   │ │
│ │      [BAN] od 5.5.25  │ │
│ │      ─────────       │ │
│ │      [Změnit roli]    │ │
│ │      [Odbanovat]      │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### BanModal

```
┌─────────────────────────────────────┐
│  Banovat uživatele           [×]   │
├─────────────────────────────────────┤
│                                     │
│  Opravdu chceš zabanovat            │
│  uživatele "dragon123"?             │
│                                     │
│  Důvod (volitelný):                 │
│  ┌─────────────────────────────────┐ │
│  │                                 │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ⚠ Zabanování okamžitě odhlásí      │
│    všechna jeho zařízení.           │
│                                     │
├─────────────────────────────────────┤
│            [Zrušit]  [⛔ Banovat]   │
└─────────────────────────────────────┘
```

### SecuritySection — pending state

```
┌────────────────────────────────────┐
│ USERNAME                            │
│                                     │
│ Aktuální: tyky                      │
│                                     │
│ ┌────────────────────────────────┐ │
│ │ ⏳ Žádost o změnu              │ │
│ │ na "tykytanjr"                 │ │
│ │ čeká na schválení.             │ │
│ │                                │ │
│ │ Podáno: 10.5.2026               │ │
│ │                                │ │
│ │ [Zrušit žádost]                │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### RequestsTab

```
┌──────────────────────────────────────────────────────────────────┐
│  [Pending · 3] [Schválené] [Odmítnuté]                           │
│                                                                  │
│ ┌──────┬──────────────┬─────────────┬───────────┬─────────────┐ │
│ │ AVT  │ STÁVAJÍCÍ    │ POŽADOVANÉ  │ PODÁNO    │ AKCE         │ │
│ ├──────┼──────────────┼─────────────┼───────────┼─────────────┤ │
│ │ [@]  │ xandra       │ → aleksandr │ 10.5.2026 │ [✓] [✕]      │ │
│ │ [@]  │ user42       │ → tomas-cz  │ 9.5.2026  │ [✓] [✕]      │ │
│ │ [@]  │ olda         │ → oldrich99 │ 8.5.2026  │ [✓] [✕]      │ │
│ └──────┴──────────────┴─────────────┴───────────┴─────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. Otevřené body (pre-implementation)

- [ ] **`JwtStrategy.validate` aktuální chování** — audit při startu implementace: dělá už DB lookup, nebo jen čte payload? Pokud čte, doplníme lookup (drobný overhead → D-026).
- [ ] **`MongoUsernameChangeRequestsRepository` BaseMongoRepository fit** — ověřit, že generický base (`BaseMongoRepository<UsernameChangeRequest>`) umí partial unique index nebo to nastavíme přímo v schema decorators.
- [ ] **Aggregate `$lookup` v `GET /admin/users`** — pridáním pendingUsernameRequest do response per row znamená `$lookup` k requests kolekci. Pro 20 řádků OK; pro big paginated benchmark v testech.

---

## 12. Po schválení tohoto specu

Vytvořím `docs/arch/phase-1/plan-1.3b.md` — implementační plán s konkrétními soubory, pořadím změn (BE schema → BE repository → BE service → BE controller → JwtStrategy gate → FE hooky → FE komponenty → FE pages → FE profile section), test stepy a checklisty. Počkám na schválení toho, pak budu kódovat.
