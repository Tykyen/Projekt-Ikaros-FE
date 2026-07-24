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
| 99 | `Guest` | Host (anonym z guest JWT, 15.8) — **sentinel, NENÍ přiřaditelná role**; gating `role <= X` ji nikdy nepustí (`index.ts:15`, BE `user.interface.ts:32`) |

- **Platform-admin gate** = `role <= UserRole.Admin`, tj. jen role 1 a 2 (Superadmin, Admin). Vidět `AdminGuard` (`backend/src/common/guards/admin.guard.ts:17`).
- **Pořadí čísel je významné**: nižší číslo = vyšší moc. Proto `role > UserRole.Admin` = NENÍ admin.
- **Správci obsahu** (Clánky/Galerie/Diskuze) jsou globální obsahové role, ne admini — vidí jen svou frontu „Zpracovat", nemají přístup do `/admin`.
  - **Nově (20.1) = „správce komunity":** tři obsahové role dostaly navíc pravomoc moderovat **generickou** frontu nahlášeného obsahu (`content_report`) napříč VŠEMI plochami, nejen svou (`CONTENT_REVIEWER_ROLES` v `backend/src/modules/moderation/moderation.constants.ts:8`). Zásahy na úrovni účtu (M5–M7) a kategorie „ohrožení nezletilých" ale zůstávají jen Adminovi/Superadminovi. Viz sekce „Nahlašování & moderace obsahu" níže.
- **Ikarus** = běžný přihlášený uživatel. PJ/hráč jsou role uvnitř konkrétního světa (WorldRole), ne globální.

### ⚠️ Zbytkový drift FE vs. BE enum (zmenšen)
BE enum (`backend/src/modules/users/interfaces/user.interface.ts:3`) už drží jen **dvě** legacy hodnoty: `PJ = 3` (runtime reference — default `scheduledMessages.ownerRole` + specs napříč moduly) a `Hrac = 5` (**DEFAULT role při registraci**, `auth.service` / `user.schema`). Hodnoty `Korektor=4, Ctenar=6, Zadatel=7, Zakaz=8` byly odstraněny (D-NEW-INV-CLEANUP, `user.interface.ts:6-16`); čísla zůstávají REZERVOVANÁ, nerecyklovat.
FE enum ani `PJ`, ani `Hrac` nepojmenovává — s hodnotou 5 pracuje jen numericky. Migrace `migrate:d053` přemapuje historické DB hodnoty 3–7 na 9 (Ikarus). Čtení nevaliduje a gating je fail-closed (`role <= Admin`, `=== konkrétní role`) → i stará hodnota v DB se chová jako běžný uživatel.

---

## Granulární admin oprávnění (D-033)

### Model
Definice `AdminPermissions` (`Projekt-ikaros-FE/src/shared/types/index.ts:24`, BE zrcadlo `backend/src/modules/users/interfaces/user.interface.ts:38`). Dva boolean flagy, default všechny `false` (třetí, mrtvý `canEditPlatformPages`, byl 2026-07-12 odstraněn z BE i FE — D-NEW-INV-CLEANUP; ověřeno: v FE `src/` ani BE `src/` už není žádný výskyt kromě náhrobního komentáře `user.interface.ts:35`):

| Flag | Co umožňuje | Kde se VYNUCUJE |
|---|---|---|
| `canManageAdmins` | Admin smí spravovat oprávnění JINÝCH Adminů | `admin.service.ts:772` (setAdminPermissions), kontrola `:785` |
| `canModerateContent` | Admin smí DELETE / UNDELETE cizí účet | `hierarchy.ts:87` (assertCanModerate), kontrola `:106` |

### Jak se přidělují
- Endpoint `PATCH /admin/users/:id/admin-permissions` (`admin.controller.ts:292`), gate `@UseGuards(RolesGuard)` + `@Roles(Superadmin, Admin)` (`:293-294`).
- Smí měnit: **Superadmin** vždy; **Admin** jen pokud má sám `canManageAdmins`.
- **Flag `canManageAdmins` smí přepnout JEN Superadmin** — Admin-manager smí delegovat jen `canModerateContent` (brání řetězovému šíření manage-práva, R-05). Viz `admin.service.ts:797`.
- Cíl musí mít roli `Admin` (jinak `NOT_ADMIN` 400, `admin.service.ts:817`). Granulární práva nemají smysl pro non-adminy.
- Nelze upravit sám sebe (`SELF_FORBIDDEN` 400, `admin.service.ts:805`).
- Merge je delta: aplikují se jen pole přítomná v requestu, ostatní zůstanou (`admin.service.ts:825`).
- Každá změna se auditi (`ADMIN_PERMISSIONS_CHANGE`).

### Hranice / pasti
- `canModerateContent` NEgatuje obsahovou moderaci (články/galerie/diskuze) — ta jede přes obsahové ROLE (viz níže), ne přes tento flag. Flag řídí JEN admin delete účtu.

---

## Platform Admin panel (`/admin`)

### Co to je
Centrální platformový admin hub se 7 obsahovými taby (z toho 1 dev-only) + 8. položkou v liště „Chat", která není tab, ale rozcestník na samostatnou route `/admin/chat` (`PlatformAdminPage.tsx:41`).
- **Kde:** route `/admin`, `Projekt-ikaros-FE/src/features/admin/pages/PlatformAdminPage.tsx`. Tab se drží v URL `?tab=` (whitelist `VALID`, `PlatformAdminPage.tsx:54`; neznámá hodnota → `prehled`).
- **Kdo:** FE `RoleGuard roles={[Superadmin, Admin]}` (`router.tsx:360-366`). BE jednotlivé endpointy `AdminGuard` (role ≤ Admin, `admin.guard.ts:17`).
- **Stav:** ✅

### Taby
1. **Přehled** (`?tab=prehled`) — dashboard se stat-kartami.
2. **Uživatelé** (`?tab=uzivatele`) — správa uživatelů.
3. **Smazané světy** (`?tab=smazane-svety`) — recovery soft-smazaných světů.
4. **Chyby** (`?tab=chyby`) — inbox in-app hlášení chyb (25.1).
5. **Audit log** (`?tab=audit`) — moderátorský audit.
6. **Search index** (`?tab=search-index`) — monitoring + rebuild vyhledávání.
7. **Friendship debug** (`?tab=friendship-debug`) — **jen v DEV buildu** (`import.meta.env.DEV`), na produkci se tab vůbec nevykreslí.

> Pozn.: „Zpracovat" frontu (schvalování username/obsahu) panel ZÁMĚRNĚ neobsahuje — je to osobní fronta na `/ikaros/uzivatele?tab=zpracovat`, ne admin nástroj.

---

### Tab Přehled (dashboard)
- **Co to je:** snapshot platformových metrik ve 4 sekcích + rozcestník.
- **Kde:** `components/OverviewTab/OverviewTab.tsx`. Data z `GET /admin/stats/overview`.
- **Kdo:** FE pod RoleGuardem. BE `admin.controller.ts:73-74` `@UseGuards(AdminGuard)`.
- **Co ukazuje:**
  - Uživatelé: Celkem / Aktivní (online v okně `PRESENCE_THRESHOLD_HOURS`, **default 24 h** — `admin-stats.service.ts:42`, sedí s popiskem karty „Aktivní (24 h)" `OverviewTab.tsx:56`) / Noví (7 dní) / Čeká na smazání.
  - Světy: Celkem.
  - Obsah: Články / Obrázky v galerii / Diskuze.
  - Fronta: Žádosti o username (link na `/ikaros/uzivatele?tab=zpracovat`).
  - Rychlé odkazy: Správa uživatelů (`/admin?tab=uzivatele`), Audit log (`/admin?tab=audit`), Zpracovat frontu (`/ikaros/uzivatele?tab=zpracovat`), Index vyhledávání (`/admin?tab=search-index`) — všechny čtyři jsou živé `<Link>`, žádný disabled placeholder (`OverviewTab.tsx:150-165`).
- **Zvláštnosti:** každá metrika běží přes `safe()` — rozbitý modul vrátí 0 a zaloguje warning, dashboard nikdy nespadne (`admin-stats.service.ts:101`). Pod sekcemi metrik je sekce **Návštěvnost** (15B.7, viz níže).
- **Stav:** ✅
- **Kód:** FE `components/OverviewTab/OverviewTab.tsx`, BE `admin-stats.service.ts:48` (`getOverview`).

---

### Návštěvnost — analytics (15B.7, sekce v Přehledu)
- **Co to je:** self-hosted měření návštěvnosti platformy (page views) — agregát pro provozovatele, žádná data o jednotlivých uživatelích. Žádná 3rd-party, žádné cookies → GDPR-čisté bez consent lišty.
- **Kde:** sekce „Návštěvnost" uvnitř tabu Přehled (`components/AnalyticsSection/AnalyticsSection.tsx`), NE samostatný tab. Data `GET /analytics/summary?days=7|30|90`.
- **Kdo:** FE pod RoleGuardem (Superadmin/Admin). BE `analytics.controller.ts:42-43` summary `@UseGuards(JwtAuthGuard, AdminGuard)`. Sběrový endpoint `POST /analytics/pageview` (`:29`) je VEŘEJNÝ (bez guardu — musí počítat i anon návštěvy), jen zapisuje, nic nevrací.
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
- **Stav:** ✅
- **Kód:** FE `components/AnalyticsSection/AnalyticsSection.tsx` + `MiniBarChart.tsx`, `api/useAnalyticsSummary.ts`, `shared/analytics/usePageViewPing.ts`; BE `modules/analytics/{analytics.controller,analytics.service}.ts`, `schemas/analytics-event.schema.ts`.

---

### Růst & retence (19.1, sekce v Přehledu)
- **Co to je:** onboarding trychtýř + retenční ukazatele registrovaných uživatelů — kde lidé v cestě odpadají a kolik se vrací. Vše **odvozené z DB timestampů, žádný nový tracking** (GDPR-čisté).
- **Kde:** sekce „Růst & retence" uvnitř tabu Přehled (`components/GrowthSection/GrowthSection.tsx`, za Návštěvností), NE samostatný tab. Data `GET /admin/stats/growth?days=7|30|90`.
- **Kdo:** FE pod RoleGuardem (Superadmin/Admin). BE `getStatsGrowth` `@UseGuards(AdminGuard)` (Admin+; `admin.controller.ts:86-87`).
- **Co ukazuje:**
  - **Trychtýř** 5 milníků: Registrovaní → Vstoupil do světa → Má postavu → Zahrál si (world chat) → Hází kostkou (odhad „hraje"). Každý = distinct uživatelé (all-time) + přírůstek z nováčků za období. Konverze % mezi kroky.
  - **Retence:** Vrátilo se po registraci (aktivace), Lepkavost WAU/MAU, Aktivní 7 d, Aktivní 30 d.
  - **Kohorty:** tabulka měsíc registrace × registrací / aktivních dodnes / % drží.
  - **Akvizice:** návštěvníci (z 15B.7) → registrace → poměr.
  - Přepínač období nováčků 7/30/90 (default 30).
- **Odkud data (odvozeně, `min(createdAt)` per uživatel):** `users.createdAt` (registrace), `worldmemberships.joinedAt` (svět), `characters` (isNpc=false + userId), world `chatmessages` (worldId≠null, senderId; hody `isDiceRoll`). Akvizice čte `AnalyticsService.getSummary().totals.visitors`.
- **Hranice / co neumí:**
  - **⚠️ Pravá week-over-week kohortní retence NEJDE** (dluh **D-19.1-RETENCE**, 2026-07-19 překlopen z `docs/dluhy.md` do `docs/roadmap3.md` karty 28.2 + 29.9 — pořád otevřený) — v DB je jen přepisovaný `lastSeenAt` bez historie; retence je **snapshot k dnešku**, ne časová řada. UI to čestně označuje.
  - **Aktivace je aproximace** (`lastSeenAt − createdAt > 24 h`) — guard přepisuje `lastSeenAt` i na registračním requestu.
  - **Krok „příchod → registrace"** se na konkrétní anonymní návštěvu nenapojuje (bez sledování identity nejde) — jen agregátní poměr.
  - **„První hra" jako entita neexistuje** → proxy = první hod kostkou / world-chat zpráva.
  - **Global chat (Hospoda/Camp, worldId=null) se do funnelu nepočítá** — má TTL 1 h, jen world chat je durable.
- **Zvláštnosti:** cache 15 min per období (agregace přes `chatmessages` je dražší). Každý dílčí dotaz přes `safe()` — chyba → 0/[] + warning, dashboard nespadne. `distinct` počítán aggregation `$group`+`$count` (ne velké pole).
- **Stav:** ✅
- **Kód:** FE `components/GrowthSection/{GrowthSection,FunnelChart}.tsx`, `api/{useGrowthStats,growth.types}.ts`; BE `admin-growth.service.ts`, `admin.controller.ts:86`, `dto/growth-stats.dto.ts`.

---

### Náklady (19.2, sekce v Přehledu)
- **Co to je:** počítadla provozních nákladů — **jen měření, žádné vynucování**. Kolik obsahu platforma drží a co ji stojí Cloudinary.
- **Kde:** sekce „Náklady" uvnitř tabu Přehled (`components/CostsSection/CostsSection.tsx`, za Růstem). Data `GET /admin/stats/costs`.
- **Kdo:** FE RoleGuard (Superadmin/Admin). BE `getStatsCosts` `@UseGuards(AdminGuard)` (Admin+; `admin.controller.ts:114-115`).
- **Co ukazuje (tři vrstvy):**
  - **A — počty blobů:** celkem + podle typu (galerie, mapy světů, taktické scény, emotky, obrázky stránek, bestie, obrázky světů) + nejnáročnější světy. Odvozené `countDocuments`.
  - **B — přesné byty** jen kde je DB má: chat přílohy (`attachments[].size`) + admin PDF (`sizeBytes`).
  - **C — skutečný provoz Cloudinary** (`api.usage()`): úložiště / přenos / transformace / kredity / plán. Když chybí creds (dev/disk) → sekce skrytá (`available:false`).
- **Hranice / co neumí:**
  - **⚠️ Velikost obrázků v bytech se z DB nedopočítá** (dluh **D-19.2-BYTES**, 2026-07-19 překlopen z `docs/dluhy.md` do `docs/roadmap3.md` karty 29.6 — pořád otevřený) — schémata drží jen `imageUrl`/`publicId`. Vrstva A jsou **počty souborů, ne velikost**; skutečný objem dává jen Cloudinary (C) + chat/PDF (B).
  - **AI (Fáze 18) neexistuje** → žádná AI počítadla; placeholder „až Fáze 18".
  - **Vynucování kvót** (blok/upozornění při překročení) NENÍ — je to **navazující krok** roadmapy.
  - Cloudinary `/usage` je **account-level**, ne per-svět.
- **Zvláštnosti:** cache 1 h. Cloudinary volání v try/catch → chyba/absence creds neshodí endpoint (`available:false`). Cloudinary config parsuje `CLOUDINARY_URL` v konstruktoru (idempotentní, globální SDK singleton).
- **Stav:** 🚧 měření ✅ / vynucování limitů (blok/upozornění při překročení) neexistuje = další krok
- **Kód:** FE `components/CostsSection/CostsSection.tsx`, `api/{useCostStats,costs.types}.ts`; BE `admin-costs.service.ts`, `admin.controller.ts`, `dto/cost-stats.dto.ts`.

---

### Motivy a skiny (20.6, sekce v Přehledu)
- **Co to je:** read-only přehled využití všech vizuálních voleb platformy — **jen měření, podklad pro osekání** málo využívaných motivů/skinů. Žádný nový tracking, čistá agregace stavu DB.
- **Kde:** sekce „Motivy a skiny" uvnitř tabu Přehled (`components/ThemeUsageSection/ThemeUsageSection.tsx`, za Náklady). Data `GET /admin/stats/theme-usage`.
- **Kdo:** FE RoleGuard (Superadmin/Admin). BE `getStatsThemeUsage` `@UseGuards(AdminGuard)` (Admin+; `admin.controller.ts:101-102`).
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
  - Žádné časové řady — snapshot k `generatedAt`.
- **✅ VYŘEŠENO (D-064):** `World.themeId` už **nemá schema default** — dřívější `default: 'modre-nebe'` odstraněn (`backend/src/modules/worlds/schemas/world.schema.ts:54`, `@Prop() themeId?: string` `:62`), repository nedosazuje fallback (`worlds.repository.ts:260`), `undefined` = „PJ nevybral" a výchozí vzhled dopočítá FE (`DEFAULT_WORLD_THEME = 'ikaros'`, `src/themes/registry.ts:40`; `worldTheme.ts:19`). Dimenze „Motiv světa" tedy vykazuje `noChoice` korektně a `'modre-nebe'` se u světů už falešně nejeví jako „mimo nabídku".
- **Zvláštnosti:** cache 15 min (single-slot). 3 membership dimenze jedním `$facet` scanem; users/worlds po jednom `$group`. Každá dimenze přes `safe()` — chyba → prázdná dimenze + warning, přehled nespadne. FE klasifikuje syrová BE ID přes theme registry (názvy, scope, legacy detekce) — BE je „hloupé".
- **Stav:** ✅ přehled funguje / osekávání nabídky = krok 2 (neimplementováno)
- **Kód:** FE `components/ThemeUsageSection/{ThemeUsageSection.tsx,themeUsage.lib.ts}`, `api/{useThemeUsageStats,themeUsage.types}.ts`; BE `admin-theme-usage.service.ts`, `admin.controller.ts`, `dto/theme-usage.dto.ts`. Spec `docs/arch/phase-20/spec-20.6-vyuziti-motivu-skinu.md`.

---

### Tab Uživatelé (správa)
- **Co to je:** filtrovatelná tabulka uživatelů + per-řádek a bulk akce.
- **Kde:** `components/UsersAdminTab/UsersAdminTab.tsx` → `users/components/UsersTab/UsersTable.tsx`. Data `GET /admin/users`. Deep-link `?tab=uzivatele&search=<username>` předvyplní hledání (init-only; přepnutí tabu param zahodí) — používá „Otevřít v administraci" z veřejného profilu.
- **Kdo:** FE RoleGuard. BE všechny endpointy `AdminGuard`; navíc per-akce hierarchy check.
- **Co jde dělat (per řádek):**
  - **Změna role** (dropdown, jen 6 globálních rolí `ASSIGNABLE_ROLES`). `PATCH /admin/users/:id/role` (`admin.controller.ts:152-153`, `AdminGuard`).
  - **Podporovatel — udělit / odebrat** (19.4 freemium) — `PATCH /admin/users/:id/supporter` (`{ isSupporter }`, `admin.controller.ts:169-170`, gate `AdminGuard` = Admin+). Tlačítko v řádku „★ Podporovatel" / „Udělit podporu" (`UsersTable.tsx:276-289`, hook `useAdminSetSupporter` `useAdminUsers.ts:143`). Audit `SUPPORTER_GRANT` / `SUPPORTER_REVOKE`.
  - **Ban / Odbanovat** — `POST /admin/users/:id/ban` + `/unban`. Ban má důvod + trvání (modal); 0/undefined = trvalý, jinak timed (`bannedUntil`). Ban revokuje všechny refresh tokeny → force logout, invaliduje ban cache, emit `user.identity.changed`.
  - **Smazat účet / Obnovit smazání** — `POST /admin/users/:id/request-deletion` (30denní soft-delete hold, povinný důvod) + `/cancel-deletion`. Vyžaduje `canModerateContent` (pro Admina). Spustí PJ handover (viz níže).
  - **Granulární oprávnění** (jen u cílů s rolí Admin, jen pro Superadmina / Admin-managera) — checkboxy „Správa adminů" (Superadmin-only) a „Moderace obsahu".
  - **Reset hesla** (D-NEW-INV-ADMIN-UI, jen Superadmin, ne self) — `PUT /users/:id/reset-password` (`{ newPassword }`, 8–128, 204). BE heslo negeneruje/nevrací — dočasné heslo generuje FE (`generateTempPassword`, editovatelné), po nastavení zůstává v modalu ke zkopírování. `ResetPasswordModal.tsx`.
  - **Změnit e-mail** (D-NEW-INV-ADMIN-UI, jen Superadmin, ne self) — `PATCH /admin/users/:id/email` (`{ email }`; gate `@UseGuards(RolesGuard)` + `@Roles(Superadmin)`, `admin.controller.ts:186-188` — jediný endpoint panelu nad prahem Admin). Prefill současné adresy; `SAME_EMAIL` 400 / `EMAIL_TAKEN` 409 field-level, self → 403 `SELF_MODIFICATION`. Nová adresa je `emailVerified: false` (bez confirm mailu). `AdminChangeEmailModal.tsx`.
- **Co jde dělat (toolbar):**
  - **Nový uživatel** (D-NEW-INV-ADMIN-UI) — `POST /admin/users` (`{ email, username 3–32, password 8–128, role? }`). Validace zrcadlí BE DTO; `EMAIL_TAKEN`/`USERNAME_TAKEN` field-level; heslo lze vygenerovat + zkopírovat; role select respektuje hierarchii (Admin nenabízí admin role). Audit `USER_CREATE`. `CreateUserModal.tsx` (tlačítko v `UsersAdminTab.tsx`).
- **Co jde dělat (bulk, `BulkToolbar.tsx`):**
  - Bulk Banovat (trvání permanent/1/7/30/90 dní + důvod), Bulk Odbanovat, Bulk Změnit roli.
  - Best-effort: server vrací `{ successful[], failed[] }`, per-user hierarchy check; selhání jednoho neshodí dávku.
- **Filtry:** username (text), role, „má pending username request".
- **Hierarchy pravidla (`helpers/hierarchy.ts`, `assertCanChangeRole:51` / `assertCanModerate:87`):**
  - Nikdo nesmí měnit/moderovat sám sebe (`SELF_MODIFICATION`).
  - Superadmin smí cokoli (kromě sebe).
  - Admin NESMÍ měnit roli ani moderovat jiného Admina/Superadmina; nesmí povyšovat na admin role.
  - DELETE/UNDELETE navíc vyžaduje `canModerateContent`.
- **Hranice / co neumí:**
  - **✅ VYŘEŠENO (FIX-1 + D-NEW-INV-CLEANUP):** filtry `includeDeleted` / `hasPendingDeletion` už řeší **repository query přímo**, takže stránkování i `total` sedí — dřívější in-memory filtr po paginaci vracel děravé stránky (`admin.service.ts:156-160`, `usersRepo.findAllPaginated(opts)`).
- **Zvláštnosti:** `A+` badge u Admina = má `canManageAdmins`. Self řádek je v akcích zamčený. Veškeré akce auditovány + invalidují stats/audit/public-profile cache.
- **Stav:** ✅
- **Kód:** FE `users/components/UsersTab/UsersTable.tsx`, `BulkToolbar.tsx`, hooky `users/api/useAdminUsers.ts`; BE `admin.controller.ts:127` (`GET /admin/users`), `admin.service.ts:146` (`getUsers`), `helpers/hierarchy.ts`.

---

### Tab Smazané světy (recovery)
- **Co to je:** seznam soft-smazaných světů s možností obnovy do 30 dní.
- **Kde:** `components/DeletedWorldsTab/DeletedWorldsTab.tsx`. Data `useDeletedWorlds`, akce `POST /worlds/:id/restore` (`worlds.controller.ts:229`).
- **Kdo:** FE RoleGuard (Superadmin/Admin). BE = worlds modul — restore je jediná admin pojistka, která funguje **bez elevace** (obnova opuštěného světa + dosazení PJ); ostatní zásahy do světa (nastavení/mazání/členové/kalendář) vyžadují od FIX-19 aktivní elevaci pro daný svět, viz kap. 09 sekce I.
- **Co jde dělat:** Obnovit svět (vrátí stránky/postavy/chat, vlastník zase získá přístup). Zobrazuje zbývající dny do trvalého smazání cronem (zvýraznění ≤ 5 dní).
- **Hranice:** po 30 dnech cron svět trvale smaže (hard delete ~40 kolekcí). Z tohoto tabu nelze trvale smazat ručně.
- **Stav:** ✅
- **Kód:** FE `components/DeletedWorldsTab/DeletedWorldsTab.tsx`.

---

### Tab Chyby (in-app hlášení chyb) — 25.1
- **Co to je:** Admin inbox hlášení chyb od uživatelů. Kanál sběru = **Vypravěč** (menu „Nahlásit chybu", persona-aware — viz kap. 07). Bug ≠ obsahová moderace → **oddělená entita** `bug_reports`, ne modul `moderation`.
- **Kde:** tab `?tab=chyby` v `/admin` (`PlatformAdminPage.tsx`, `ChybyTab.tsx`). Filtr Nové / Vyřešené.
- **Kdo:** FE `RoleGuard [Superadmin, Admin]` (tab v panelu). BE `GET /bug-reports` + `POST /bug-reports/:id/resolve` = `JwtAuthGuard + RolesGuard @Roles(Superadmin, Admin)` (`bug-reports.controller.ts`). Non-admin → 403, anon → 401.
- **Co jde dělat:** filtrovat nové/vyřešené · přečíst text + auto-kontext (čas, přihlášený/anonym, persona-mluvčí, route, verze buildu, userAgent, nepovinný e-mail reportera) · označit „Vyřešeno" (`markResolved`).
- **Hranice / co neumí:** bez detailu/threadu, bez odpovědi reporterovi (V1 e-mail se jen uloží), bez kategorií, bez screenshotu (→ V2). Reporty se **nemažou** (audit).
- **Zvláštnosti:** intake `POST /bug-reports` je **veřejný** (anon i přihlášený, `OptionalJwtAuthGuard`), rate-limit `@Throttle(5/min/IP)`; `reporterId` se bere z tokenu, ne z body. Discord notifikace nového reportu přes globální `AlertService` (webhook `DISCORD_ALERT_WEBHOOK`, fire-and-forget — selhání report neshodí; unikátní dedupeKey per report). `url` v kontextu je bez query stringu (PII/GDPR).
- **Stav:** ✅ (BE modul + testy 8/8; FE tab + persona formulář)
- **Kód:** FE `src/features/admin/components/ChybyTab/ChybyTab.tsx` + `src/features/admin/api/useBugReports.ts`; formulář `src/shared/vypravec/ui/VypravecPanel.tsx` (ChybaView). BE `backend/src/modules/bug-reports/` (controller/service/repository/schema/dto), registrace `app.module.ts`. Testy `backend/test/bug-reports.e2e-spec.ts` + `bug-reports-throttle.e2e-spec.ts`.

### Tab Audit log
- **Co to je:** log moderátorských akcí s filtrací.
- **Kde:** `users/components/AuditLogTab/AuditLogTab.tsx`. Data `GET /admin/audit-log`.
- **Kdo:** FE RoleGuard. BE `admin.controller.ts:412-413` `AdminGuard`.
- **Co jde dělat:** procházet záznamy (actor, cíl, akce, before/after JSON, důvod, čas), filtr podle akce + stránkování. Read-only.
- **Auditované akce — úplný BE výčet (`admin-audit-log.interface.ts:1-33`, 28 hodnot):** ROLE_CHANGE, USER_CREATE, USERNAME_REQUEST_APPROVED/REJECTED, BAN, UNBAN, DELETE, UNDELETE, DELETION_REACTIVATED, HARD_DELETE, PERMISSIONS_CHANGE, ADMIN_PERMISSIONS_CHANGE, ACCOUNT_SELF_DELETE_REQUEST, ACCOUNT_DELETE_REQUEST, ACCOUNT_DELETE_CANCEL, ACCOUNT_SELF_REACTIVATE, ACCOUNT_HARD_DELETE (system cron actor), BULK_BAN/UNBAN/ROLE_CHANGE, IKAROS_NEWS_ARCHIVE/UNARCHIVE/DELETE (D-067), WORLD_ELEVATION_ACTIVATED/REVOKED (elevace ve světě), SUPPORTER_GRANT/REVOKE (19.4), EMAIL_CHANGE (D-NEW-INV-ADMIN-UI).
- **`targetType`** (`admin-audit-log.interface.ts:40`): `user` (default u starších záznamů) | `ikaros-news` | `world`.
- **Zvláštnosti:** audit je best-effort — selhání zápisu nikdy neblokuje business akci (`admin.service.ts:102-115`, prázdný `catch`).
- **⚠️ Zbytkový drift (zmenšen, obousměrný — 2 hodnoty):** FE typ `AdminAuditAction` (`src/shared/types/index.ts:209-239`) a BE typ se rozcházejí ve dvou položkách:
  - FE má navíc `FRIENDSHIP_COOLDOWN_RESET` (`index.ts:220`, label `AuditLogTab.tsx:18`) — v BE typu není, BE takový záznam nikdy nezapíše → mrtvý label.
  - BE má navíc `EMAIL_CHANGE` (`admin-audit-log.interface.ts:33`) — FE typ ho nezná, tedy ani `ACTION_LABELS`/`ACTION_CLASS` → **záznam o admin změně e-mailu se v UI zobrazí bez lidského popisku** (fallback).
  - Dřívější drift „DELETE/UNDELETE/HARD_DELETE/BULK_* nejsou olabelované" **už neplatí** — FE je labeluje (`AuditLogTab.tsx:19-30`).
- **Stav:** ✅ (se zbytkovým label driftem `FRIENDSHIP_COOLDOWN_RESET` / `EMAIL_CHANGE`)
- **Kód:** FE `users/components/AuditLogTab/AuditLogTab.tsx:7` (label mapa), BE `admin.controller.ts:412`, `repositories/admin-audit-log.repository.ts`.

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

Samostatná full-screen stránka (ne tab panelu) pro interní komunikaci a organizaci týmu správy. Tři podsystémy pod jedním shellem (konverzace vlevo, obsah uprostřed, úkoly vpravo). Vše pod BE prefixem `admin-chat`, guard `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Superadmin, Admin)` **class-level na všech třech controllerech** — ověřeno: `platform-chat.controller.ts:37-39`, `platform-documents.controller.ts:32-34`, `admin-tasks.controller.ts:28-30`.

- **Kde:** route `admin/chat` (`router.tsx:368-377`, `loader: requireAuth` + `RoleGuard roles={[Superadmin, Admin]}`). FE `features/admin/chat/pages/AdminChatPage.tsx`. Layout běží ve full-height chat módu (`IkarosLayout.tsx:824` `isAdminChat`).
- **Kdo (celá stránka):** FE RoleGuard Superadmin+Admin; BE stejné role na každém endpointu. Žádný jiný přístup.
- **Stav:** ✅ (jediné věcné omezení = Cloudinary free cap 10 MB na PDF, viz Dokumenty níže).

### Konverzace (chat)
- **Co to je:** vícekanálový interní chat týmu správy. Reuse chatového jádra (`ChatChannel`/`ChatMessage` přes DI tokeny `IChatChannelRepository`/`IChatMessageRepository`, jako global-chat).
- **Kde:** BE `platform-chat.controller.ts` — ověřený výčet endpointů: `GET /admin-chat/channels` (`:43`), `GET /admin-chat/unread` (`:49`), `POST /channels/:channelId/read` (`:55`), `GET /channels/:channelId/messages` (`:64`), `POST /channels/:channelId/messages` (`:77`), `DELETE /channels/:channelId/messages/:messageId` (`:86`), `PUT /channels/:channelId/messages/:messageId/reactions/:emoji` (`:96`), `POST /channels/:channelId/upload` (`:106`), `POST /channels` (`:130`), `PATCH /channels/:channelId` (`:139`), `DELETE /channels/:channelId` (`:148`). WS `platform-chat.gateway.ts` (`platform-chat:join/leave`, event `platform-chat:message`). FE `api/useAdminChat.ts`.
- **Kdo:** čtení/psaní = každý admin (Sa+Admin). **Zakládání / úprava / mazání konverzace = jen Superadmin** — ověřeno metodovým `@Roles(UserRole.Superadmin)` nad `POST /channels` (`:131`), `PATCH /channels/:channelId` (`:140`), `DELETE /channels/:channelId` (`:149`), navíc gate na FE tlačítkách. Členství per-konverzace: `accessMode:'all'` (všichni správci) nebo `'members'` + `allowedMemberIds` (vybraní přes checkbox v `ChannelModal.tsx`).
- **Co jde dělat:** psát zprávy (real-time WS echo + dedupe), zakládat konverzace (Superadmin), určit členy (všichni / vybraní), přejmenovat, smazat (ne seed).
- **Seed konverzace:** „Hlavní" (`staff-main`, accessMode all) + „Vedení" (`staff-vedeni`) v marker-skupině `__platform_staff__`; seed = jen přejmenování, nelze smazat.
- **Hranice / co neumí:** žádné soukromé 1:1 (záměr — vytvoří je Superadmin jako `members` konverzaci); bez TTL zpráv; **obrázkové přílohy v chatu ANO** (2026-07-04, upload endpoint), PDF dokumenty mají samostatný modul Dokumenty; bez emoji reakcí na zprávy (emoji jen do textu).
- **Zvláštnosti:** WS room `platform-chat:{channelId}` gatuje admin roli i členství; po reconnectu re-join.
- **Chat parita (2026-07-04, §4.E / CH-053):** přepojeno z vlastního `<input>` na sdílený composer (`AdminChatComposer`, jádro z `ChannelComposer`) + `MessageList`/`MessageItem`. Umí: multiline (**Enter** odešle / **Shift+Enter** nový řádek), emoji picker, **Ctrl+V** obrázků/GIF + upload (`POST /admin-chat/channels/:id/upload`, folder `platform-chat/`), **odpověď** (`replyToId`), **mazání** (`DELETE .../messages/:id` — Superadmin NEBO odesílatel; WS `platform-chat:message:deleted`), **typing** indikátor (WS `platform-chat:typing`). Klikací afordance (přílohy jako karty, skok na citovaný originál). `RoleStar` u jména přes prop `renderSenderBadge`.
- **Emoji reakce + odkazy (2026-07-05):** **reakce** na zprávy (`PUT /admin-chat/channels/:cid/messages/:mid/reactions/:emoji` → celá zpráva; WS `platform-chat:message:updated`; reagovat smí admin s přístupem do kanálu) + **klikací http(s) odkazy** v textu (sdílený `linkify`, XSS-safe — viz [05](05-komunikace-platformy.md) §20.6).
- **Avatar + role-odznak (2026-07-04):** zpráva i panel úkolů ukazují avatar odesílatele z profilu (`senderAvatarUrl`, fallback ze `/staff` dle `senderId`) + `RoleStar` dle globální role.
- **Notifikace (2026-07-04):** nová zpráva → web push (PWA, kategorie `adminChat`, default ZAP, opt-out v profilu → Nastavení notifikací → „Správa platformy") + in-app badge „Chat správy" v Administraci. Příjemci WS `platform-chat:activity`: `all` → všichni Sa+Admin, `members` → `allowedMemberIds`+Superadmini.
- **Persistentní unread badge (2026-07-05, 20.5b):** badge „Chat správy" **přežije reload i offline zprávy** (dřív efemérní WS counter). BE seed `GET /admin-chat/unread` = per-konverzace `{channelId,count}` přes `messageRepo.countAfter` (zprávy s `_id > lastReadMessageId`); read-state v kolekci **`channelreadstatus`** (reuse world-chat vzoru, klíč `{userId,channelId}` — admin `ChatChannel._id` globálně unikátní, žádná kolize se světem). `POST /admin-chat/channels/:id/read` značí přečteno po poslední zprávu (volá se při otevření konverzace, per-kanál jako svět). Odesílatel má vlastní zprávu rovnou přečtenou (`upsert` v `sendMessage`). Živý tik = WS `platform-chat:activity` → invalidace `unread` query (nízká frekvence → refetch stačí). FE: `useAdminChatLive` (root seed+WS), `useAdminChatUnreadTotal` (badge součet), `useMarkAdminChatRead`. **Bez nové kolekce/migrace.**
- **Stav:** ✅
- **Kód:** FE `features/admin/chat/pages/AdminChatPage.tsx`, `api/useAdminChat.ts` (+`useAdminChatUnread`/`useAdminChatUnreadTotal`/`useMarkAdminChatRead`), `api/useAdminChatLive.ts`, `components/ChannelModal.tsx`; BE `modules/platform-chat/platform-chat.{controller,service,gateway}.ts`, read-state reuse `modules/chat` (`IChannelReadStatusRepository`, exportováno v `chat.module.ts`).

### Sdílené dokumenty (PDF)
- **Co to je:** společný sklad PDF dostupný všem adminům (nahrát / číst / stáhnout). Bez AI, jen úložiště.
- **Kde:** BE `platform-documents.controller.ts`, prefix `admin-chat/documents` (`:32`): `GET` seznam (`:38`), `GET /:id/view` čtečka (`:49`), `POST` upload (`:61`), `PATCH /:id` rename (`:83`), `DELETE /:id` (`:92`). FE `api/useAdminDocuments.ts`, DocumentsView v `AdminChatPage.tsx`.
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
- **Stav:** ✅ kód hotový; **věcný limit** — do 10 MB funguje, nad 10 MB blokuje Cloudinary free plán (viz Hranice).
- **Kód:** FE `api/useAdminDocuments.ts`, DocumentsView v `AdminChatPage.tsx`; BE `modules/platform-chat/platform-documents.{controller,service}.ts`, `modules/upload/upload.service.ts:uploadPlatformDocument`.

### Úkoly týmu
- **Co to je:** TODO seznam per admin, veřejně viditelný mezi všemi adminy (pravý panel, rozevírací per osoba).
- **Kde:** BE `admin-tasks.controller.ts`, prefix `admin-chat/tasks` (`:28`): `GET` (`:34`), `GET /staff` (`:40`), `POST` (`:45`), `PATCH /:id` (`:50`), `DELETE /:id` (`:59`). FE `api/useAdminTasks.ts`, TasksPanel v `AdminChatPage.tsx`.
- **Kdo:** vidí všichni admini; **vlastní úkoly edituje každý admin, cizí jen Superadmin** (gate v service). Skupiny podle seznamu správců (`listStaff` → `usersRepo.findByRoles([Superadmin, Admin])`).
- **Co jde dělat:** přidat úkol, odškrtnout (toggle done), upravit text, smazat — dle oprávnění výše.
- **Hranice / co neumí:** bez termínů, priorit, přiřazování cizímu adminovi (úkol patří tomu, kdo ho vytvořil, resp. jeho skupině).
- **Stav:** ✅
- **Kód:** FE `api/useAdminTasks.ts`, TasksPanel v `AdminChatPage.tsx`; BE `modules/platform-chat/admin-tasks.{controller,service}.ts`.

---

## Vyhledávání (search modul)

- **Co to je:** vyhledávání stránek v rámci JEDNOHO světa, kombinace dvou providerů.
- **Kde:** `GET /search?q=...&worldId=...&count=...&provider=...` (`backend/src/modules/search/search.controller.ts`).
- **Kdo:** běžný vyhledávací endpoint = class-level `JwtAuthGuard` (přihlášený; `search.controller.ts:32-33`, `@Get()` `:43`). Indexovací endpointy `/search/created` (`:97-98`), `/updated` (`:107-108`), `/deleted` (`:117-118`), `/reindex` (`:127-128`), `/rebuild` (`:147-148`) mají navíc `AdminGuard`.
- **Provideři (`search.module.ts`):**
  1. **MeiliSearch** (`meili-search.service.ts`) — fulltext. Host `MEILI_HOST` (default `http://localhost:7700`), `MEILI_API_KEY`.
  2. **EmbeddingSearchService** (`embedding-search.service.ts`) — sémantické embeddingy (ONNX model + vptree), Mongo `PageEmbedding`.
  - `SearchCoordinator` výsledky obou interleavuje (round-robin dedupe podle slug/id).
- **Bezpečnost (klíčové):**
  - `worldId` je POVINNÝ (`WORLD_ID_REQUIRED`, `search.controller.ts:62`) — globální search bez něj by leakoval názvy stránek privátních světů (D-NEW-global-search-access-leak).
  - Access check: `worldsService.findByIdForRequester` → 404 u privátního světa bez membershipu.
  - Page-level filtr: výsledky se protnou s `findVisibleSlugs` → AKJ/access-chráněné stránky se neleaknou (N-35).
- **Hranice / zvláštnosti:**
  - **MeiliSearch je POVINNÝ infra prvek (Docker).** Bez běžícího MeiliSearchu provider vrátí prázdno a chybu jen zaloguje jako warning (`meili-search.service.ts:97` v `search()`; obdobně `:65` konfigurace indexu a `:75` počáteční rebuild) → fulltext mlčky nefunguje, API kontrakt drží (graceful degrade), žádná tvrdá chyba.
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
- **Kdo:** FE `RoleGuard roles={[Superadmin, Admin]}` (`router.tsx:380-389`). BE `assertGlobalCanManage`: `role > Admin` → `NOT_PLATFORM_ADMIN` 403 (`emotes.service.ts:64-70`).
- **Co jde dělat:** vytvořit / upravit (name, shortcode, image) / smazat globální emote.
  - `GET /emotes/global` (čte každý přihlášený), `POST /emotes/global` (Admin+), `PATCH /emotes/global/:id` (Admin+), `DELETE /emotes/global/:id` (Admin+).
- **Hranice:** limit globálních emotů `EMOTE_LIMIT_GLOBAL = 200` (FE konstanta `features/world/chat/emotes/lib/types.ts:44`, zobrazena přes `EmoteCounter` `IkarosEmotesAdminPage.tsx:70`). Mazání bez soft-delete (potvrzení jen přes `confirm()`).
- **Zvláštnosti:** per-world emoty jsou jiná věc (PJ světa, `POST /emotes/:worldId`); admin globální emoty vidí všichni uživatelé ve všech světech. Real-time broadcast přes `emotes.gateway.ts`.
- **✅ OPRAVENO 2026-07-05 (SEC-11, RUN-2026-07-05):** create/update/copy DTO byly importované přes `import type` → class-validator metadata chyběla, `POST`/`PATCH /emotes/global` i per-svět vracely 400 na každý pokus (vytváření/úprava emotů bylo úplně nefunkční, přestože stránka vypadala hotová). Teď skutečný `import` — funguje.
- **Stav:** ✅
- **Kód:** FE `IkarosEmotesAdminPage.tsx` + `features/world/chat/emotes/*` (sdílené komponenty/hooky), BE `modules/emotes/emotes.controller.ts`.

---

## Export dat / GDPR (data-export modul)

- **Co to je:** GDPR export VLASTNÍCH dat uživatele do JSON (čl. 15/20).
- **Kde:** `GET /data-export/me` (`backend/src/modules/data-export/data-export.controller.ts:21`, class-level `@UseGuards(JwtAuthGuard)` `:17`). FE: tlačítko **„Stáhnout moje data (JSON)"** v profilu → sekce „Účet" (`AccountSection`) a v `DeleteAccountModal` (nabídka exportu před smazáním účtu). Hook `useDataExport` (`src/features/profile/api/useDataExport.ts:30`).
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
- **Kdo (reviewer set):** frontu i akce **M0–M4** vidí „správci komunity" — `Superadmin, Admin, SpravceClanku, SpravceGalerie, SpravceDiskuzi` (`CONTENT_REVIEWER_ROLES`). **Account-level M5–M7 + kategorie „ohrožení nezletilých"** jen `Superadmin, Admin` (`ACCOUNT_LEVEL_ROLES`). FE u ne-admina M5–M7 z výběru skryje, BE gate vynutí (403). Gating v `moderation.service.ts` (`resolveReport:223`, reviewer check `:228`, account-level check `:245-246`) + providery (`content-report.provider.ts:31` `canHandle` → `isContentReviewer`, `appeal-review.provider.ts:33` totožně). Definice setů `moderation.constants.ts:8` (`CONTENT_REVIEWER_ROLES`) a `:17` (`ACCOUNT_LEVEL_ROLES`); `requiresAccountLevel` (`:56`) pouští gate i pro kategorii `MinorSafety` bez ohledu na akci.
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

- **Username change requests** — `GET /admin/username-requests` (`admin.controller.ts:317`), `POST /username-requests/:id/approve` (`:334`), `/reject` (`:354`), všechny `AdminGuard`. FE je obsluhuje ve frontě „Zpracovat" (`/ikaros/uzivatele?tab=zpracovat`), ne v `/admin` panelu. Approve/reject auditováno + posílá notifikační mail žadateli.
- **Recent pages** — `GET /admin/recent-pages` (`admin.controller.ts:440`), gate `@UseGuards(RolesGuard)` + `@Roles(Superadmin, Admin)` (`:441/:444`). Nedávno upravené stránky napříč platformou.
- **Admin friendships (D-056)** — `GET /admin/friendships` (`admin.controller.ts:462`), `GET /friendships/by-pair` (`:478`), `POST /friendships/:id/reset-cooldown` (`:489`), všechny `AdminGuard`. Lookup přátelství usera + reset cooldownu. FE má jen DEV-only „Friendship debug" tab.
- **Bulk akce nad uživateli** — `POST /admin/users/bulk-ban` (`:375`), `/bulk-unban` (`:387`), `/bulk-role-change` (`:396`), `AdminGuard`. Obsluhuje `BulkToolbar` v tabu Uživatelé.
- **Obsahová moderace (Zpracovat)** — schvalování článků/galerie/diskuzí je gatováno OBSAHOVÝMI ROLEMI, ne admin flagy:
  - Články: `Superadmin, Admin, SpravceClanku` (`ikaros-articles/article-review.provider.ts:8-12`).
  - Galerie: `Superadmin, Admin, SpravceGalerie` (`ikaros-gallery/gallery-review.provider.ts:9`).
  - Diskuze: `Superadmin, Admin, SpravceDiskuzi`.
  - Tito správci se NEdostanou do `/admin`, vidí jen svou frontu „Zpracovat".
  - **Nahlašování obsahu (20.1, `content_report`)** — kterýkoli z těchto tří správců (+ Admin/Superadmin) moderuje **generickou** frontu reportů napříč všemi plochami (`CONTENT_REVIEWER_ROLES`); M5–M7 + „ohrožení nezletilých" jen Admin+. Podrobně viz sekce „Nahlašování & moderace obsahu" výše.

---

## Provozní endpointy bez UI (telemetrie)

### Sběr porušení CSP (24.2)
- **Co to je:** sběrné místo pro hlášení prohlížeče o tom, že Content-Security-Policy něco zablokovala. Slouží k odhalení **vlastních chyb ve whitelistu** — do 24.2 běžel enforce naslepo a jediným detektorem byl uživatel s rozbitou stránkou.
- **Kde:** `POST /api/csp-report`. **Žádné UI** — volá ho přímo prohlížeč na základě direktiv `report-uri` / `report-to` v CSP hlavičce z FE nginxu (`default.conf.template`).
- **Kdo:** **veřejný, bez autentizace** — reporty posílá prohlížeč, který u nich neposílá cookies ani hlavičky. Kompenzace: `@Throttle` 30 req/min/IP (`csp-report.controller.ts:38`), ořez všech logovaných polí na 200 znaků, body limit 64 kB.
- **Co jde dělat:** přijímá **oba** formáty — `report-uri` (`application/csp-report`, objekt `{"csp-report":{…}}`, kebab-case) i `report-to` (`application/reports+json`, pole reportů, camelCase). Normalizuje je na trojici direktiva / blokovaná URL / stránka a zapíše `logger.warn` (`CSP blok: img-src → … (na …)`).
- **Hranice / co neumí:** **neukládá do DB** — jen log, žádná fronta ani UI přehled. Deduplikace 10 min per porušení (max 500 klíčů in-memory, klíč bez query stringu) → opakované porušení se v logu neobjeví. Čítač je **per instance BE**, při více replikách by se dedupe rozešel. Vrací vždy 204, i na nesmyslné tělo (prohlížeč odpověď nečte).
- **Zvláštnosti:** ① Content-types `application/csp-report` a `application/reports+json` expressí json parser **sám nečte** → parser je registrovaný zvlášť (`csp-report.body-parser.ts`, sdílený s e2e testem, aby konfigurace nedriftovala). ② Controller bere `body: unknown` **schválně** — globální `ValidationPipe` má `forbidNonWhitelisted`, takže jakékoli DTO by na kebab-case polích vracelo 400. ③ Reporty CSP nepodléhají `connect-src`, doména se whitelistovat nemusí.
- **Stav:** ✅ (BE endpoint bez FE UI — UI se neplánuje; účinnost závisí na CSP direktivách z FE nginx šablony, viz Kód).
- **Kód:** BE `common/csp-report/csp-report.controller.ts:19`, `csp-report.service.ts:33` (normalizace + dedupe `:112`), `csp-report.body-parser.ts`; FE `default.conf.template` (direktivy `report-uri`/`report-to` + hlavička `Reporting-Endpoints`).

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-ADMIN-UI) — **Reset hesla má UI.** Tlačítko „Reset hesla" v tabulce uživatelů (Superadmin-only, ne self) → `ResetPasswordModal` s generovaným heslem + copy. (`useAdminResetPassword`)
2. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-ADMIN-UI) — **Create user má UI.** Tlačítko „Nový uživatel" nad filtry → `CreateUserModal` (validace dle `CreateUserAdminDto`, field-level TAKEN chyby). (`useAdminCreateUser`)
3. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-ADMIN-UI) — **Admin změna cizího e-mailu.** Nový BE `PATCH /admin/users/:id/email` (Superadmin-only, `SAME_EMAIL`/`EMAIL_TAKEN`/`SELF_MODIFICATION`, audit `EMAIL_CHANGE`, `emailVerified: false`) + FE tlačítko „Změnit e-mail" → `AdminChangeEmailModal`. (`useAdminUpdateUserEmail`)
4. ✅ VYŘEŠENO 20.2/§C1 — **Data export má FE tlačítko.** „Stáhnout moje data (JSON)" v profilu → Účet a v `DeleteAccountModal` (`useDataExport` → `GET /data-export/me` → Blob download). Dřív BE bez FE.
5. ✅ VYŘEŠENO 2026-07-14 (21.3a) — **DungeonBuilderPage = stub.** Admin route + stub smazány; tvorba podzemí je per-world `/svet/:slug/podzemi` napojená na BE `dungeon-maps` (kap. 14 §14.6).
6. ✅ VYŘEŠENO 2026-07-12 (D-NEW-INV-CLEANUP) — **`canEditPlatformPages` = mrtvý flag.** Flag **odstraněn z BE i FE**; ověřeno grepem — v `Projekt-ikaros-FE/src/` **nula výskytů**, v `backend/src/` jediný výskyt je náhrobní komentář (`user.interface.ts:35`). Ve starých user docech může hodnota v subdocu `adminPermissions` přežívat, nikde se nečte.
7. **`canModerateContent` ≠ obsahová moderace** — POŘÁD PLATÍ. Flag gatuje JEN admin delete/undelete účtu (`hierarchy.ts:106`). Schvalování článků/galerie/diskuzí jede přes obsahové role (`article-review.provider.ts:8`). Název flagu mate.
8. **Audit-log label drift (zmenšen, obousměrný)** — POŘÁD PLATÍ, ale jinak, než tvrdil původní zápis:
   - FE má navíc `FRIENDSHIP_COOLDOWN_RESET` (`src/shared/types/index.ts:220`, label `AuditLogTab.tsx:18`) — v BE typu není → mrtvý label.
   - BE má navíc `EMAIL_CHANGE` (`admin-audit-log.interface.ts:33`) — FE typ ho nezná → audit záznam o admin změně e-mailu se v UI zobrazí bez popisku.
   - **Neplatí už**: „FE neumí labelovat DELETE/UNDELETE/HARD_DELETE/BULK_*" — labely doplněny (`AuditLogTab.tsx:19-30`).
9. ✅ VYŘEŠENO — **Overview „Index vyhledávání" placeholder.** Rychlý odkaz je živý `<Link to="/admin?tab=search-index">` bez `disabled` i bez textu „Připravujeme" (`OverviewTab.tsx:162-165`; grep na „Připravujeme"/„13.1" v souboru = 0 zásahů).
10. ✅ VYŘEŠENO — **Overview „Aktivní (24 h)".** BE default práh je 24 (`admin-stats.service.ts:42`, `configService.get('PRESENCE_THRESHOLD_HOURS', 24)`) a popisek karty říká „Aktivní (24 h)" (`OverviewTab.tsx:56`) — sedí.
11. **BE enum legacy role (zmenšeno)** — POŘÁD PLATÍ, ale jen ve dvou hodnotách: `PJ = 3` a `Hrac = 5` (`user.interface.ts:17/20`). `Korektor=4, Ctenar=6, Zadatel=7, Zakaz=8` **odstraněny** (D-NEW-INV-CLEANUP). Pozor: `Hrac = 5` **není** čistý reziduál — je to DEFAULT role při registraci (`auth.service`, `user.schema`), kterou FE enum nepojmenovává a pracuje s ní jen numericky. To je ostřejší drift než „legacy k vyčištění".
12. ✅ VYŘEŠENO (FIX-1 + D-NEW-INV-CLEANUP) — **`getUsers` in-memory filtr.** `includeDeleted`/`hasPendingDeletion` řeší repository query přímo, stránkování i `total` jsou konzistentní (`admin.service.ts:156-161`).
13. **MeiliSearch tichý fail** — POŘÁD PLATÍ. Bez běžícího Docker MeiliSearchu fulltext vrací prázdno bez tvrdé chyby (jen `logWarn`). Provozní past. (`meili-search.service.ts:93-99`)
14. ✅ VYŘEŠENO — **Stale komentář o „dvojitém uu".** V `article-review.provider.ts` už žádný takový komentář není; BE i FE shodně `SpravceClanku` (`article-review.provider.ts:8-12`).
15. **Admin-chat dokumenty nad 10 MB (Cloudinary free limit)** — POŘÁD PLATÍ (věcný limit poskytovatele, ne stav kódu). Upload PDF > 10 MiB padá na 502 (`File size too large, Maximum is 10485760`). `upload_chunked_stream` + multer 30 MB jsou v kódu, ale account cap chunked neobejde. Odloženo (uživatel: „nech pro budoucnost") — trvalé řešení = disk úložiště pro velké soubory nebo placený Cloudinary plán. (`upload.service.ts:uploadPlatformDocument`, `platform-documents.controller.ts:61`)
16. ✅ VYŘEŠENO (D-064) — **`World.themeId` schema default.** `default: 'modre-nebe'` odstraněn (`worlds/schemas/world.schema.ts:54`, `:62`), repository nedosazuje fallback (`worlds.repository.ts:260`) → sekce „Motivy a skiny" už u světové dimenze nevykazuje falešné „mimo nabídku".
17. **Dual-source bot seznam (analytics)** — POŘÁD PLATÍ. `BOT_UA_RE` v BE je ruční kopie nginx mapy z 15B.1; změna na jednom místě vyžaduje sjednocení i druhého.
18. **Odložené (překlopeno 2026-07-19 do `docs/roadmap3.md`, ne do `docs/dluhy.md`):** `D-19.1-RETENCE` → karty 28.2 + 29.9 (bez historie `lastSeenAt` nejde pravá kohortní retence) · `D-19.2-BYTES` → karta 29.6 (velikost obrázků v bytech se z DB nedopočítá). Obě pořád otevřené.

> **Pozn. k ověřování nasazení:** tato kapitola popisuje **stav kódu na HEAD**, ne stav produkce. Co reálně běží, se ověřuje za běhu — `GET /health` vrací `version.sha` (zkrácený commit běžícího buildu) + `builtAt` (`backend/src/app.controller.ts:53`, pole `:155-156`); `builtAt` se mění JEN deployem, uptime i restartem. Z tohoto dokumentu se stav nasazení odvozovat nedá.
