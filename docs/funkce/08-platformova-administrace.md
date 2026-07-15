# 08 — Platformová administrace

Kódem ověřená inventura platformové administrace Projektu Ikaros. Pokrývá globální role, granulární admin oprávnění (D-033), admin panel (`/admin`) a všechny jeho taby, správu uživatelů, search index, globální emoty, GDPR export, systémové presety. (Dungeon builder se 21.3a přestěhoval do světa — kap. 14 §14.6.)

> Rozsah = jen GLOBÁLNÍ (platformová) administrace. Světové role (PJ / PomocnýPJ / Korektor / Hráč / Čtenář / Žadatel) jsou mimo tuto kapitolu.

---

## Role model (globální `UserRole`)

FE enum (`Projekt-ikaros-FE/src/shared/types/index.ts:6`) — po D-053 zúžen na 6 globálních rolí:

| Hodnota | Role | Popisek (CZ) |
|---|---|---|
| 1 | `Superadmin` | Superadmin |
| 2 | `Admin` | Admin |
| 9 | `Ikarus` | Ikarus (běžný uživatel) |
| 10 | `SpravceClanku` | Správce článků |
| 11 | `SpravceGalerie` | Správce galerie |
| 12 | `SpravceDiskuzi` | Správce diskuzí |

- **Platform-admin gate** = `role <= UserRole.Admin`, tj. jen role 1 a 2 (Superadmin, Admin). Vidět `AdminGuard` (`backend/src/common/guards/admin.guard.ts:17`).
- **Pořadí čísel je významné**: nižší číslo = vyšší moc. Proto `role > UserRole.Admin` = NENÍ admin.
- **Správci obsahu** (Clánky/Galerie/Diskuze) jsou globální obsahové role, ne admini — vidí jen svou frontu „Zpracovat", nemají přístup do `/admin`.
  - **Nově (20.1) = „správce komunity":** tři obsahové role dostaly navíc pravomoc moderovat **generickou** frontu nahlášeného obsahu (`content_report`) napříč VŠEMI plochami, nejen svou (`CONTENT_REVIEWER_ROLES` v `backend/src/modules/moderation/moderation.constants.ts:8`). Zásahy na úrovni účtu (M5–M7) a kategorie „ohrožení nezletilých" ale zůstávají jen Adminovi/Superadminovi. Viz sekce „Nahlašování & moderace obsahu" níže.
- **Ikarus** = běžný přihlášený uživatel. PJ/hráč jsou role uvnitř konkrétního světa (WorldRole), ne globální.

### ⚠️ Drift FE vs. BE enum
BE enum (`backend/src/modules/users/interfaces/user.interface.ts:1`) STÁLE obsahuje legacy world role `PJ=3, Korektor=4, Hrac=5, Ctenar=6, Zadatel=7, Zakaz=8`. FE je z enumu vyhodil. Migrace `migrate:d053` přemapuje historické DB hodnoty 3–7 na 9 (Ikarus). Žádný živý uživatel by tyto globální hodnoty mít neměl, ale enum drift je k vyčištění (dluh).

---

## Granulární admin oprávnění (D-033)

### Model
Definice `AdminPermissions` (`Projekt-ikaros-FE/src/shared/types/index.ts:21`, BE zrcadlo `backend/src/modules/users/interfaces/user.interface.ts:16`). Dva boolean flagy, default všechny `false` (třetí, mrtvý `canEditPlatformPages`, byl 2026-07-12 odstraněn z BE i FE — D-NEW-INV-CLEANUP):

| Flag | Co umožňuje | Kde se VYNUCUJE |
|---|---|---|
| `canManageAdmins` | Admin smí spravovat oprávnění JINÝCH Adminů | `admin.service.ts:614` (setAdminPermissions) |
| `canModerateContent` | Admin smí DELETE / UNDELETE cizí účet | `hierarchy.ts:99` (assertCanModerate) |

### Jak se přidělují
- Endpoint `PATCH /admin/users/:id/admin-permissions` (`admin.controller.ts:195`), gate `@Roles(Superadmin, Admin)`.
- Smí měnit: **Superadmin** vždy; **Admin** jen pokud má sám `canManageAdmins`.
- **Flag `canManageAdmins` smí přepnout JEN Superadmin** — Admin-manager smí delegovat jen `canModerateContent` (brání řetězovému šíření manage-práva, R-05). Viz `admin.service.ts:626`.
- Cíl musí mít roli `Admin` (jinak `NOT_ADMIN` 400). Granulární práva nemají smysl pro non-adminy.
- Nelze upravit sám sebe (`SELF_FORBIDDEN` 400).
- Merge je delta: aplikují se jen pole přítomná v requestu, ostatní zůstanou (`admin.service.ts:653`).
- Každá změna se auditi (`ADMIN_PERMISSIONS_CHANGE`).

### Hranice / pasti
- `canModerateContent` NEgatuje obsahovou moderaci (články/galerie/diskuze) — ta jede přes obsahové ROLE (viz níže), ne přes tento flag. Flag řídí JEN admin delete účtu.

---

## Platform Admin panel (`/admin`)

### Co to je
Centrální platformový admin hub se 6 taby (z toho 1 dev-only).
- **Kde:** route `/admin`, `Projekt-ikaros-FE/src/features/admin/pages/PlatformAdminPage.tsx`. Tab se drží v URL `?tab=`.
- **Kdo:** FE `RoleGuard roles={[Superadmin, Admin]}` (router.tsx:195). BE jednotlivé endpointy `AdminGuard` (role ≤ Admin).
- **Stav:** ✅

### Taby
1. **Přehled** (`?tab=prehled`) — dashboard se stat-kartami.
2. **Uživatelé** (`?tab=uzivatele`) — správa uživatelů.
3. **Smazané světy** (`?tab=smazane-svety`) — recovery soft-smazaných světů.
4. **Audit log** (`?tab=audit`) — moderátorský audit.
5. **Search index** (`?tab=search-index`) — monitoring + rebuild vyhledávání.
6. **Friendship debug** (`?tab=friendship-debug`) — **jen v DEV buildu** (`import.meta.env.DEV`), na produkci se tab vůbec nevykreslí.

> Pozn.: „Zpracovat" frontu (schvalování username/obsahu) panel ZÁMĚRNĚ neobsahuje — je to osobní fronta na `/ikaros/uzivatele?tab=zpracovat`, ne admin nástroj.

---

### Tab Přehled (dashboard)
- **Co to je:** snapshot platformových metrik ve 4 sekcích + rozcestník.
- **Kde:** `components/OverviewTab/OverviewTab.tsx`. Data z `GET /admin/stats/overview`.
- **Kdo:** FE pod RoleGuardem. BE `admin.controller.ts:58` `@UseGuards(AdminGuard)`.
- **Co ukazuje:**
  - Uživatelé: Celkem / Aktivní (online v okně `PRESENCE_THRESHOLD_HOURS`, default 25 h — pozor, karta tvrdí „24 h") / Noví (7 dní) / Čeká na smazání.
  - Světy: Celkem.
  - Obsah: Články / Obrázky v galerii / Diskuze.
  - Fronta: Žádosti o username (link na `/ikaros/uzivatele?tab=zpracovat`).
  - Rychlé odkazy: Správa uživatelů, Audit log, Zpracovat frontu, „Index vyhledávání" (DISABLED placeholder „Připravujeme fáze 13.1", i když search-index tab už funguje — kosmetický dluh).
- **Zvláštnosti:** každá metrika běží přes `safe()` — rozbitý modul vrátí 0 a zaloguje warning, dashboard nikdy nespadne (`admin-stats.service.ts:106`). Pod sekcemi metrik je sekce **Návštěvnost** (15B.7, viz níže).
- **Stav:** ✅
- **Kód:** FE `components/OverviewTab/OverviewTab.tsx`, BE `admin-stats.service.ts:46`.

---

### Návštěvnost — analytics (15B.7, sekce v Přehledu)
- **Co to je:** self-hosted měření návštěvnosti platformy (page views) — agregát pro provozovatele, žádná data o jednotlivých uživatelích. Žádná 3rd-party, žádné cookies → GDPR-čisté bez consent lišty.
- **Kde:** sekce „Návštěvnost" uvnitř tabu Přehled (`components/AnalyticsSection/AnalyticsSection.tsx`), NE samostatný tab. Data `GET /analytics/summary?days=7|30|90`.
- **Kdo:** FE pod RoleGuardem (Superadmin/Admin). BE `analytics.controller.ts` summary `@UseGuards(JwtAuthGuard, AdminGuard)`. Sběrový endpoint `POST /analytics/pageview` je VEŘEJNÝ (bez guardu — musí počítat i anon návštěvy), jen zapisuje, nic nevrací.
- **Co ukazuje:** karty Návštěvy / Návštěvníci / Podíl anonymních; denní trend (vlastní CSS sloupcový graf, žádný chart dep); top stránky (path → počet); zdroje (vyhledávač/sociální/interní/odkaz/přímo). Přepínač období 7/30/90 dní.
- **Jak se sbírá:** FE hook `usePageViewPing` (`Projekt-ikaros-FE/src/shared/analytics/usePageViewPing.ts`) mountovaný v IkarosLayout i WorldLayout → fire-and-forget `POST /analytics/pageview` na každou změnu routy. `sessionId` = anonymní nonce v sessionStorage (per-tab). Referrer se posílá jen při 1. pingu session (externí zdroj); interní prokliky → `internal`.
- **Co se ukládá (kolekce `analytics_events`):** path, kategorie zdroje (odvozená z referreru na BE), anonymní sessionId, `authed` flag, čas. **Žádné PII** — IP, user-agent ani userId se NEukládají. TTL index 90 dní (Mongo maže sama, žádný cron).
- **Bot/prerender filtr:** BE zahodí ping, když UA odpovídá bot regexu (`BOT_UA_RE`, kopie nginx mapy z 15B.1) NEBO obsahuje marker `Ikaros-Prerender` (prerender sidecar si ho vkládá do UA, `prerender/index.js`) — jinak by každý render nafoukl čísla.
- **Hranice / co neumí:**
  - **Trend max 90 dní** (TTL events). Delší historie by chtěla denní rollup kolekci (zatím ne).
  - **Návštěvníci jsou hrubý odhad** — sessionStorage nonce zaniká zavřením tabu, nerozliší návrat téhož člověka jiný den (žádná cross-session identita, záměr kvůli soukromí).
  - `authed` flag posílá FE (důvěřujeme mu — jen statistika, ne bezpečnostní hranice).
  - **Dual-source bot seznam** — `BOT_UA_RE` v BE je kopie nginx mapy; změna na jednom místě vyžaduje sjednocení i druhého.
  - Agregace v UTC (CZ posun pár hodin u hranic dnů — pro agregát zanedbatelné).
- **Zvláštnosti:** summary cache 5 min per období; nový event invaliduje cache. Aggregation `$facet` (totals/daily/topPaths/sources) s `allowDiskUse`. Prázdný stav → hláška „Zatím žádná data".
- **Stav:** ✅ (čeká deploy + BE restart + redeploy prerender sidecaru)
- **Kód:** FE `components/AnalyticsSection/AnalyticsSection.tsx` + `MiniBarChart.tsx`, `api/useAnalyticsSummary.ts`, `shared/analytics/usePageViewPing.ts`; BE `modules/analytics/{analytics.controller,analytics.service}.ts`, `schemas/analytics-event.schema.ts`.

---

### Růst & retence (19.1, sekce v Přehledu)
- **Co to je:** onboarding trychtýř + retenční ukazatele registrovaných uživatelů — kde lidé v cestě odpadají a kolik se vrací. Vše **odvozené z DB timestampů, žádný nový tracking** (GDPR-čisté).
- **Kde:** sekce „Růst & retence" uvnitř tabu Přehled (`components/GrowthSection/GrowthSection.tsx`, za Návštěvností), NE samostatný tab. Data `GET /admin/stats/growth?days=7|30|90`.
- **Kdo:** FE pod RoleGuardem (Superadmin/Admin). BE `admin.controller.ts` `getStatsGrowth` `@UseGuards(AdminGuard)` (Admin+; `admin.controller.ts:70`).
- **Co ukazuje:**
  - **Trychtýř** 5 milníků: Registrovaní → Vstoupil do světa → Má postavu → Zahrál si (world chat) → Hází kostkou (odhad „hraje"). Každý = distinct uživatelé (all-time) + přírůstek z nováčků za období. Konverze % mezi kroky.
  - **Retence:** Vrátilo se po registraci (aktivace), Lepkavost WAU/MAU, Aktivní 7 d, Aktivní 30 d.
  - **Kohorty:** tabulka měsíc registrace × registrací / aktivních dodnes / % drží.
  - **Akvizice:** návštěvníci (z 15B.7) → registrace → poměr.
  - Přepínač období nováčků 7/30/90 (default 30).
- **Odkud data (odvozeně, `min(createdAt)` per uživatel):** `users.createdAt` (registrace), `worldmemberships.joinedAt` (svět), `characters` (isNpc=false + userId), world `chatmessages` (worldId≠null, senderId; hody `isDiceRoll`). Akvizice čte `AnalyticsService.getSummary().totals.visitors`.
- **Hranice / co neumí:**
  - **⚠️ Pravá week-over-week kohortní retence NEJDE** (dluh **D-19.1-RETENCE**) — v DB je jen přepisovaný `lastSeenAt` bez historie; retence je **snapshot k dnešku**, ne časová řada. UI to čestně označuje.
  - **Aktivace je aproximace** (`lastSeenAt − createdAt > 24 h`) — guard přepisuje `lastSeenAt` i na registračním requestu.
  - **Krok „příchod → registrace"** se na konkrétní anonymní návštěvu nenapojuje (bez sledování identity nejde) — jen agregátní poměr.
  - **„První hra" jako entita neexistuje** → proxy = první hod kostkou / world-chat zpráva.
  - **Global chat (Hospoda/Camp, worldId=null) se do funnelu nepočítá** — má TTL 1 h, jen world chat je durable.
- **Zvláštnosti:** cache 15 min per období (agregace přes `chatmessages` je dražší). Každý dílčí dotaz přes `safe()` — chyba → 0/[] + warning, dashboard nespadne. `distinct` počítán aggregation `$group`+`$count` (ne velké pole).
- **Stav:** ✅ (čeká BE restart + živý touch test)
- **Kód:** FE `components/GrowthSection/{GrowthSection,FunnelChart}.tsx`, `api/{useGrowthStats,growth.types}.ts`; BE `admin-growth.service.ts`, `admin.controller.ts:70`, `dto/growth-stats.dto.ts`.

---

### Náklady (19.2, sekce v Přehledu)
- **Co to je:** počítadla provozních nákladů — **jen měření, žádné vynucování**. Kolik obsahu platforma drží a co ji stojí Cloudinary.
- **Kde:** sekce „Náklady" uvnitř tabu Přehled (`components/CostsSection/CostsSection.tsx`, za Růstem). Data `GET /admin/stats/costs`.
- **Kdo:** FE RoleGuard (Superadmin/Admin). BE `getStatsCosts` `@UseGuards(AdminGuard)` (Admin+).
- **Co ukazuje (tři vrstvy):**
  - **A — počty blobů:** celkem + podle typu (galerie, mapy světů, taktické scény, emotky, obrázky stránek, bestie, obrázky světů) + nejnáročnější světy. Odvozené `countDocuments`.
  - **B — přesné byty** jen kde je DB má: chat přílohy (`attachments[].size`) + admin PDF (`sizeBytes`).
  - **C — skutečný provoz Cloudinary** (`api.usage()`): úložiště / přenos / transformace / kredity / plán. Když chybí creds (dev/disk) → sekce skrytá (`available:false`).
- **Hranice / co neumí:**
  - **⚠️ Velikost obrázků v bytech se z DB nedopočítá** (dluh **D-19.2-BYTES**) — schémata drží jen `imageUrl`/`publicId`. Vrstva A jsou **počty souborů, ne velikost**; skutečný objem dává jen Cloudinary (C) + chat/PDF (B).
  - **AI (Fáze 18) neexistuje** → žádná AI počítadla; placeholder „až Fáze 18".
  - **Vynucování kvót** (blok/upozornění při překročení) NENÍ — je to **navazující krok** roadmapy.
  - Cloudinary `/usage` je **account-level**, ne per-svět.
- **Zvláštnosti:** cache 1 h. Cloudinary volání v try/catch → chyba/absence creds neshodí endpoint (`available:false`). Cloudinary config parsuje `CLOUDINARY_URL` v konstruktoru (idempotentní, globální SDK singleton).
- **Stav:** 🚧 měření ✅ / vynucování limitů = další krok (čeká BE restart)
- **Kód:** FE `components/CostsSection/CostsSection.tsx`, `api/{useCostStats,costs.types}.ts`; BE `admin-costs.service.ts`, `admin.controller.ts`, `dto/cost-stats.dto.ts`.

---

### Motivy a skiny (20.6, sekce v Přehledu)
- **Co to je:** read-only přehled využití všech vizuálních voleb platformy — **jen měření, podklad pro osekání** málo využívaných motivů/skinů. Žádný nový tracking, čistá agregace stavu DB.
- **Kde:** sekce „Motivy a skiny" uvnitř tabu Přehled (`components/ThemeUsageSection/ThemeUsageSection.tsx`, za Náklady). Data `GET /admin/stats/theme-usage`.
- **Kdo:** FE RoleGuard (Superadmin/Admin). BE `getStatsThemeUsage` `@UseGuards(AdminGuard)` (Admin+; `admin.controller.ts`).
- **Co ukazuje (5 dimenzí, každá = bar list seřazený dle využití):**
  - **Motiv platformy** (`User.themeId`) — kolik uživatelů; default `modre-nebe` absorbuje děděné (bez volby).
  - **Motiv světa** (`World.themeId`) — kolik světů.
  - **Osobní motiv světa** per člen (`WorldMembership.themeId`, 5.9b override) — kolik členství.
  - **Skin deníku** (`WorldMembership.diarySkin`, 16.2c) — kolik členství.
  - **Skin chatu** (`WorldMembership.chatSkin`, 16.1d) — kolik členství.
- **Klíčové rozlišení (spec 20.6 §4):** BE vrací `counts` (vědomé volby) zvlášť od `noChoice` (dědí default). „Bez volby" **NENÍ** „nevyužité". **Kandidát na osekání** = motiv/skin s 0 vědomými volbami napříč VŠEMI dimenzemi, kde se nabízí, a není default dimenze. Souhrn nahoře vypíše kandidáty jako chip seznam.
- **Hranice / co neumí:**
  - **Jen měří, neoseká** — samotné vyřazení motivu z nabídky (registr FE + `THEME_IDS`/whitelisty BE) = navazující krok 2 podle čísel.
  - `noChoice` u diary/chat skinů se **nerozpouští** na konkrétní systémový default (závisí na světě → drahý lookup); zobrazí se jako agregát „bez volby".
  - Skiny kostek (`diceSkinMapping`) nejsou zahrnuté (jiná struktura — `Record` per typ).
  - **⚠️ `World.themeId` má schema default `'modre-nebe'`** (≠ FE `DEFAULT_WORLD_THEME='ikaros'`, dluh **D-064**) → světy nemají `null`, „bez volby" u světů ≈ 0 a `'modre-nebe'` se u světové dimenze zobrazí jako „mimo nabídku".
  - Žádné časové řady — snapshot k `generatedAt`.
- **Zvláštnosti:** cache 15 min (single-slot). 3 membership dimenze jedním `$facet` scanem; users/worlds po jednom `$group`. Každá dimenze přes `safe()` — chyba → prázdná dimenze + warning, přehled nespadne. FE klasifikuje syrová BE ID přes theme registry (názvy, scope, legacy detekce) — BE je „hloupé".
- **Stav:** ✅ přehled funguje (čeká BE restart/deploy) / osekávání = krok 2
- **Kód:** FE `components/ThemeUsageSection/{ThemeUsageSection.tsx,themeUsage.lib.ts}`, `api/{useThemeUsageStats,themeUsage.types}.ts`; BE `admin-theme-usage.service.ts`, `admin.controller.ts`, `dto/theme-usage.dto.ts`. Spec `docs/arch/phase-20/spec-20.6-vyuziti-motivu-skinu.md`.

---

### Tab Uživatelé (správa)
- **Co to je:** filtrovatelná tabulka uživatelů + per-řádek a bulk akce.
- **Kde:** `components/UsersAdminTab/UsersAdminTab.tsx` → `users/components/UsersTab/UsersTable.tsx`. Data `GET /admin/users`. Deep-link `?tab=uzivatele&search=<username>` předvyplní hledání (init-only; přepnutí tabu param zahodí) — používá „Otevřít v administraci" z veřejného profilu.
- **Kdo:** FE RoleGuard. BE všechny endpointy `AdminGuard`; navíc per-akce hierarchy check.
- **Co jde dělat (per řádek):**
  - **Změna role** (dropdown, jen 6 globálních rolí `ASSIGNABLE_ROLES`). `PATCH /admin/users/:id/role`.
  - **Ban / Odbanovat** — `POST /admin/users/:id/ban` + `/unban`. Ban má důvod + trvání (modal); 0/undefined = trvalý, jinak timed (`bannedUntil`). Ban revokuje všechny refresh tokeny → force logout, invaliduje ban cache, emit `user.identity.changed`.
  - **Smazat účet / Obnovit smazání** — `POST /admin/users/:id/request-deletion` (30denní soft-delete hold, povinný důvod) + `/cancel-deletion`. Vyžaduje `canModerateContent` (pro Admina). Spustí PJ handover (viz níže).
  - **Granulární oprávnění** (jen u cílů s rolí Admin, jen pro Superadmina / Admin-managera) — checkboxy „Správa adminů" (Superadmin-only) a „Moderace obsahu".
  - **Reset hesla** (D-NEW-INV-ADMIN-UI, jen Superadmin, ne self) — `PUT /users/:id/reset-password` (`{ newPassword }`, 8–128, 204). BE heslo negeneruje/nevrací — dočasné heslo generuje FE (`generateTempPassword`, editovatelné), po nastavení zůstává v modalu ke zkopírování. `ResetPasswordModal.tsx`.
  - **Změnit e-mail** (D-NEW-INV-ADMIN-UI, jen Superadmin, ne self) — `PATCH /admin/users/:id/email` (`{ email }`). Prefill současné adresy; `SAME_EMAIL` 400 / `EMAIL_TAKEN` 409 field-level, self → 403 `SELF_MODIFICATION`. Nová adresa je `emailVerified: false` (bez confirm mailu). `AdminChangeEmailModal.tsx`.
- **Co jde dělat (toolbar):**
  - **Nový uživatel** (D-NEW-INV-ADMIN-UI) — `POST /admin/users` (`{ email, username 3–32, password 8–128, role? }`). Validace zrcadlí BE DTO; `EMAIL_TAKEN`/`USERNAME_TAKEN` field-level; heslo lze vygenerovat + zkopírovat; role select respektuje hierarchii (Admin nenabízí admin role). Audit `USER_CREATE`. `CreateUserModal.tsx` (tlačítko v `UsersAdminTab.tsx`).
- **Co jde dělat (bulk, `BulkToolbar.tsx`):**
  - Bulk Banovat (trvání permanent/1/7/30/90 dní + důvod), Bulk Odbanovat, Bulk Změnit roli.
  - Best-effort: server vrací `{ successful[], failed[] }`, per-user hierarchy check; selhání jednoho neshodí dávku.
- **Filtry:** username (text), role, „má pending username request".
- **Hierarchy pravidla (`helpers/hierarchy.ts`):**
  - Nikdo nesmí měnit/moderovat sám sebe (`SELF_MODIFICATION`).
  - Superadmin smí cokoli (kromě sebe).
  - Admin NESMÍ měnit roli ani moderovat jiného Admina/Superadmina; nesmí povyšovat na admin role.
  - DELETE/UNDELETE navíc vyžaduje `canModerateContent`.
- **Hranice / co neumí:**
  - Filtry `includeDeleted` / `hasPendingDeletion` BE umí, ale `getUsers` je řeší in-memory po vytažení stránky (nekonzistentní paginace u tombstone řádků — dluh, `admin.service.ts:120`).
- **Zvláštnosti:** `A+` badge u Admina = má `canManageAdmins`. Self řádek je v akcích zamčený. Veškeré akce auditovány + invalidují stats/audit/public-profile cache.
- **Stav:** ✅
- **Kód:** FE `users/components/UsersTab/UsersTable.tsx`, `BulkToolbar.tsx`, hooky `users/api/useAdminUsers.ts`; BE `admin.controller.ts:71`, `admin.service.ts`, `helpers/hierarchy.ts`.

---

### Tab Smazané světy (recovery)
- **Co to je:** seznam soft-smazaných světů s možností obnovy do 30 dní.
- **Kde:** `components/DeletedWorldsTab/DeletedWorldsTab.tsx`. Data `useDeletedWorlds`, akce `POST /worlds/:id/restore`.
- **Kdo:** FE RoleGuard (Superadmin/Admin). BE = worlds modul — restore je jediná admin pojistka, která funguje **bez elevace** (obnova opuštěného světa + dosazení PJ); ostatní zásahy do světa (nastavení/mazání/členové/kalendář) vyžadují od FIX-19 aktivní elevaci pro daný svět, viz kap. 09 sekce I.
- **Co jde dělat:** Obnovit svět (vrátí stránky/postavy/chat, vlastník zase získá přístup). Zobrazuje zbývající dny do trvalého smazání cronem (zvýraznění ≤ 5 dní).
- **Hranice:** po 30 dnech cron svět trvale smaže (hard delete ~40 kolekcí). Z tohoto tabu nelze trvale smazat ručně.
- **Stav:** ✅
- **Kód:** FE `components/DeletedWorldsTab/DeletedWorldsTab.tsx`.

---

### Tab Audit log
- **Co to je:** log moderátorských akcí s filtrací.
- **Kde:** `users/components/AuditLogTab/AuditLogTab.tsx`. Data `GET /admin/audit-log`.
- **Kdo:** FE RoleGuard. BE `admin.controller.ts:315` `AdminGuard`.
- **Co jde dělat:** procházet záznamy (actor, cíl, akce, before/after JSON, důvod, čas), filtr podle akce + stránkování. Read-only.
- **Auditované akce (`admin-audit-log.interface.ts:1`):** ROLE_CHANGE, USER_CREATE, USERNAME_REQUEST_APPROVED/REJECTED, BAN, UNBAN, DELETE/UNDELETE, ACCOUNT_DELETE_REQUEST/CANCEL, ACCOUNT_SELF_DELETE_REQUEST, ACCOUNT_SELF_REACTIVATE, ACCOUNT_HARD_DELETE (system cron actor), ADMIN_PERMISSIONS_CHANGE, BULK_BAN/UNBAN/ROLE_CHANGE, IKAROS_NEWS_ARCHIVE/UNARCHIVE/DELETE (D-067).
- **Zvláštnosti:** audit je best-effort — selhání zápisu nikdy neblokuje business akci (`admin.service.ts:104`).
- **⚠️ Drift:** FE `AuditLogTab.tsx:7` mapuje label `FRIENDSHIP_COOLDOWN_RESET`, který v BE `AdminAuditAction` typu není; naopak řadu BE akcí (DELETE/UNDELETE/HARD_DELETE/BULK_*) FE label mapa neuvádí → u nich padne na fallback. K sjednocení.
- **Stav:** ✅ (s label driftem)
- **Kód:** FE `users/components/AuditLogTab/AuditLogTab.tsx`, BE `admin.controller.ts:315`, `repositories/admin-audit-log.repository.ts`.

---

### Tab Search index
- **Co to je:** monitoring stavu fulltextového/embedding indexu + ruční rebuild.
- **Kde:** `components/SearchIndexTab/SearchIndexTab.tsx`. Data `GET /stats/search`, akce `POST /stats/search/rebuild`.
- **Kdo:** FE RoleGuard. BE celý `StatsController` je `@UseGuards(JwtAuthGuard, AdminGuard)` (`stats.controller.ts:30`) — rebuild je drahá operace / DoS riziko.
- **Co jde dělat:** zobrazit stav (provider, zaindexované stránky, vektory/embeddingy, zpracováno/celkem, čeká na zpracování, čas posledního embeddingu) + tlačítko Přebudovat index (s confirm dialogem).
- **Hranice:** žádné per-stránkové ovládání z UI — jen full rebuild. Reindex jednotlivé stránky existuje jako endpoint (`POST /stats/search/reindex`, `/search/reindex`), ale UI ho nevolá.
- **Stav:** ✅
- **Kód:** FE `components/SearchIndexTab/SearchIndexTab.tsx`, `api/useSearchIndex.ts`; BE `stats.controller.ts`.

---

## Interní chat správy platformy (`/admin/chat`) — 20.5

Samostatná full-screen stránka (ne tab panelu) pro interní komunikaci a organizaci týmu správy. Tři podsystémy pod jedním shellem (konverzace vlevo, obsah uprostřed, úkoly vpravo). Vše pod BE prefixem `admin-chat`, guard `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Superadmin, Admin)` na všech třech controllerech (`platform-chat`, `platform-documents`, `admin-tasks`).

- **Kde:** route `admin/chat` (`router.tsx:232`, `loader: requireAuth` + `RoleGuard roles={[Superadmin, Admin]}`). FE `features/admin/chat/pages/AdminChatPage.tsx`. Layout běží ve full-height chat módu (`IkarosLayout.tsx:776` `isAdminChat`).
- **Kdo (celá stránka):** FE RoleGuard Superadmin+Admin; BE stejné role na každém endpointu. Žádný jiný přístup.
- **Stav:** 🚧 funkční, čeká deploy + BE restart; dokumenty nad 10 MB blokované (viz níže).

### Konverzace (chat)
- **Co to je:** vícekanálový interní chat týmu správy. Reuse chatového jádra (`ChatChannel`/`ChatMessage` přes DI tokeny `IChatChannelRepository`/`IChatMessageRepository`, jako global-chat).
- **Kde:** BE `platform-chat.controller.ts` (`GET/POST /admin-chat/channels`, `/channels/:id/messages`, `PATCH/DELETE /channels/:id`, `GET /admin-chat/unread`, `POST /channels/:id/read`), WS `platform-chat.gateway.ts` (`platform-chat:join/leave`, event `platform-chat:message`). FE `api/useAdminChat.ts`.
- **Kdo:** čtení/psaní = každý admin (Sa+Admin). **Zakládání / úprava / mazání konverzace = jen Superadmin** (gate na FE tlačítkách + BE). Členství per-konverzace: `accessMode:'all'` (všichni správci) nebo `'members'` + `allowedMemberIds` (vybraní přes checkbox v `ChannelModal.tsx`).
- **Co jde dělat:** psát zprávy (real-time WS echo + dedupe), zakládat konverzace (Superadmin), určit členy (všichni / vybraní), přejmenovat, smazat (ne seed).
- **Seed konverzace:** „Hlavní" (`staff-main`, accessMode all) + „Vedení" (`staff-vedeni`) v marker-skupině `__platform_staff__`; seed = jen přejmenování, nelze smazat.
- **Hranice / co neumí:** žádné soukromé 1:1 (záměr — vytvoří je Superadmin jako `members` konverzaci); bez TTL zpráv; **obrázkové přílohy v chatu ANO** (2026-07-04, upload endpoint), PDF dokumenty mají samostatný modul Dokumenty; bez emoji reakcí na zprávy (emoji jen do textu).
- **Zvláštnosti:** WS room `platform-chat:{channelId}` gatuje admin roli i členství; po reconnectu re-join.
- **Chat parita (2026-07-04, §4.E / CH-053):** přepojeno z vlastního `<input>` na sdílený composer (`AdminChatComposer`, jádro z `ChannelComposer`) + `MessageList`/`MessageItem`. Umí: multiline (**Enter** odešle / **Shift+Enter** nový řádek), emoji picker, **Ctrl+V** obrázků/GIF + upload (`POST /admin-chat/channels/:id/upload`, folder `platform-chat/`), **odpověď** (`replyToId`), **mazání** (`DELETE .../messages/:id` — Superadmin NEBO odesílatel; WS `platform-chat:message:deleted`), **typing** indikátor (WS `platform-chat:typing`). Klikací afordance (přílohy jako karty, skok na citovaný originál). `RoleStar` u jména přes prop `renderSenderBadge`.
- **Emoji reakce + odkazy (2026-07-05):** **reakce** na zprávy (`PUT /admin-chat/channels/:cid/messages/:mid/reactions/:emoji` → celá zpráva; WS `platform-chat:message:updated`; reagovat smí admin s přístupem do kanálu) + **klikací http(s) odkazy** v textu (sdílený `linkify`, XSS-safe — viz [05](05-komunikace-platformy.md) §20.6).
- **Avatar + role-odznak (2026-07-04):** zpráva i panel úkolů ukazují avatar odesílatele z profilu (`senderAvatarUrl`, fallback ze `/staff` dle `senderId`) + `RoleStar` dle globální role.
- **Notifikace (2026-07-04):** nová zpráva → web push (PWA, kategorie `adminChat`, default ZAP, opt-out v profilu → Nastavení notifikací → „Správa platformy") + in-app badge „Chat správy" v Administraci. Příjemci WS `platform-chat:activity`: `all` → všichni Sa+Admin, `members` → `allowedMemberIds`+Superadmini.
- **Persistentní unread badge (2026-07-05, 20.5b):** badge „Chat správy" **přežije reload i offline zprávy** (dřív efemérní WS counter). BE seed `GET /admin-chat/unread` = per-konverzace `{channelId,count}` přes `messageRepo.countAfter` (zprávy s `_id > lastReadMessageId`); read-state v kolekci **`channelreadstatus`** (reuse world-chat vzoru, klíč `{userId,channelId}` — admin `ChatChannel._id` globálně unikátní, žádná kolize se světem). `POST /admin-chat/channels/:id/read` značí přečteno po poslední zprávu (volá se při otevření konverzace, per-kanál jako svět). Odesílatel má vlastní zprávu rovnou přečtenou (`upsert` v `sendMessage`). Živý tik = WS `platform-chat:activity` → invalidace `unread` query (nízká frekvence → refetch stačí). FE: `useAdminChatLive` (root seed+WS), `useAdminChatUnreadTotal` (badge součet), `useMarkAdminChatRead`. **Bez nové kolekce/migrace.**
- **Stav:** 🚧 (funkční, čeká BE restart).
- **Kód:** FE `features/admin/chat/pages/AdminChatPage.tsx`, `api/useAdminChat.ts` (+`useAdminChatUnread`/`useAdminChatUnreadTotal`/`useMarkAdminChatRead`), `api/useAdminChatLive.ts`, `components/ChannelModal.tsx`; BE `modules/platform-chat/platform-chat.{controller,service,gateway}.ts`, read-state reuse `modules/chat` (`IChannelReadStatusRepository`, exportováno v `chat.module.ts`).

### Sdílené dokumenty (PDF)
- **Co to je:** společný sklad PDF dostupný všem adminům (nahrát / číst / stáhnout). Bez AI, jen úložiště.
- **Kde:** BE `platform-documents.controller.ts` (`GET /admin-chat/documents`, `POST` upload, `GET /:id/view` čtečka, `PATCH/:id` rename, `DELETE/:id`). FE `api/useAdminDocuments.ts`, DocumentsView v `AdminChatPage.tsx`.
- **Kdo:** čtení + upload = všichni admini; **rename/delete = Superadmin nebo nahravatel** (gate v service). Soubory na Cloudinary `resource_type:'raw'`, folder `platform-docs`.
- **Co jde dělat:**
  - **Nahrát PDF** (`POST`, jen `application/pdf` + magic-byte `%PDF` check, `upload_chunked_stream` chunk 6 MB, multer strop 30 MB).
  - **Otevřít ke čtení** — klik na řádek → BE `view` endpoint stáhne z Cloudinary a přebalí na `Content-Type: application/pdf` + `Content-Disposition: inline` (jinak by Cloudinary raw soubor jen stáhl bez přípony); FE fetch → blob → `window.open`.
  - **Stáhnout** (ikona ↓) — přes stejný `view` endpoint, blob same-origin → `a.download = název.pdf`.
  - **Přejmenovat / smazat** (Sa nebo nahravatel).
- **Hranice / co neumí:**
  - ⚠️ **Reálný strop 10 MB na soubor** — Cloudinary FREE účet odmítne soubor > 10 MiB (`File size too large, Maximum is 10485760, Upgrade your plan`). `upload_chunked_stream` + multer 30 MB jsou nasazené pro budoucnost, ale account limit chunked NEobejde → soubory nad 10 MB padají na 502. Řešení (odloženo): zmenšit PDF, disk úložiště pro velké, nebo placený Cloudinary plán.
  - Jen PDF (žádné jiné typy). Bez verzování, bez složek.
- **Zvláštnosti:** české názvy — multer čte `originalname` jako latin1, překódováno zpět na UTF-8 (`upload.service.ts` `uploadPlatformDocument`). Upload-chyba se od 20.5 vrací s konkrétní Cloudinary hláškou (dřív mlhavé 502) + FE toast.
- **Stav:** 🚧 (do 10 MB funguje; nad 10 MB blokované Cloudinary free limitem).
- **Kód:** FE `api/useAdminDocuments.ts`, DocumentsView v `AdminChatPage.tsx`; BE `modules/platform-chat/platform-documents.{controller,service}.ts`, `modules/upload/upload.service.ts:uploadPlatformDocument`.

### Úkoly týmu
- **Co to je:** TODO seznam per admin, veřejně viditelný mezi všemi adminy (pravý panel, rozevírací per osoba).
- **Kde:** BE `admin-tasks.controller.ts` (`GET/POST /admin-chat/tasks`, `PATCH/DELETE /:id`, `GET /staff`). FE `api/useAdminTasks.ts`, TasksPanel v `AdminChatPage.tsx`.
- **Kdo:** vidí všichni admini; **vlastní úkoly edituje každý admin, cizí jen Superadmin** (gate v service). Skupiny podle seznamu správců (`listStaff` → `usersRepo.findByRoles([Superadmin, Admin])`).
- **Co jde dělat:** přidat úkol, odškrtnout (toggle done), upravit text, smazat — dle oprávnění výše.
- **Hranice / co neumí:** bez termínů, priorit, přiřazování cizímu adminovi (úkol patří tomu, kdo ho vytvořil, resp. jeho skupině).
- **Stav:** 🚧 (funkční, čeká BE restart).
- **Kód:** FE `api/useAdminTasks.ts`, TasksPanel v `AdminChatPage.tsx`; BE `modules/platform-chat/admin-tasks.{controller,service}.ts`.

---

## Vyhledávání (search modul)

- **Co to je:** vyhledávání stránek v rámci JEDNOHO světa, kombinace dvou providerů.
- **Kde:** `GET /search?q=...&worldId=...&count=...&provider=...` (`backend/src/modules/search/search.controller.ts`).
- **Kdo:** běžný vyhledávací endpoint = `JwtAuthGuard` (přihlášený). Indexovací endpointy (`/search/created|updated|deleted|reindex|rebuild`) = `AdminGuard`.
- **Provideři (`search.module.ts`):**
  1. **MeiliSearch** (`meili-search.service.ts`) — fulltext. Host `MEILI_HOST` (default `http://localhost:7700`), `MEILI_API_KEY`.
  2. **EmbeddingSearchService** (`embedding-search.service.ts`) — sémantické embeddingy (ONNX model + vptree), Mongo `PageEmbedding`.
  - `SearchCoordinator` výsledky obou interleavuje (round-robin dedupe podle slug/id).
- **Bezpečnost (klíčové):**
  - `worldId` je POVINNÝ (`WORLD_ID_REQUIRED`) — globální search bez něj by leakoval názvy stránek privátních světů (D-NEW-global-search-access-leak).
  - Access check: `worldsService.findByIdForRequester` → 404 u privátního světa bez membershipu.
  - Page-level filtr: výsledky se protnou s `findVisibleSlugs` → AKJ/access-chráněné stránky se neleaknou (N-35).
- **Hranice / zvláštnosti:**
  - **MeiliSearch je POVINNÝ infra prvek (Docker).** Bez běžícího MeiliSearchu provider tiše vrátí prázdno (chyby jsou jen logované jako warning, `meili-search.service.ts:62`) → fulltext mlčky nefunguje, žádná tvrdá chyba.
  - Index se konfiguruje a rebuilduje při startu modulu (`onModuleInit`).
  - Nelze hledat napříč světy z jednoho dotazu (záměrné, leak-safe).
- **Stav:** ✅ (provoz závislý na Docker MeiliSearch + ONNX modelu)
- **Kód:** BE `modules/search/*`, `modules/stats/stats.controller.ts`.

---

## Dungeon Builder (`/admin/dungeon-builder`) — ZRUŠENO

- **✅ VYŘEŠENO 2026-07-14 (21.3a):** admin route `/admin/dungeon-builder` + stub `DungeonBuilderPage.tsx` **smazány**. Tvorba podzemí je teď **per-world nástroj** `/svet/:slug/podzemi` nad BE modulem `dungeon-maps` (gating Hrac+ / Podporovatel / PJ+) — plná inventura v **kap. 14 §14.6**.
- Historie: stub tu visel od začátku, BE modul byl rozpojený (a do 2026-07-05 kvůli chybějícím DTO dekorátorům fakticky nefunkční, SEC-25).

---

## Globální emoty (`/ikaros/admin/emotes`)

- **Co to je:** správa custom emotů dostupných napříč VŠEMI světy.
- **Kde:** route `/ikaros/admin/emotes`, FE `features/ikaros/pages/IkarosEmotesAdminPage/IkarosEmotesAdminPage.tsx`.
- **Kdo:** FE `RoleGuard roles={[Superadmin, Admin]}` (router.tsx:216). BE `assertGlobalCanManage`: `role > Admin` → `NOT_PLATFORM_ADMIN` 403 (`emotes.service.ts:67`).
- **Co jde dělat:** vytvořit / upravit (name, shortcode, image) / smazat globální emote.
  - `GET /emotes/global` (čte každý přihlášený), `POST /emotes/global` (Admin+), `PATCH /emotes/global/:id` (Admin+), `DELETE /emotes/global/:id` (Admin+).
- **Hranice:** limit globálních emotů `EMOTE_LIMIT_GLOBAL = 200` (FE konstanta). Mazání bez soft-delete (potvrzení jen přes `confirm()`).
- **Zvláštnosti:** per-world emoty jsou jiná věc (PJ světa, `POST /emotes/:worldId`); admin globální emoty vidí všichni uživatelé ve všech světech. Real-time broadcast přes `emotes.gateway.ts`.
- **✅ OPRAVENO 2026-07-05 (SEC-11, RUN-2026-07-05):** create/update/copy DTO byly importované přes `import type` → class-validator metadata chyběla, `POST`/`PATCH /emotes/global` i per-svět vracely 400 na každý pokus (vytváření/úprava emotů bylo úplně nefunkční, přestože stránka vypadala hotová). Teď skutečný `import` — funguje.
- **Stav:** ✅
- **Kód:** FE `IkarosEmotesAdminPage.tsx` + `features/world/chat/emotes/*` (sdílené komponenty/hooky), BE `modules/emotes/emotes.controller.ts`.

---

## Export dat / GDPR (data-export modul)

- **Co to je:** GDPR export VLASTNÍCH dat uživatele do JSON (čl. 15/20).
- **Kde:** `GET /data-export/me` (`backend/src/modules/data-export/data-export.controller.ts:16`). FE: tlačítko **„Stáhnout moje data (JSON)"** v profilu → sekce „Účet" (`AccountSection`) a v `DeleteAccountModal` (nabídka exportu před smazáním účtu). Hook `useDataExport` (`src/features/profile/api/useDataExport.ts:30`).
- **Kdo:** `JwtAuthGuard` — **jakýkoli přihlášený uživatel exportuje JEN svá data** (`user.id` z tokenu). Žádný admin override.
- **Co jde dělat:** klik → `GET /data-export/me` → prohlížeč stáhne Blob jako soubor `ikaros-data-<YYYY-MM-DD>.json`. Tlačítko je dostupné i v pending-delete stavu (rámec „mazání = nejdřív nabídnout export").
- **Co exportuje (`data-export.service.ts`):** profil (email, username, displayName, avatar, role, theme/chat preferences, email verified, timestampy), world memberships, friendships (accepted + pending obousměr), friend blocks, pending username request, posledních 100 admin audit záznamů kde je uživatel cílem. Formát JSON `version 1.0`.
- **Hranice / co neumí:**
  - **NENÍ admin nástroj** — admin nemůže exportovat cizí účet.
  - Neobsahuje obsah stránek/postav/chatových zpráv, jen metadata vztahů (account-centric rozsah, čl. 15).
- **Stav:** ✅ (20.2/§C1 — FE tlačítko doplněno; dříve BE bez FE).
- **Kód:** BE `modules/data-export/*`; FE `features/profile/api/useDataExport.ts`, `components/AccountSection.tsx:21`, `components/DeleteAccountModal.tsx:34`.

---

## Nahlašování & moderace obsahu (20.1 / 20.3)

Generický subsystém pro nahlašování jakéhokoli UGC a jeho moderaci (DSA čl. 16 notice, čl. 17 statement of reasons, čl. 18 eskalace, čl. 20 odvolání). Nahradil minimální report na diskuzích jednou frontou napříč plochami. BE modul `backend/src/modules/moderation/`, FE `src/shared/moderation/` (tlačítko + formulář) a `src/features/moderation/` (renderery fronty + odvolání).

### Nahlásit obsah (ReportButton / ReportModal)
- **Co to je:** malé tlačítko „Nahlásit" (vlajka) u obsahu → modal s formulářem hlášení.
- **Kde (osazené plochy, ověřeno v kódu):** článek (`ArticleDetailPage.tsx:142`), obrázek v galerii (`GalleryDetailPage.tsx:118`), profil uživatele (`PublicProfileActions.tsx:202`), nábor (`NaborListek.tsx:97`), příspěvek v diskuzi (`DiscussionDetailPage.tsx:346`), stránka světa / wiki (`PageViewer/components/PageHeader.tsx:120`), novinka světa (`WorldNewsCard.tsx:209`), zpráva v poště — jen přijatá (`MailPage/MailDetail.tsx:118`), zpráva v chatu — světový i globální (`chat/components/MessageItem.tsx:583`, přes `ReportModal` z kebabu), **deník postavy** — jen ne-vlastnický pohled na stránce postavy (`DiaryTab.tsx:156` přes `PostavaLayout` `reportTarget`, `targetId=characterId`; D-066-ZBYTKY a, 2026-07-13 — detail kap. 12). Komponenta `src/shared/moderation/ReportButton.tsx:19`.
- **Kdo:** jen **přihlášený** (`ReportButton` se anonymovi nevykreslí; BE `POST /moderation/reports` je za `JwtAuthGuard`, guest 99 neprojde). Vlastní obsah nelze nahlásit (`targetAuthorId === user.id` → tlačítko skryté).
- **Co jde dělat (formulář `ReportModal`):** vybrat **kategorii** (Autorská práva / Osobní údaje / Obtěžování / Ohrožení nezletilých / Nezákonný obsah / Spam / Jiné), napsat **důvod** (max 2000), **e-mail** (předvyplněný, povinný — kromě „ohrožení nezletilých", kde je nepovinný), povinné prohlášení **dobré víry**, volba **„informovat mě o výsledku"** a **„nahlásit anonymně"** (skryje jméno oznamovatele moderátorovi). FE nikdy neposílá `reporterId/Name` — bere je BE z tokenu.
- **Hranice / co neumí:** „Anonymně" je jen maskování identity ve výstupu, ne guest přístup. Kategorie „ohrožení nezletilých" (CSAM) má nízkou bariéru (e-mail nepovinný). Dosazení tlačítek: bestie 2026-07-12 (`KomunitniBestieDetailPage.tsx:115`, D-066a), rostlina 2026-07-12 (`KomunitniPlantDetailPage.tsx:101`), **deník postavy 2026-07-13** (D-066-ZBYTKY a — poslední enum plocha bez FE tlačítka dosazena; nahlásit ho může jen ten, kdo cizí deník vidí = PJ/PomocnyPJ/elevated admin).
- **Zvláštnosti:** report se v kolekci `content_reports` **nikdy nemaže** (audit stopa; po vyřízení `status:'resolved'`). Po odeslání se invaliduje fronta „Zpracovat" (badge moderátora) i „moje hlášení".
- **Stav:** ✅
- **Kód:** FE `src/shared/moderation/{ReportButton,ReportModal,enums,useModeration}.ts(x)`; BE `moderation.controller.ts:37` (`POST /moderation/reports`), `content-report.schema.ts:16`.

### Moderátorská fronta „Zpracovat" (content_report + moderation_appeal)
- **Co to je:** nahlášený obsah i odvolání se objeví v osobní frontě „Zpracovat" (`/ikaros/uzivatele?tab=zpracovat`) jako pending akce typu `content_report`, resp. `moderation_appeal`.
- **Kdo (reviewer set):** frontu i akce **M0–M4** vidí „správci komunity" — `Superadmin, Admin, SpravceClanku, SpravceGalerie, SpravceDiskuzi` (`CONTENT_REVIEWER_ROLES`). **Account-level M5–M7 + kategorie „ohrožení nezletilých"** jen `Superadmin, Admin` (`ACCOUNT_LEVEL_ROLES`). FE u ne-admina M5–M7 z výběru skryje, BE gate vynutí (403). Gating v `moderation.service.ts` (`resolveReport` ř. 213/229) + providery (`content-report.provider.ts:32`).
- **Co jde dělat (statement of reasons):** u reportu „Vyřídit" → vybrat akci **M0–M7** + napsat **odůvodnění** (uvidí autor i oznamovatel) + **právní/politický základ**. `POST /moderation/reports/:id/resolve` vytvoří rozhodnutí (`moderation_decisions`, log se nemaže).
  - **M0** Bez zásahu · **M1** Upozornění · **M2** Skrýt část · **M3** Dočasně skrýt · **M4** Odstranit (content-level) · **M5** Omezit účet · **M6** Ukončit účet · **M7** Eskalace mimo platformu (account-level, jen Admin+).
- **Napojení zásahu (event-driven `moderation.enforce`/`.revert`):** diskuze — flag **`moderationHidden`** (M2/M3 skryje, M4 hard delete); účty — M5 = dočasný ban 30 dní, M6 = trvalý ban, M7 = jen log + notifikace do eskalačního kanálu v `/admin/chat`.
  - **Deník postavy (`character_diary`, D-066, 2026-07-12):** M2/M3 → `moderationHidden` na subdokumentu deníku; skrytý deník vidí/edituje **jen platform reviewer set** (`isContentReviewer`), **vlastník i PJ dostanou 404** `DIARY_NOT_FOUND` (globální zásah, 404 neprozrazuje existenci — vzor pages). M4 → smazání deníkového subdokumentu (**nevratné** — příští GET lazy-create obnoví PRÁZDNÝ deník, postava zůstává funkční). Revert M2/M3 odkryje; revert M4 nelze. `targetId` = characterId (deník je 1:1 subdokument). **Export světa (14.7c) skrytý deník konzistentně vynechá** (`omitModerationHiddenDiaries`, D-066-ZBYTKY b, 2026-07-13 — viz kap. 10 „Export / Záloha světa").
  - **Chatová zpráva (`chat_message`, D-066, 2026-07-12):** M2/M3 → `moderationHidden` na zprávě; obsah zůstává v DB, ale API/WS výstup se **maskuje pro všechny** — text nahrazen `*Zpráva skryta moderací*`, přílohy/mapRef/dicePayload se zahodí (whitelist v repo `toEntity`), skryté zprávy se nepočítají do unread ani search; klientům jde živý `chat:message:updated`. M4 → soft delete jako PJ mazání (tombstone text, `chat:message:deleted` živě, Cloudinary úklid příloh) — revert **nevratný**. Revert M2/M3 odkryje.
  - M5–M7 řeší account-level listener v `users` (ban s markerem `bannedBy = moderation:<decisionId>` — revert odbanuje JEN ban z téhož rozhodnutí, nezávislý admin ban přežije, D-065). Vše best-effort (chyba listeneru nikdy neshodí `resolveReport`).
- **Stav:** ✅ (content-level i account-level enforcement funkční na všech plochách vč. deníku postavy a chatové zprávy — D-066 vyřešen 2026-07-12).
- **Kód:** FE `features/moderation/components/ContentReportRenderer.tsx`, `ResolveReportModal.tsx`, `ZpracovatTab/rendererRegistry.tsx:147`; BE `moderation.controller.ts:81`, `moderation.service.ts`, listenery `ikaros-discussions/moderation-enforcement.listener.ts`, `users/moderation-enforcement.listener.ts`, `character-subdocs/moderation-enforcement.listener.ts`, `chat/moderation-enforcement.listener.ts` (+ `chat/repositories/chat-message.repository.ts:17` maska, `character-subdocs/character-subdocs.service.ts:343` gate), `platform-chat/moderation-escalation.listener.ts`.

### Vyrozumění, odvolání a eskalace
- **Autor** postiženého obsahu dostane **odůvodnění zásahu** (statement of reasons, čl. 17) do Pošty a vidí ho v profilu → sekce „Moderace" (`GET /moderation/decisions/mine`). **Oznamovatel** dostane potvrzení příjmu a (pokud zvolil „informovat mě") výsledek; stav svých hlášení vidí v profilu (`GET /moderation/reports/mine`).
- **Odvolání (čl. 20):** autor se proti rozhodnutí (kromě M0) odvolá tlačítkem „Odvolat se" v profilu → `POST /moderation/decisions/:id/appeal` (jedno odvolání na rozhodnutí). Odvolání spadne do fronty „Zpracovat" jako `moderation_appeal` a **přezkoumá ho JINÝ moderátor** — vlastní rozhodnutí přezkoumat nelze (`APPEAL_SELF_REVIEW_FORBIDDEN`). Výsledek: „Potvrdit rozhodnutí" / „Zrušit rozhodnutí" (`POST /moderation/appeals/:id/review`).
- **Eskalace M7** → záznam + notifikace do interního kanálu „Moderace — eskalace" v `/admin/chat` (reuse 20.5).
- **Moderační log:** `GET /moderation/log` (reviewer-gated) — historie rozhodnutí.
- **Kolekce:** `content_reports`, `moderation_decisions`, `moderation_appeals` (žádná se nemaže → auditní stopa).
- **Stav:** ✅
- **Kód:** FE `features/profile/components/ModerationSection.tsx`, `features/moderation/components/{AppealModal,AppealReviewModal,AppealReviewRenderer}.tsx`; BE `moderation.controller.ts:54/96/112`, `moderation-decision.schema.ts`, `moderation-appeal.schema.ts`.

---

## Systémové presety / herní systémy (system-presets modul)

- **Co to je:** katalog herních systémů platformy + jejich datová schémata (pro postavy/bestiář per systém).
- **Kde:** `GET /system-presets` (seznam meta), `GET /system-presets/:system` (plné schema) — `backend/src/modules/system-presets/system-presets.controller.ts`.
- **Kdo:** **bez guardu — ANONYMNÍ** (žádný `@UseGuards`). Presety jsou statická referenční data, ne citlivá.
- **Dostupné systémy (`presets/index.ts`):** call-of-cthulhu, dnd2e, dnd3plus, dnd5e, drd-hero, drd16 (alchemy/ranger/thief/warrior/wizard), fate, gurps, jad, matrix-custom, pi (Projekt Ikaros), shadowrun.
- **Co jde dělat:** jen číst (seznam + detail se schema). Schémata jsou hardcoded v BE (`SYSTEM_PRESETS` konstanta).
- **Hranice / co neumí:**
  - **Žádné CRUD z UI ani API** — systémy se nepřidávají/needitují za běhu, jen kódem (BE preset soubory). Není admin tab.
  - Canonical zdroj schémat je dle paměti na FE (`export-schemas` do BE); BE presety jsou statický seznam.
- **Stav:** ✅ (read-only katalog, žádná admin správa)
- **Kód:** BE `modules/system-presets/system-presets.service.ts`, `presets/*`.

---

## Další admin/superadmin endpointy (mimo panel taby)

- **Username change requests** — `GET /admin/username-requests`, `/approve`, `/reject` (`admin.controller.ts:220`), `AdminGuard`. FE je obsluhuje ve frontě „Zpracovat" (`/ikaros/uzivatele?tab=zpracovat`), ne v `/admin` panelu. Approve/reject auditováno + posílá notifikační mail žadateli.
- **Recent pages** — `GET /admin/recent-pages` (`admin.controller.ts:343`), gate `@Roles(Superadmin, Admin)`. Nedávno upravené stránky napříč platformou.
- **Admin friendships (D-056)** — `GET /admin/friendships`, `/friendships/by-pair`, `POST /friendships/:id/reset-cooldown` (`admin.controller.ts:365`), `AdminGuard`. Lookup přátelství usera + reset cooldownu. FE má jen DEV-only „Friendship debug" tab.
- **Obsahová moderace (Zpracovat)** — schvalování článků/galerie/diskuzí je gatováno OBSAHOVÝMI ROLEMI, ne admin flagy:
  - Články: `Superadmin, Admin, SpravceClanku` (`ikaros-articles/article-review.provider.ts:8`).
  - Galerie: `Superadmin, Admin, SpravceGalerie` (`ikaros-gallery/gallery-review.provider.ts:9`).
  - Diskuze: `Superadmin, Admin, SpravceDiskuzi`.
  - Tito správci se NEdostanou do `/admin`, vidí jen svou frontu „Zpracovat".
  - **Nahlašování obsahu (20.1, `content_report`)** — kterýkoli z těchto tří správců (+ Admin/Superadmin) moderuje **generickou** frontu reportů napříč všemi plochami (`CONTENT_REVIEWER_ROLES`); M5–M7 + „ohrožení nezletilých" jen Admin+. Podrobně viz sekce „Nahlašování & moderace obsahu" výše.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-ADMIN-UI) — **Reset hesla má UI.** Tlačítko „Reset hesla" v tabulce uživatelů (Superadmin-only, ne self) → `ResetPasswordModal` s generovaným heslem + copy. (`useAdminResetPassword`)
2. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-ADMIN-UI) — **Create user má UI.** Tlačítko „Nový uživatel" nad filtry → `CreateUserModal` (validace dle `CreateUserAdminDto`, field-level TAKEN chyby). (`useAdminCreateUser`)
3. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-ADMIN-UI) — **Admin změna cizího e-mailu.** Nový BE `PATCH /admin/users/:id/email` (Superadmin-only, `SAME_EMAIL`/`EMAIL_TAKEN`/`SELF_MODIFICATION`, audit `EMAIL_CHANGE`, `emailVerified: false`) + FE tlačítko „Změnit e-mail" → `AdminChangeEmailModal`. (`useAdminUpdateUserEmail`)
4. ✅ VYŘEŠENO 20.2/§C1 — **Data export má FE tlačítko.** „Stáhnout moje data (JSON)" v profilu → Účet a v `DeleteAccountModal` (`useDataExport` → `GET /data-export/me` → Blob download). Dřív BE bez FE.
5. ✅ VYŘEŠENO 2026-07-14 (21.3a) — **DungeonBuilderPage = stub.** Admin route + stub smazány; tvorba podzemí je per-world `/svet/:slug/podzemi` napojená na BE `dungeon-maps` (kap. 14 §14.6).
6. **`canEditPlatformPages` = mrtvý flag** — ukládá se a posílá, ale BE ho nikde nevynucuje; FE checkbox záměrně skryt. (`UsersTable.tsx:338`)
7. **`canModerateContent` ≠ obsahová moderace** — flag gatuje JEN admin delete/undelete účtu. Schvalování článků/galerie/diskuzí jede přes obsahové role. Název flagu mate.
8. **Audit-log label drift** — FE `AuditLogTab` zná `FRIENDSHIP_COOLDOWN_RESET` (v BE typu chybí) a naopak neumí labelovat DELETE/UNDELETE/HARD_DELETE/BULK_*. (`AuditLogTab.tsx:7` vs `admin-audit-log.interface.ts:1`)
9. ✅ OPRAVENO 2026-06-18 — **Overview „Index vyhledávání" placeholder** — rychlý odkaz je DISABLED s textem „Připravujeme (fáze 13.1)", ačkoli search-index tab už funguje. Kosmetický drift. (`OverviewTab.tsx:150`)
10. ✅ OPRAVENO 2026-06-18 (BE default práh = 24 h) — **Overview „Aktivní (24 h)"** — karta tvrdí 24 h, ale práh je `PRESENCE_THRESHOLD_HOURS` default 25 h. (`admin-stats.service.ts:40`)
11. **BE enum legacy role** — `UserRole` v BE stále drží PJ/Korektor/Hrac/Ctenar/Zadatel/Zakaz (3–8), FE je vyhodil. Drift po D-053 k vyčištění. (`user.interface.ts:1`)
12. **`getUsers` in-memory filtr** — `includeDeleted`/`hasPendingDeletion` se filtruje až po vytažení stránky → nekonzistentní paginace. (`admin.service.ts:120`)
13. **MeiliSearch tichý fail** — bez běžícího Docker MeiliSearchu fulltext vrací prázdno bez tvrdé chyby (jen warning v logu). Provozní past. (`meili-search.service.ts:62`)
14. ✅ OPRAVENO 2026-06-18 — **Stale komentář** — `article-review.provider.ts:11` tvrdí, že BE enum má „dvojité uu" v `SpravceClanku`; reálně je BE i FE shodně `SpravceClanku`. Komentář je zastaralý.
15. **Admin-chat dokumenty nad 10 MB (Cloudinary free limit)** — upload PDF > 10 MiB padá na 502 (`File size too large, Maximum is 10485760`). `upload_chunked_stream` + multer 30 MB jsou nasazené, ale account cap chunked neobejde. Odloženo (uživatel: „nech pro budoucnost") — trvalé řešení = disk úložiště pro velké soubory nebo placený Cloudinary plán. (`upload.service.ts:uploadPlatformDocument`, `platform-documents.controller.ts`)
