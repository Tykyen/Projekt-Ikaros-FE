# Spec 12.1 — Platform admin (`/admin`)

**Fáze:** 12 — Admin & nastavení
**Krok:** 12.1
**Stav:** 🟡 návrh ke schválení
**Datum:** 2026-06-02
**Role gate:** Superadmin / Admin

---

## 1. Účel

Nahradit stub `PlatformAdminPage` plnohodnotným **platformovým admin hubem** na `/admin` a **vyřešit dvojkolejnost** správy uživatelů. Většina FE i BE dílů existuje — krok je převážně **relokace** + **úklid** + **jedna BE dostavba** (platformové statistiky).

---

## 2. Výchozí stav (ověřeno v kódu 2026-06-02)

### Co JIŽ funguje (živé v `/ikaros/uzivatele`)
- **Správa uživatelů** — tabulka (`UsersTable`), bulk akce (`BulkToolbar`), ban/timed-ban (`BanModal`), změna role, plánované smazání (`AdminDeleteUserModal`), admin-permissions toggle (canManageAdmins / canModerateContent / canEditPlatformPages, Superadmin-only) — vše sdílené z `features/admin/users/`.
- **Audit log** — `AuditLogTab` (re-export jako `AuditTab`).
- **Schvalování username** — `UsernameRequestRenderer` v **Zpracovat** queue (pending-actions, 8 typů).
- **Hooky** — `useAdminUsers`, `useAdminUsernameRequests`, `useAdminAuditLog`.

### Co je STUB / redundantní sirotek
- `PlatformAdminPage` — `<div>[stub]</div>`, zapojený na `/admin` (RoleGuard Superadmin/Admin).
- `AdminUsersPage` — **nezapojený** page wrapper, duplikuje to, co umí `/ikaros/uzivatele`.
- `UsersFilters` — používá jen `AdminUsersPage`.
- `RequestsTable` — **starší** schvalování username, duplikuje `UnameRequestRenderer` v Zpracovat queue.

### BE gap
- `stats` modul umí jen search index (`GET/POST /api/stats/search…`). **Chybí** endpoint pro platformové statistiky.

---

## 3. Cílová informační architektura

| Surface | Role | Obsah |
|---|---|---|
| **`/admin`** | Superadmin / Admin | **Přehled** (statistiky + rozcestník) · **Uživatelé** (tabulka + filtry + bulk + ban + role + delete + admin-perms) · **Audit log** |
| **`/ikaros/uzivatele`** | všichni přihlášení | **Přátelé** · **Uživatelé** (jen veřejné karty = komunitní adresář) · **Zpracovat** (pending-actions vč. schvalování username) |

💡 **Princip dělení:** „Uživatelé–karty" = komunitní adresář (procházení, žádost o přátelství) → patří běžnému uživateli. „Uživatelé–tabulka" = správa → patří adminovi pod `/admin`. Schvalování username zůstává v **Zpracovat** queue (kanonické místo pro akce vyžadující rozhodnutí příjemce) — `/admin` na něj jen odkazuje s počtem.

### Odchylka od roadmapy
- **12.1e „Username requests (RequestsTab) → zapojit pod /admin":** NErealizujeme jako samostatný admin tab. Schvalování username je už kanonicky v **Zpracovat** queue (`UsernameRequestRenderer`). Redundantní `RequestsTable` **smažeme**. `/admin` Přehled zobrazí počet pending + odkaz do Zpracovat.
- *Rationale:* dva paralelní UI pro tutéž akci = přesně ta dvojkolejnost, kterou krok odstraňuje.

---

## 4. Funkční rozsah

### 12.1a — Admin hub + dashboard (Přehled)
- Nová stránka `/admin` se 3 taby: **Přehled** (default) · **Uživatelé** · **Audit log**.
- **Přehled** = karty statistik + rozcestník:
  - **Uživatelé:** celkem · online (z presence) · noví za 7 dní · pending smazání
  - **Světy:** celkem
  - **Obsah:** články · galerie (obrázky) · diskuze
  - **Fronta:** pending akce celkem (odkaz → `/ikaros/uzivatele?tab=zpracovat`) · pending username žádosti
  - Rozcestník: rychlé odkazy na Uživatelé tab, Audit log, Zpracovat, (13.1c index monitoring — placeholder „připravujeme").
- **BE dostavba:** `GET /api/admin/stats/overview` (RoleGuard Admin+) → agregát viz §6.

### 12.1b — Správa uživatelů (relokace)
- Tab **Uživatelé** na `/admin` hostuje `UsersTable` + filtry (search / role / hasPendingDeletion / includeDeleted) + paginaci.
- Reuse sdílených komponent `features/admin/users/` (žádné nové). Filtr UI: použít `UsersFilters` (přesunout z orphan page sem) NEBO inline toolbar — viz design audit.
- Plná funkčnost: změna role (hierarchie), ban/unban (timed), plánované smazání (30denní hold), kebab akce.

### 12.1c — Admin permissions
- Granular toggle (canManageAdmins / canModerateContent / canEditPlatformPages), Superadmin-only — **už v kebabu** `UsersTable`. Dostupné na `/admin` Uživatelé bez nové práce. Ověřit fungování po relokaci.

### 12.1d — Bulk akce
- `BulkToolbar` (ban / unban / role-change, per-user hierarchy check) — **už součást** `UsersTable`. Dostupné na `/admin` Uživatelé. Ověřit.

### 12.1e — Audit log (relokace) + username requests (odkaz)
- Tab **Audit log** na `/admin` = `AuditLogTab` (přesun, beze změn funkce).
- Username requests: bez samostatného tabu (viz §3 odchylka), Přehled odkáže na Zpracovat.

### 12.1f — Konsolidace + úklid
- Z `/ikaros/uzivatele` **odstranit** admin taby: `audit`, `friendship-debug` (debug → ponechat jen dev? viz §8), a z tabu **Uživatelé** odstranit ViewToggle + tabulkový mód (zůstanou jen **karty** pro všechny).
- `usersPageTabs.helpers.ts` — `visibleTabsForRole` vrací pro všechny role `['pratele', 'uzivatele', 'zpracovat']`; admin už nemá audit tab tady.
- **Smazat redundantní sirotky:** `AdminUsersPage.tsx`, `UsersFilters` (pokud nepřesunut do /admin), `RequestsTable` + `RejectRequestModal` (pokud nepoužité jinde — ověřit), `AuditTab.tsx` re-export (přepojit přímý import).
- **Redirect** starých admin URL: `/ikaros/uzivatele?tab=audit` → `/admin?tab=audit` (best-effort; min. tab už není ve `visible`, takže silent fallback na default).
- Header/nav: zajistit odkaz na `/admin` pro Admin+ (ověřit, že existuje v `IkarosLayout`).
- `mobil-desktop` audit nové `/admin` stránky.
- `napoveda` — aktualizovat (přesun správy uživatelů pod `/admin`).

---

## 5. Komponenty a soubory

### Nové (FE)
- `src/features/admin/pages/PlatformAdminPage.tsx` — přepsat stub → hub se 3 taby (URL `?tab=prehled|uzivatele|audit`, default `prehled`).
- `src/features/admin/components/OverviewTab/` — dashboard (karty statistik + rozcestník).
- `src/features/admin/components/OverviewTab/StatCard.tsx` — karta metriky (label, hodnota, ikona, volitelný odkaz).
- `src/features/admin/api/useAdminStats.ts` — hook na `GET /api/admin/stats/overview`.

### Přesun / reuse (FE)
- `UsersTable`, `UsersFilters`, `BulkToolbar`, `BanModal`, `AdminDeleteUserModal`, `AuditLogTab` — zůstávají v `features/admin/users/`, konzumuje je nový hub.
- Hooky `useAdminUsers`, `useAdminUsernameRequests`, `useAdminAuditLog` — beze změny.

### Smazat (FE)
- `src/features/admin/users/pages/AdminUsersPage.tsx`
- `src/features/users/components/tabs/AuditTab/AuditTab.tsx` (re-export — nahradit přímým importem v hubu)
- `src/features/users/components/tabs/UsersTab/ViewToggle.tsx` + tabulkový mód v `UsersTab.tsx` (zůstanou karty)
- `RequestsTable` + `RejectRequestModal` — **jen pokud** grep potvrdí 0 dalších referencí
- `UsersFilters` — **jen pokud** nebude přesunut do /admin toolbaru

### Upravit (FE)
- `src/features/users/pages/UsersPage.tsx` — odebrat `audit`, `friendship-debug` renderování (dle §8).
- `src/features/users/components/usersPageTabs.helpers.ts` — sjednotit `visibleTabsForRole` na 3 taby pro všechny.
- `src/features/users/components/tabs/UsersTab/UsersTab.tsx` — odebrat ViewToggle + tableQuery + includeDeleted (admin-only zbytky), zůstane jen `CardsGrid` + search + sort.

### Nové (BE)
- `backend/src/modules/admin/…` — endpoint `GET /api/admin/stats/overview` + service agregace + DTO `AdminStatsOverview`. (Umístit do `admin` modulu, ne `stats` — `stats` je doménově search.)

---

## 6. BE kontrakt — `GET /api/admin/stats/overview`

**Guard:** `JwtAuthGuard` + `RolesGuard([Superadmin, Admin])`
**Throttle:** 30/min
**Response 200:**
```ts
interface AdminStatsOverview {
  users: {
    total: number;          // bez tombstone
    online: number;         // z OnlinePresenceRegistry
    newLast7Days: number;   // createdAt >= now-7d
    pendingDeletion: number;// deletionRequestedAt != null, !isDeleted
  };
  worlds: { total: number };
  content: {
    articles: number;       // ikaros-articles
    galleryImages: number;  // gallery
    discussions: number;    // discussions
  };
  queue: {
    pendingActionsTotal: number;   // agregát z PendingActions
    pendingUsernameRequests: number;
  };
  generatedAt: string;      // ISO
}
```
- Agregace: `countDocuments` přes příslušné repozitáře (users, worlds, articles, gallery, discussions, username-requests) + presence registry size. Online počet = jen pro snapshot, ne realtime push (dashboard není live).
- **Robustnost:** každý dílčí count v try/catch → při chybě modulu vrať `0` pro tu metriku, ne 500 celé odpovědi (dashboard se nesmí rozbít kvůli jednomu modulu).

⚠️ **BE+FE se neimplementuje v jedné paralelní dávce** (memory `feedback_no_mixed_be_fe_batch`) — BE endpoint první, ověřit, pak FE hook.

---

## 7. Auth / chování
- `/admin` route už má RoleGuard `[Superadmin, Admin]` — zachovat.
- 401/403/404 dle `auth-leak-policy` (spustit `auth-policy` skill při implementaci hooku).
- Non-admin pokus o `/admin` → existující 403 stránka (RoleGuard).

---

## 8. Otevřené detaily k rozhodnutí v plánu
1. **`friendship-debug` tab** — dnes admin-only v `/ikaros/uzivatele`. Návrh: ponechat jen v dev buildu (`import.meta.env.DEV`), nebo přesunout pod `/admin`. *Default:* ponechat dev-only v `/ikaros/uzivatele` (mimo rozsah konsolidace, není to admin nástroj).
2. **`UsersFilters` osud** — přesunout do `/admin` toolbaru (reuse) vs. inline toolbar. *Default:* reuse `UsersFilters` (méně práce, konzistence).
3. **Redirect starých URL** — explicitní redirect `?tab=audit` → `/admin` vs. spoléhat na silent fallback. *Default:* silent fallback (tab už není visible) + odkaz z Přehledu.

---

## 9. Mimo rozsah
- 12.2 World headline/menu builder (samostatná spec).
- 13.1c Index monitoring (search rebuild/reindex UI) — jen placeholder odkaz, plná impl. ve fázi 13.
- Live/realtime dashboard (snapshot stačí).
- Notifikace, granular permission framework rozšíření (D-031), audit canManageAdmins (D-030).

---

## 10. Definition of Done
- [ ] `/admin` 3 taby funkční (Přehled / Uživatelé / Audit), RoleGuard.
- [ ] `GET /api/admin/stats/overview` + BE testy (agregace, role gate 403, robustnost při chybě modulu).
- [ ] Dashboard zobrazuje reálné metriky.
- [ ] `/ikaros/uzivatele` zredukováno na Přátelé / Uživatelé-karty / Zpracovat.
- [ ] Redundantní sirotci smazáni (`AdminUsersPage`, `AuditTab` re-export, ViewToggle/table mód; `RequestsTable`/`UsersFilters` dle grep).
- [ ] FE testy (hub render dle role, stats hook, redukce tabů).
- [ ] `tsc` ✓ `lint` ✓ `lint:colors` ✓ `build` ✓ `test:run` ✓ (FE), BE testy ✓.
- [ ] `mobil-desktop` audit `/admin`.
- [ ] `napoveda` aktualizováno.
- [ ] roadmap-fe.md 12.1 zaškrtnuto.
```
