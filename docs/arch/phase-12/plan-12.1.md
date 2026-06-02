# Plán 12.1 — Platform admin (`/admin`)

**Spec:** [spec-12.1.md](./spec-12.1.md) ✅ schváleno 2026-06-02
**Design audit:** ✅ token-based, reuse `Tabs` + `IkarosCard`/`CornerOrnament`, žádné nové fonty/barvy
**Pravidlo:** BE a FE se **neimplementují v jedné paralelní dávce** (memory `feedback_no_mixed_be_fe_batch`). Pořadí fází je závazné.

---

## Fáze A — BE: endpoint platformových statistik

**Cíl:** `GET /api/admin/stats/overview` v `admin` modulu (ne `stats`).

1. **DTO** `backend/src/modules/admin/dto/admin-stats-overview.dto.ts` — interface dle spec §6 (`users`/`worlds`/`content`/`queue`/`generatedAt`).
2. **Service** `AdminStatsService` (nebo metoda v `AdminService`) `getOverview()`:
   - `users.total` — `usersRepo.countActive()` (bez tombstone: `isDeleted != true`).
   - `users.online` — `OnlinePresenceRegistry.size()` (online userIds count).
   - `users.newLast7Days` — `countDocuments({ createdAt >= now-7d, isDeleted != true })`.
   - `users.pendingDeletion` — `countDocuments({ deletionRequestedAt != null, isDeleted != true })`.
   - `worlds.total` — `worldsRepo.count()`.
   - `content.articles` / `galleryImages` / `discussions` — count přes příslušné repozitáře.
   - `queue.pendingActionsTotal` — agregát z `PendingActions` (suma přes providery, bez user-scope — admin globální? viz pozn.).
   - `queue.pendingUsernameRequests` — `usernameRequestsRepo.count({ status: 'pending' })`.
   - **Každý count v `try/catch` → fallback `0`** (jeden modul nesmí shodit dashboard). Logovat warning.
3. **Controller** `admin.controller.ts` — `@Get('stats/overview')`, guards `JwtAuthGuard + RolesGuard([Superadmin, Admin])`, throttle 30/min.
4. **DI** — doplnit chybějící repo injecty + `OnlinePresenceRegistry` do `AdminModule` (ověřit exporty z `PresenceModule`, `WorldsModule`, content modulů; případně `forwardRef`).
5. **Testy** `admin-stats.service.spec.ts` + controller e2e:
   - agregace vrací správný shape,
   - role gate 403 pro ne-admina,
   - **robustnost:** když jeden repo `throw`, metrika = 0 a response je 200.
6. **Ověřit** ručně (`nest --watch` / restart — memory `feedback_be_restart_required`): `GET /api/admin/stats/overview` vrací JSON.

> ⚠️ **pendingActionsTotal scope:** PendingActions je dnes per-recipient queue. Pro admin dashboard chceme *globální* počet adminských pending (username requests + content review), ne osobní frontu. Rozhodnutí: dashboard ukáže **`pendingUsernameRequests`** jako konkrétní číslo + odkaz „Zpracovat" (osobní queue count si admin vidí v badge tabu). `pendingActionsTotal` = vynechat z v1 pokud agregace přes providery není levná; v plánu označit volitelné. **→ implementuju `pendingUsernameRequests` jistě, `pendingActionsTotal` jen pokud existuje levný agregátor.**

**Checkpoint A:** BE endpoint funguje + testy zelené → teprve pak Fáze B.

---

## Fáze B — FE: `/admin` hub + dashboard

1. **Typy** `src/features/admin/api/adminStats.types.ts` — `AdminStatsOverview` (zrcadlo BE DTO; spustit `type-sync` skill).
2. **Hook** `src/features/admin/api/useAdminStats.ts` — TanStack Query `GET /api/admin/stats/overview`, `staleTime` ~60 s.
3. **StatCard** `src/features/admin/components/OverviewTab/StatCard.tsx` (+ `.module.css`):
   - props: `label`, `value`, `icon` (lucide), `to?` (route/tab odkaz), `tone?` (default / accent).
   - tokeny: `--surface-1`, `--frame-border`, `--depth-card` + hover `--depth-card-hover`, `--radius-lg`, číslo `--text-3xl`/`--font-display`/`--text-strong`, label `--text-sm` dim.
   - klikací varianta = `<Link>` wrapper; staggered `--stat-index` pro animation-delay.
4. **OverviewTab** `src/features/admin/components/OverviewTab/OverviewTab.tsx` (+ css):
   - 4 sekce (Uživatelé / Světy / Obsah / Fronta), každá nadpis (`--font-display`) + grid stat-karet `repeat(auto-fill, minmax(180px,1fr))`.
   - **Rozcestník** — akční karty: „Správa uživatelů" (→ `?tab=uzivatele`), „Audit log" (→ `?tab=audit`), „Zpracovat fronta" (→ `/ikaros/uzivatele?tab=zpracovat`), „Index vyhledávání" (placeholder, disabled, „připravujeme 13.1").
   - loading → skeleton karty; error → karty s `0` + jemný inline warning.
   - mobil ≤768: grid 2 sl., ≤480: 1 sl.
5. **PlatformAdminPage** `src/features/admin/pages/PlatformAdminPage.tsx` — přepsat stub:
   - sdílený `<Tabs>` se 3 taby (`prehled` default / `uzivatele` / `audit`), URL `?tab=`.
   - `prehled` → `<OverviewTab>`; `uzivatele` → `<UsersAdminTab>` (viz Fáze C); `audit` → `<AuditLogTab>` (přímý import z `features/admin/users`).
   - `mobil-desktop` skill po dokončení vizuálu.
6. **auth-policy** skill — ověřit 401/403 handling hubu (RoleGuard už je na route, hook musí snést 403 gracefully).

**Checkpoint B:** `/admin` se 3 taby, dashboard ukazuje reálná data.

---

## Fáze C — FE: relokace správy uživatelů + konsolidace

1. **`UsersAdminTab`** `src/features/admin/components/UsersAdminTab/UsersAdminTab.tsx`:
   - přenést logiku tabulkového módu z dnešního `features/users/.../UsersTab.tsx` (admin větev): `useAdminUsers` + filtry + `UsersTable` (+ bulk + ban + kebab + paginace).
   - filtr UI: reuse `UsersFilters` (přesunout referenci sem) — search / role / hasPendingDeletion / includeDeleted.
2. **Zúžit komunitní `UsersTab`** `src/features/users/components/tabs/UsersTab/UsersTab.tsx`:
   - odstranit `ViewToggle`, `tableQuery`/`useAdminUsers`, `includeDeleted`, admin větve → zůstává jen `CardsGrid` + search + sort + paginace karet.
3. **`usersPageTabs.helpers.ts`** — `visibleTabsForRole` vrací pro **všechny** `['pratele', 'uzivatele', 'zpracovat']`; odstranit `audit` a `friendship-debug` z admin větve (debug → krok 4).
4. **`UsersPage.tsx`** — odebrat render `audit` (`AuditTab`) a `friendship-debug` (viz krok 4); `TAB_TITLES` zúžit.
5. **`friendship-debug`** (spec §8 default): ponechat dostupné jen v dev — render jen když `import.meta.env.DEV` (tab i route). Není admin nástroj, mimo /admin.
6. **Smazat redundantní sirotky** (po grep ověření 0 referencí):
   - `src/features/admin/users/pages/AdminUsersPage.tsx` + `AdminUsersPage.module.css`
   - `src/features/users/components/tabs/AuditTab/AuditTab.tsx` (re-export → nahrazen přímým importem v hubu)
   - `src/features/users/components/tabs/UsersTab/ViewToggle.tsx`
   - `RequestsTable` + `RejectRequestModal` — **jen pokud** grep `RequestsTable`/`RejectRequestModal` = 0 jinde (schvalování username žije v `UsernameRequestRenderer`).
   - `UsersFilters` — **NEmazat**, přesouvá se do `UsersAdminTab`.
7. **Nav odkaz na `/admin`** — ověřit/ doplnit v `IkarosLayout` headeru/sidebaru pro Admin+ (dnes „UŽIVATELÉ" míří na `/ikaros/uzivatele`; přidat/odlišit „ADMINISTRACE" → `/admin`).
8. **Redirect** — spoléhat na silent fallback (`audit` už není visible → fallback na default). Volitelně explicitní redirect ze starého `?tab=audit`.

**Checkpoint C:** `/ikaros/uzivatele` = 3 taby (Přátelé/Uživatelé-karty/Zpracovat); admin nástroje jen pod `/admin`; sirotci pryč.

---

## Fáze D — Testy, audity, dokumentace

1. **FE testy:**
   - `PlatformAdminPage` — render 3 tabů, default tab, role.
   - `useAdminStats` / `OverviewTab` — render metrik, loading, error→0.
   - `usersPageTabs.helpers` — `visibleTabsForRole` = 3 taby všem.
   - `UsersTab` (komunitní) — už jen karty, žádný ViewToggle.
2. **Ověření:** `npx tsc --noEmit` · `npm run lint` · `npm run lint:colors` · `npm run test:run` · `npm run build` (FE). BE: `npm run test` + typecheck/lint (memory `feedback_be_precommit_prettier`).
3. **`mobil-desktop`** skill — `/admin` dashboard + zúžený `/ikaros/uzivatele`.
4. **`napoveda`** skill — přesun správy uživatelů pod `/admin`, nová stránka Administrace.
5. **`type-sync`** skill — `AdminStatsOverview` FE↔BE.
6. **Roadmap** `docs/roadmap-fe.md` — zaškrtnout 12.1a–f.
7. **Dluhy** — uzavřít relevantní (D-027 už uzavřen dříve; zkontrolovat D-030/D-031 zda se týkají), zapsat nové přes `dluh` skill pokud vzniknou.

---

## Soubory — souhrn

**Nové (FE):** `features/admin/api/{adminStats.types.ts,useAdminStats.ts}`, `features/admin/components/OverviewTab/{OverviewTab,StatCard}.tsx`+css, `features/admin/components/UsersAdminTab/UsersAdminTab.tsx`+css.
**Nové (BE):** `admin/dto/admin-stats-overview.dto.ts`, `admin/admin-stats.service.ts` (+ spec), endpoint v `admin.controller.ts`.
**Upravené (FE):** `PlatformAdminPage.tsx`, `users/.../UsersTab.tsx`, `usersPageTabs.helpers.ts`, `UsersPage.tsx`, `IkarosLayout` nav.
**Smazané (FE):** `AdminUsersPage.tsx`(+css), `AuditTab.tsx`, `ViewToggle.tsx`, (`RequestsTable`/`RejectRequestModal` dle grep).

---

## Rizika
- **DI v AdminModule** — agregace sahá do víc modulů; hrozí circular deps → řešit `forwardRef` nebo dedikovaný read-only repo provider. (Fáze A krok 4.)
- **Skrytá reference na mazané sirotky** — před `rm` vždy grep. (Fáze C krok 6.)
- **Zúžení komunitního `UsersTab`** — URL params `view/includeDeleted` mohou být v deep-lincích; po zúžení je ignorovat (žádný crash). Ověřit.
