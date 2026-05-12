# Plán 1.4 — Stránka Uživatelé + Veřejný profil + univerzální Zpracovat tab

**Datum:** 2026-05-12
**Status:** ✅ Implementováno 2026-05-12 (BE 833 testů ✓, FE 170 testů ✓, tsc ✓, lint ✓, build ✓)
**Spec:** `docs/arch/phase-1/spec-1.4.md` ✅
**Design audit:** `docs/arch/phase-1/design-1.4.md` ✅
**Pořadí prací:** BE → FE → Tests → Polish

---

## 0. Předpoklady BE (ověřit před startem)

1. **MongoDB / Mongoose** (kontinuita s 1.3a/b/c). `User` schema má všechna pole, která potřebujeme (`isDeleted`, `deletionRequestedAt`, `usernameLower`, `displayName`, `worldsCount` agregace, `avatarUrl`, `defaultAvatarType`, `role`).
2. **Existující `AdminUsersController`** (z 1.3b) zůstává — nový `UsersController` je samostatný (public endpoints), nesahá do admin scope.
3. **Existující `AuditLogTab` + `useAdminAuditLog`** (z 1.3b D-024) reuse beze změn.
4. **Existující modaly z 1.3b** (`AdminBanModal`, `AdminDeleteUserModal`, role-change dropdown) reuse beze změn — kebab menu na UserCard volá tytéž handlery.

Pokud kterýkoliv bod nepravdivý, pozastavit a komunikovat.

---

## 1. Pre-flight checklist

### 1.1 BE — ověřit
- [ ] `backend/src/modules/users/users.service.ts` má metodu pro public listing (nebo ji přidat)
- [ ] `backend/src/modules/admin/admin-users.controller.ts` neměnit; admin endpoints zůstávají na `/api/admin/users`
- [ ] Throttle decorator `@SkipThrottle()` / `@Throttle()` dostupný (60 req/min/IP přidat na nové endpointy)
- [ ] `JwtAuthGuard` + `RolesGuard` z 1.3b reuse

### 1.2 FE — ověřit
- [ ] Existující `UserAvatar` (1.3a) + `defaultAvatarType` fallback funguje
- [ ] Existující `AdminBanModal`, `AdminDeleteUserModal`, `RoleChangeDropdown` exportovány z `src/features/admin/users/components/`
- [ ] Lucide ikony dostupné (`Shield`, `ShieldStar` nebo alias, `FileText`, `ImageIcon`, `MessageSquare`, `MoreVertical`, `Inbox`, `Users`)
- [ ] Žádné nové npm závislosti

### 1.3 CSS tokens
- [ ] Nové role-chip tokens a usercard cornerstones se přidají do `src/themes/_shared/tokens.css` (§4)

---

## 2. Backend — pořadí kroků

> Pracovní adresář BE: `C:\Matrix\ProjektIkaros\Projekt-ikaros\backend`

### 2.1 Public users endpoints

**Nový modul:** `backend/src/modules/users/users.controller.ts` (rozšířit existující) + nové DTOs.

**Soubory:**
- `backend/src/modules/users/dto/public-user-list-item.dto.ts` (nový)
- `backend/src/modules/users/dto/public-user-profile.dto.ts` (nový)
- `backend/src/modules/users/dto/public-users-query.dto.ts` (nový — `page`, `limit`, `search`, `sort`, `includeDeleted`)
- `backend/src/modules/users/users.controller.ts` — přidat:
  - `GET /api/users` (RoleGuard Admin/Superadmin + JwtAuthGuard)
  - `GET /api/users/:id` (jen JwtAuthGuard)
- `backend/src/modules/users/users.service.ts` — přidat:
  - `listPublic(query: PublicUsersQueryDto, requesterRole: UserRole)` — Mongo find s filterem (isDeleted/deletionRequestedAt), agregát `worldsCount`
  - `getPublicProfile(id: string, requesterRole: UserRole)` — single user, admin výjimka pro tombstone

**Filtrace tombstone (default):**
```ts
const baseFilter = { isDeleted: { $ne: true }, deletionRequestedAt: null };
const filter = query.includeDeleted && isAdmin(requesterRole) ? {} : baseFilter;
```

**Search:** case-insensitive substring na `usernameLower` + lowercase `displayName`:
```ts
if (query.search) {
  const term = query.search.toLowerCase();
  filter.$or = [
    { usernameLower: { $regex: term, $options: 'i' } },
    { displayName: { $regex: term, $options: 'i' } },
  ];
}
```

**Sort:**
- `new` → `{ createdAt: -1 }`
- `abc` → `{ usernameLower: 1 }`

**Privacy projection (mongoose `.select()`):**
```ts
const PUBLIC_PROJECTION =
  '_id username displayName city bio avatarUrl defaultAvatarType ' +
  'characterName characterBio characterAvatarUrl role createdAt';
// + isDeleted / deletionRequestedAt jen pro admin výjimku
```

**Throttle:** `@Throttle({ default: { limit: 60, ttl: 60000 } })` na oba endpointy.

**Akceptační:**
- [ ] `GET /api/users` jako Hrac/PJ/Spravce* → 403 FORBIDDEN
- [ ] `GET /api/users` jako Admin/Superadmin → 200 s items
- [ ] `GET /api/users/:id` jako Hrac → 200 (každý přihlášený)
- [ ] Tombstone účet → 404 pro běžné, 200+`{ deleted: true }` pro admin
- [ ] Response **neobsahuje** `email`, `lastLoginAt`, `themeId`, `chatColor`, `bannedAt`, `deletionRequestedAt`, `passwordHash`, `refreshTokens` — testem E2E

### 2.2 PendingAction infrastructure

**Nový modul:** `backend/src/modules/pending-actions/`

**Soubory:**
- `backend/src/modules/pending-actions/pending-action-type.enum.ts`
- `backend/src/modules/pending-actions/pending-action-provider.interface.ts`
- `backend/src/modules/pending-actions/pending-actions.service.ts`
- `backend/src/modules/pending-actions/pending-actions.controller.ts`
- `backend/src/modules/pending-actions/pending-actions.module.ts`

**Enum:**
```ts
export enum PendingActionType {
  UsernameRequest = 'username_request',  // 1.4 (přesun z 1.3b)
  FriendRequest = 'friend_request',       // 1.8
  WorldJoinRequest = 'world_join_request',// 2.4
  ArticlePendingReview = 'article_pending_review',  // 3.2
  GalleryPendingReview = 'gallery_pending_review',  // 3.3
  DiscussionReport = 'discussion_report',           // 3.4
  DiscussionJoinRequest = 'discussion_join_request',// 3.4
}
```

**Interface:**
```ts
export interface IPendingActionProvider {
  readonly type: PendingActionType;
  /** Pro koho je akce relevantní podle role/permission. */
  canHandle(userId: string, role: UserRole, adminPerms?: AdminPermissions): Promise<boolean>;
  /** Vrátí počet pending položek pro daného uživatele. */
  countForUser(userId: string): Promise<number>;
  /** Vrátí stránku pending položek. */
  listForUser(userId: string, page: number, limit: number): Promise<{ items: unknown[]; total: number }>;
}
```

**Service:**
```ts
@Injectable()
export class PendingActionsService {
  private providers = new Map<PendingActionType, IPendingActionProvider>();
  register(provider: IPendingActionProvider): void { ... }
  async countForUser(userId: string, role: UserRole): Promise<number> {
    // sčítá napříč registrovanými providers, kde canHandle = true
  }
  async listForUser(userId: string, role: UserRole, type?: PendingActionType, page, limit): Promise<{ items, total }> {
    // ?type query filtruje na jeden typ; bez ?type vrátí union (1.4 nevyžaduje, použijí 1.8+)
  }
}
```

**Controller:**
- `GET /api/pending-actions/count` (auth) → `{ total: number }` pro current user
- `GET /api/pending-actions?type=username_request&page=1&limit=20` (auth) → `{ items, total }`

V 1.4 registruje pouze `UsernameRequestProvider` (přesun z 1.3b).

**Akceptační:**
- [ ] `GET /api/pending-actions/count` jako Admin se 3 pending username requests → `{ total: 3 }`
- [ ] Jako Hrac → `{ total: 0 }` (žádný provider canHandle)
- [ ] `GET /api/pending-actions?type=username_request` jako Admin → seznam pending requests

### 2.3 UsernameRequestProvider

**Soubor:** `backend/src/modules/admin/admin-users/username-request.provider.ts` (nový)

Implementuje `IPendingActionProvider`:
- `type = PendingActionType.UsernameRequest`
- `canHandle`: jen Admin/Superadmin
- `countForUser`: vrací globální count pending username requests (ne per-user — admin vidí všechny)
- `listForUser`: vrací paginované pending requests

Registruje se v `AdminUsersModule.onModuleInit()` přes `pendingActionsService.register(this.usernameRequestProvider)`.

**Akceptační:**
- [ ] Existující `GET /api/admin/username-requests` (1.3b) zůstává funkční (admin tab může používat)
- [ ] Nový `GET /api/pending-actions?type=username_request` vrací stejná data jako 1.3b endpoint
- [ ] Po `approve` / `reject` mutaci v 1.3b se invaliduje cache (vyřešeno na FE straně, BE jen vrátí update)

### 2.4 BE testy

- `users.controller.spec.ts` — RoleGuard, query params, privacy projection
- `users.service.spec.ts` — listPublic search, sort, pagination, tombstone exclusion, admin includeDeleted
- `pending-actions.service.spec.ts` — provider registry, canHandle filtering, count aggregation
- E2E `users-public.e2e-spec.ts` — anon 401, Hrac 403, Admin 200, privacy fields absent
- E2E `pending-actions.e2e-spec.ts` — count per role

---

## 3. Frontend — pořadí kroků

> Pracovní adresář FE: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE`

### 3.1 Nové CSS tokens

**Soubor:** `src/themes/_shared/tokens.css` — přidat na konec `:root`:

```css
:root {
  /* ── 1.4: Role chip semantic colors ── */
  --role-superadmin-bg:    var(--theme-accent-bright, var(--warning));
  --role-superadmin-fg:    var(--text-on-accent, #050508);
  --role-superadmin-ring:  var(--theme-glow-gold, var(--success-glow));

  --role-admin-bg:         var(--theme-accent, var(--accent));
  --role-admin-fg:         var(--text-on-accent, #050508);
  --role-admin-ring:       var(--theme-border, var(--accent-soft));

  --role-spravce-clanku-bg:    #d97706;
  --role-spravce-clanku-fg:    #ffffff;
  --role-spravce-clanku-ring:  rgba(217, 119, 6, 0.35);

  --role-spravce-galerie-bg:   #a855f7;
  --role-spravce-galerie-fg:   #ffffff;
  --role-spravce-galerie-ring: rgba(168, 85, 247, 0.35);

  --role-spravce-diskuzi-bg:   #14b8a6;
  --role-spravce-diskuzi-fg:   #ffffff;
  --role-spravce-diskuzi-ring: rgba(20, 184, 166, 0.35);

  /* ── 1.4: UserCard cornerstones ── */
  --usercard-corner-size:    8px;
  --usercard-corner-color:   var(--theme-border, var(--accent-soft));

  /* ── 1.4: Tab nav ── */
  --tab-underline-h:         2px;
  --tab-underline-color:     var(--theme-accent, var(--accent));
  --tab-badge-bg:            var(--danger);
  --tab-badge-fg:            var(--text-on-danger, #fff);

  /* ── 1.4: Deletion status pásek ── */
  --status-band-pending:     rgba(245, 166, 35, 0.85);
  --status-band-deleted:     var(--tombstone-band);
}
```

**Akceptační:** `npm run lint:colors` nepadne; modré nebe vidí chipy v gold-amber, kyberpunk v default vars (testuje se ručně přes Storybook gallery).

### 3.2 Adresářová struktura — refactor

**Změna:** `src/features/admin/users/` → `src/features/users/` (přesun + rozšíření).

```
src/features/users/
├── api/
│   ├── useAdminUsers.ts          ← přesun z admin/users/api (admin endpoints zachovat)
│   ├── usePublicUsers.ts         ← nový (GET /api/users) — používá tab Uživatelé i Adresář
│   ├── usePublicUserProfile.ts   ← nový (GET /api/users/:id)
│   ├── usePendingActions.ts      ← nový (list pending per type)
│   └── usePendingActionsCount.ts ← nový (count per role)
├── pages/
│   └── UsersPage.tsx             ← refactor z AdminUsersPage (4 taby, role-aware)
├── components/
│   ├── UsersPageTabs.tsx         ← nový (tab nav s role visibility logic)
│   ├── tabs/
│   │   ├── FriendsTab/
│   │   │   ├── FriendsTab.tsx    ← kostra (placeholder)
│   │   │   └── EmptyFriends.tsx
│   │   ├── UsersTab/
│   │   │   ├── UsersTab.tsx           ← view-toggle + sdílený search/filter
│   │   │   ├── ViewToggle.tsx         ← segmented control Karty/Tabulka
│   │   │   ├── CardsGrid.tsx          ← grid karet
│   │   │   ├── UserCard.tsx           ← jednotlivá karta
│   │   │   ├── UserCardKebabMenu.tsx  ← kebab dropdown / bottom sheet
│   │   │   ├── UsersTable.tsx         ← přesun z 1.3b admin/users/components/UsersTab/
│   │   │   ├── UsersFilters.tsx       ← přesun z 1.3b
│   │   │   └── BulkToolbar.tsx        ← přesun z 1.3b (jen v Tabulka módu)
│   │   ├── ZpracovatTab/
│   │   │   ├── ZpracovatTab.tsx
│   │   │   ├── PendingActionCard.tsx  ← univerzální shell
│   │   │   ├── rendererRegistry.tsx   ← map<PendingActionType, Renderer>
│   │   │   ├── UsernameRequestRenderer.tsx  ← první konkrétní renderer (přesun logiky z 1.3b RequestsTable)
│   │   │   ├── EmptyZpracovat.tsx     ← placeholder per role
│   │   │   └── PlaceholderZpracovat.tsx ← „X bude dostupné s krokem Y"
│   │   └── AuditTab/
│   │       └── AuditTab.tsx       ← přesun z admin/users/components/AuditLogTab + reuse
│   ├── PublicProfile/
│   │   ├── PublicProfileHeader.tsx
│   │   ├── PublicBioSection.tsx
│   │   ├── PublicCharacterSection.tsx
│   │   ├── PublicProfileActions.tsx
│   │   ├── SelfProfileBanner.tsx
│   │   └── TombstoneBanner.tsx        ← admin overlay pro deleted profil
│   └── shared/
│       ├── RoleChip.tsx               ← jednotná komponenta (UserCard + profile + tabulka)
│       └── DeletionOverlay.tsx        ← status pásek pending/deleted (reuse v kartě + profilu)
└── pages/
    └── PublicUserProfilePage.tsx      ← naplnění stávajícího stubu (z src/features/ikaros/pages)
```

**Pozn.:** Komponenty z 1.3b se nepředělávají — jen se přesouvají do nového directory a importy aktualizují (router, IkarosLayout).

### 3.3 Router změny

**Soubor:** `src/app/router.tsx`

- **Odstranit RoleGuard z `/ikaros/uzivatele`** (page sama řeší tab visibility) — zůstává jen `requireAuth`.
- **`/ikaros/uzivatel/:id`** zůstává `requireAuth`.
- Lazy imports update:
  ```ts
  const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
  const PublicUserProfilePage = lazy(() => import('@/features/users/pages/PublicUserProfilePage'));
  ```
- Stub `UserProfilePage.tsx` v `src/features/ikaros/pages` smazat (nahradí `PublicUserProfilePage`).
- `AdminUsersPage.tsx` v `src/features/admin/users/pages` smazat po dokončení migrace.

### 3.4 IkarosLayout — adaptivní pravý panel link

**Soubor:** `src/app/layout/IkarosLayout/IkarosLayout.tsx` (line ~180)

**Změna:**
- Místo if/else na admin → buď „Uživatelé" nebo „Přátelé"
- Cíl URL **stejný** `/ikaros/uzivatele` (default tab se vyřeší v page)
- Přidat badge s pending count přes `usePendingActionsCount()`

```tsx
const { data: pendingCount } = usePendingActionsCount();
const isAdmin = currentUser?.role === UserRole.Superadmin || currentUser?.role === UserRole.Admin;
const label = isAdmin ? 'Uživatelé' : 'Přátelé';

<Link to="/ikaros/uzivatele" className={s.navItem}>
  <span className={s.navItemIcon}><Users size={18} /></span>
  <span className={s.navItemLabel}>{label}</span>
  {pendingCount && pendingCount.total > 0 && (
    <span className={s.navItemBadge} data-pulse={prevCount === 0 && pendingCount.total > 0}>
      {pendingCount.total}
    </span>
  )}
</Link>
```

### 3.5 UsersPage — tab orchestrátor

**Soubor:** `src/features/users/pages/UsersPage.tsx`

```tsx
type Tab = 'pratele' | 'uzivatele' | 'zpracovat' | 'audit';

function visibleTabs(role: UserRole): Tab[] {
  if (role === UserRole.Superadmin || role === UserRole.Admin) {
    return ['pratele', 'uzivatele', 'zpracovat', 'audit'];
  }
  return ['pratele', 'zpracovat'];
}

function defaultTab(role: UserRole): Tab {
  return (role === UserRole.Superadmin || role === UserRole.Admin) ? 'uzivatele' : 'pratele';
}

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const me = useAtomValue(currentUserAtom);
  const role = me?.role ?? UserRole.Hrac;

  const requestedTab = params.get('tab') as Tab | null;
  const allowed = visibleTabs(role);
  const tab: Tab = requestedTab && allowed.includes(requestedTab)
    ? requestedTab
    : defaultTab(role);

  // pokud uživatel přijde na nedostupný tab, silent redirect na default
  useEffect(() => {
    if (requestedTab && !allowed.includes(requestedTab)) {
      toast.error('Nemáš oprávnění k tomuto tabu');
      const newParams = new URLSearchParams(params);
      newParams.set('tab', defaultTab(role));
      setParams(newParams, { replace: true });
    }
  }, [requestedTab, allowed, role]);

  return (
    <div className={s.page}>
      <UsersPageTabs tab={tab} visibleTabs={allowed} onChange={(t) => /* update params */} />
      {tab === 'pratele' && <FriendsTab />}
      {tab === 'uzivatele' && <UsersTab />}
      {tab === 'zpracovat' && <ZpracovatTab role={role} />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}
```

### 3.6 UsersTab — view-toggle + reuse 1.3b kódu

**Klíčové:**
- Karty mód renderuje `<CardsGrid />` přes `usePublicUsers()` (nový endpoint).
- Tabulka mód renderuje `<UsersTable />` přes `useAdminUsers()` (existující z 1.3b).
- **Search/sort/filtry sdílené** mezi módy přes shared URL params.
- View switch → URL aktualizace, žádný unmount jednoho módu (pokud možné, použít `<Suspense>` boundary per mód aby data zůstala v cache).

**Sort fallback při view switch tabulka → karty** (rozhodnutí §12.6):
```ts
const ALLOWED_CARDS_SORT = ['new', 'abc'];
// při přepnutí tabulka → karty pokud sort není mezi allowed, set 'new'
```

### 3.7 PendingActionCard + renderer registry

**`PendingActionCard.tsx`** — univerzální shell:
```tsx
type PendingActionCardProps = {
  type: PendingActionType;
  item: unknown;  // typed via discriminated union by type
  onResolve?: () => void;
};

export function PendingActionCard({ type, item, onResolve }: PendingActionCardProps) {
  const renderer = REGISTRY[type];
  if (!renderer) return null;
  return (
    <div className={s.card}>
      <div className={s.left}>{renderer.L(item)}</div>
      <div className={s.mid}>{renderer.Mid(item)}</div>
      <div className={s.right}>{renderer.Actions(item, { onResolve })}</div>
    </div>
  );
}
```

**`rendererRegistry.tsx`** — central registry, exportuje `REGISTRY`. V 1.4 obsahuje jen `username_request`. Další fáze (1.8, 2.4, 3.x) přidají své rendery sem.

**`UsernameRequestRenderer.tsx`** — přesun logiky z `RequestsTable.tsx` (1.3b) do renderer formátu.

### 3.8 PublicUserProfilePage — naplnění stubu

**Soubor:** `src/features/users/pages/PublicUserProfilePage.tsx`

Layout (viz design §8):
1. `<SelfProfileBanner />` (jen pokud `params.id === me.id`)
2. `<PublicProfileHeader profile={profile} />`
3. `<PublicBioSection bio={profile.bio} />` (skrytá pokud bio === null)
4. `<PublicCharacterSection character={profile.character} />` (skrytá pokud null)
5. `<PublicProfileActions profile={profile} isAdmin={isAdmin} isSelf={isSelf} />`
6. Pokud `profile.deleted || profile.pendingDeletion` (admin view) → `<TombstoneBanner />` v header overlay

404 handling:
- `usePublicUserProfile(id)` vrátí 404 → render `<NotFoundPage>` s textem „Tento uživatel neexistuje nebo byl odstraněn."
- 401 → axios interceptor (1.1) provede force logout

### 3.9 RoleChip komponenta

**Soubor:** `src/features/users/components/shared/RoleChip.tsx`

```tsx
type RoleChipProps = {
  role: UserRole;
  size?: 'sm' | 'md';
  tooltip?: boolean;
};

const CHIP_CONFIG: Record<UserRole, { label: string; longLabel: string; icon: LucideIcon; tokenPrefix: string } | null> = {
  [UserRole.Superadmin]: { label: 'Superadmin', longLabel: 'Superadmin', icon: ShieldAlert, tokenPrefix: 'superadmin' },
  [UserRole.Admin]:      { label: 'Admin',      longLabel: 'Admin',      icon: Shield, tokenPrefix: 'admin' },
  [UserRole.SpravceClanku]:  { label: 'Články',  longLabel: 'Správce článků',  icon: FileText, tokenPrefix: 'spravce-clanku' },
  [UserRole.SpravceGalerie]: { label: 'Galerie', longLabel: 'Správce galerie', icon: Image, tokenPrefix: 'spravce-galerie' },
  [UserRole.SpravceDiskuzi]: { label: 'Diskuze', longLabel: 'Správce diskuzí', icon: MessageSquare, tokenPrefix: 'spravce-diskuzi' },
  [UserRole.PJ]:   null,
  [UserRole.Hrac]: null,
};

export function RoleChip({ role, size = 'md', tooltip = true }: RoleChipProps) {
  const cfg = CHIP_CONFIG[role];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(s.chip, s[`chip--${cfg.tokenPrefix}`], size === 'sm' && s.sm)}
      title={tooltip ? cfg.longLabel : undefined}
    >
      <Icon size={size === 'sm' ? 10 : 12} aria-hidden />
      <span>{cfg.label}</span>
    </span>
  );
}
```

**CSS modules** mapují `chip--{prefix}` na CSS proměnné:
```css
.chip--superadmin { background: var(--role-superadmin-bg); color: var(--role-superadmin-fg); }
.chip--admin      { background: var(--role-admin-bg);      color: var(--role-admin-fg); }
.chip--spravce-clanku   { background: var(--role-spravce-clanku-bg);   color: var(--role-spravce-clanku-fg); }
/* ... */
```

### 3.10 FE testy

- `RoleChip.spec.tsx` — render pro každou roli, fallback pro Hrac/PJ (null), tooltip text
- `UsersPage.spec.tsx` — tab visibility per role (Hrac vidí 2, Admin vidí 4), URL params syncing, silent redirect při nedostupném tabu
- `UserCard.spec.tsx` — chip rendering, kebab opening, hover state, deleted overlay
- `UserCardKebabMenu.spec.tsx` — položky per role, destructive separator, keyboard a11y
- `ViewToggle.spec.tsx` — switch + URL update + sort fallback
- `PendingActionCard.spec.tsx` — registry rendering, unknown type returns null
- `UsernameRequestRenderer.spec.tsx` — approve/reject mutations
- `PublicUserProfilePage.spec.tsx` — self banner, disabled buttons, admin „Otevřít v administraci", 404 fallback
- `usePublicUsers.spec.ts` — query param serialization, includeDeleted only for admin
- `usePublicUserProfile.spec.ts` — 404 handling, admin pending flag
- `usePendingActionsCount.spec.ts` — query key, staleTime, socket invalidace

---

## 4. Migrace existujícího kódu (přesun 1.3b → 1.4)

### 4.1 Soubory k přesunu (rename + reorganizace)

| Z                                                                | Do                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/admin/users/api/useAdminUsers.ts`                  | `src/features/users/api/useAdminUsers.ts` (admin queries zachovat)     |
| `src/features/admin/users/components/UsersTab/UsersTable.tsx`    | `src/features/users/components/tabs/UsersTab/UsersTable.tsx`           |
| `src/features/admin/users/components/UsersTab/UsersFilters.tsx`  | `src/features/users/components/tabs/UsersTab/UsersFilters.tsx`         |
| `src/features/admin/users/components/UsersTab/BulkToolbar.tsx`   | `src/features/users/components/tabs/UsersTab/BulkToolbar.tsx`          |
| `src/features/admin/users/components/RequestsTab/`               | logika přesunuta do `tabs/ZpracovatTab/UsernameRequestRenderer.tsx`    |
| `src/features/admin/users/components/AuditLogTab/AuditLogTab.tsx` | `src/features/users/components/tabs/AuditTab/AuditTab.tsx`             |
| `src/features/admin/users/pages/AdminUsersPage.tsx`              | **smazat** (nahrazuje `src/features/users/pages/UsersPage.tsx`)         |
| `src/features/ikaros/pages/UserProfilePage.tsx`                  | **smazat** (nahrazuje `src/features/users/pages/PublicUserProfilePage.tsx`) |

### 4.2 Importy k aktualizaci

- `src/app/router.tsx` — lazy imports
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` — pravý panel link logika
- Jakékoliv další soubory, které importují z `src/features/admin/users/` — sjednotit do `src/features/users/`

### 4.3 Existující 1.3b modaly

- `AdminBanModal`, `AdminDeleteUserModal`, `RoleChangeDropdown` — přesun do `src/features/users/components/shared/modals/`? **Doporučuji ano** — používají je oba módy (tabulka i kebab). Případně nechat v `admin/users/` a importovat odtamtud — to je impl. detail, vyhodnotí se při implementaci.

### 4.4 Stávající FE testy z 1.3b

Aktualizovat importy v testech, žádné funkční změny:
- `src/features/admin/users/__tests__/*.spec.tsx` → `src/features/users/__tests__/*.spec.tsx`

---

## 5. Asset pipeline / Storybook

### 5.1 Storybook story pro RoleChip

Přidat `RoleChip.stories.tsx` — vizuální gallery všech 5 chipů přes všechna 21 témat. Reuse Storybook gallery setup z 1.0.

### 5.2 Storybook story pro UserCard

- Variants: default, hover, focus, deleted overlay, pending deletion overlay
- Per-theme rendering
- Mobile + desktop breakpoint

### 5.3 Žádné nové webp assety

Cornerstones jsou generic (1px border + token barvy) v default fallback. Per-theme cornerstones (heraldic diamond pro modré nebe, …) jsou **out of scope 1.4** — přidá se podle potřeby v decorations.css per téma (jako 1.0f vzor).

---

## 6. Pořadí prací — checklist

- [ ] **2.1** BE public users endpoints + DTO
- [ ] **2.2** BE PendingActionsModule infra
- [ ] **2.3** BE UsernameRequestProvider (přesun logiky z 1.3b)
- [ ] **2.4** BE testy (unit + e2e)
- [ ] **3.1** FE CSS tokens
- [ ] **3.2** FE adresářová struktura refactor (přesun souborů)
- [ ] **3.3** FE router změny
- [ ] **3.4** FE IkarosLayout adaptivní link + badge
- [ ] **3.5** FE UsersPage tab orchestrátor
- [ ] **3.9** FE RoleChip komponenta + CSS module (paralelně s UserCard)
- [ ] **3.6** FE UsersTab + ViewToggle + CardsGrid + UserCard + KebabMenu
- [ ] **3.7** FE ZpracovatTab + PendingActionCard + UsernameRequestRenderer + EmptyState/Placeholder
- [ ] **FriendsTab kostra** (placeholder grid)
- [ ] **AuditTab přesun**
- [ ] **3.8** FE PublicUserProfilePage + 5 sub-komponent
- [ ] **3.10** FE testy
- [ ] **5.1/5.2** Storybook stories
- [ ] **Mobile-desktop pass** (skill `mobil-desktop` — pravidlo base.md)
- [ ] **Contrast audit** (`npm run audit:contrast`) — projít všech 21 témat
- [ ] **Lint** (`npm run lint`, `npm run lint:colors`)
- [ ] **Build** (`npm run build`)
- [ ] **Smoke test** ručně: login jako Superadmin / Spravce / Hrac → ověřit tab visibility + funkčnost

---

## 7. Acceptance walkthrough — co musí fungovat na konci

### 7.1 Admin/Superadmin průchod
1. Login → header „UŽIVATELÉ" badge `•3` (3 pending username requests).
2. Pravý panel „Uživatelé" badge `•3` → klik → `/ikaros/uzivatele?tab=uzivatele`.
3. Vidí 4 taby: Přátelé / Uživatelé `selected` / Zpracovat `•3` / Audit.
4. Tab Uživatelé: view-toggle `▦ Karty` `selected`. Vidí grid karet s rolemi (Superadmin chip gold, Admin chip brand, Spravce* chipy v amber/purple/teal).
5. Klik na kartu jiného uživatele → `/ikaros/uzivatel/:id` → veřejný profil.
6. Klik na svou kartu → `/ikaros/uzivatel/<me>` → veřejný profil se self bannerem.
7. Kebab na kartě → Otevřít profil / Změnit roli / Banovat / Smazat účet / Otevřít v tabulce.
8. View-toggle přepnout na `≡ Tabulka` → reuse 1.3b UsersTable s bulk akcemi.
9. Tab Zpracovat `•3` → vidí 3 PendingActionCard (username requests). Klik Schválit → karta se 1.5s fade-out, badge se decrement na `•2`.
10. Tab Audit → reuse AuditLogTab z 1.3b.

### 7.2 SpravceClanku průchod
1. Login → header „PŘÁTELÉ" žádný badge.
2. Pravý panel „Přátelé" → `/ikaros/uzivatele?tab=pratele`.
3. Vidí 2 taby: Přátelé `selected` / Zpracovat.
4. Tab Přátelé: kostra placeholder „Funkčnost přátel přijde v kroku 1.8".
5. Tab Zpracovat: placeholder „Schvalování článků bude dostupné s krokem 3.2".
6. Pokus o URL `?tab=uzivatele` → toast „Nemáš oprávnění" + redirect na `?tab=pratele`.

### 7.3 Hrac průchod
1. Login → pravý panel „Přátelé" → `/ikaros/uzivatele?tab=pratele`.
2. Vidí 2 taby (Přátelé / Zpracovat), oba placeholder.
3. Klik na avatar v chatu (4.x, mimo rozsah 1.4) povede na `/ikaros/uzivatel/:id` — v 1.4 ručně otestovat zadáním URL.

### 7.4 Anon průchod
1. URL `/ikaros/uzivatele` → redirect na úvodník s `?openLogin=1`.
2. URL `/ikaros/uzivatel/:id` → totéž.

---

## 8. Tracked dluhy a follow-ups

**Uzavře se v 1.4:**
- **D-029** (admin detail link uživatele) — vyřešeno přes „Otevřít v administraci" + `?focus=:id`.
- **D-040** principiálně — tombstone v public adresáři nezobrazujeme, řešíme per-obsah.

**Otevřené (zůstávají):**
- **D-044** (nový) — search index (Mongo text index) pro `/api/users` pokud DB přeroste 10k uživatelů. Zatím regex.
- **D-045** (nový) — privacy toggle „skrýt mě v adresáři" — diskuse pro 1.7+.

**Nové dluhy z impl. plánu:**
- **D-046** — per-theme `RoleChip` overrides (kyberpunk → neonové varianty); 1.4 ponechává default colors univerzálně.
- **D-047** — Storybook gallery pro PendingActionCard renderers s mock daty (testovací nástroj pro 1.8/2.4/3.x rendery).

---

## 9. Závislosti k dořešení během implementace

- **Lucide ikona `ShieldAlert` vs. `ShieldStar`** — pokud Superadmin ikona neexistuje, použít `ShieldAlert` (varovný shield) nebo zkusit `BadgeAlert`. Vyhodnotí se při implementaci RoleChip.
- **Pulse animace badge** v IkarosLayout — keyframes `@keyframes badgePulse` + `prefers-reduced-motion` respekt.
- **Socket events** — `friend:request` push do `usePendingActionsCount` cache invalidace (zatím jen client polling 30s, socket bude relevantní v 1.8).

---

## 10. Po dokončení

1. Změnit status spec-1.4.md a plan-1.4.md na „✅ Hotovo".
2. Roadmap 1.4 checkboxy přepnout na ✅.
3. Update memory: případný `feedback_zpracovat_pattern.md` pokud při implementaci vznikne netriviální vzor.
4. Pull request s linkem na spec + design + plan.
