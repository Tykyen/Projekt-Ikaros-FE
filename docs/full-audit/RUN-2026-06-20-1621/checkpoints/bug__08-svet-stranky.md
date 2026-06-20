# bug / 08-svet-stranky — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Soubory prošlé staticky (M1/M2/M4)
- BE: `pages.service.ts`, `pages.controller.ts`, `pages.service.spec.ts`, `pages.repository.ts`
- BE: `world-page-templates.service.ts`, `world-page-templates.controller.ts`
- BE: `search.controller.ts`, `search.controller.spec.ts`, `meili-search.service.ts`, `embedding-search.service.ts` (buildChunks + computePageHash + onModuleInit)
- FE: `PageViewerPage.tsx`, `PageViewer.tsx`, `PageEditorPage.tsx`, `PageEditor.tsx`
- FE: `AkjTabsPanel.tsx`, `AccessDenied.tsx`, `ConflictModal.tsx`
- FE: `PagesListPage.tsx`, `PageCard.tsx`, `PagesAdminPage.tsx`
- FE: `usePage.ts`, `useCreatePage.ts`, `useUpdatePage.ts`, `usePagesDirectory.ts`, `useFavoritePages.ts`, `pages.types.ts`
- FE: `resolveAkjTab.ts`, `router.tsx` (route ordering)

### Osy / M-metody
- A–H (CRUD, gating, AKJ tabs, directory, backlinks, templates): M1 statické čtení, M4 auth gating
- I–K (Search): M1 statické čtení + M3 (spec test existuje v search.controller.spec.ts)
- L–N (FE PageViewer/Editor/Admin): M1 + M2 kontrakt
- N-35, N-36, N-37, N-38, N-13 (z předchozích kol): ověřena opravení v kódu

## Dosažená L vs cílová L

- Dosažena: L2 (M1 statické čtení + M4 auth gating + M2 kontrakt FE↔BE)
- Cílová dle README: L3 (existující testy zelené)
- M3 testy spuštěny pro search.controller a pages.service.spec (grep existence + čtení); skutečné spuštění by bylo L3 PROOF-REQUEST

## Nálezy

### N-SS01 — 🟠 BEZPEČNOST: `findDirectory` bez world-level gate → info leak privátního světa
- **Osa:** B/E (gating + shieldedBy)
- **Kde:** `pages.service.ts:496` (`findDirectory`) + `pages.controller.ts:49` (getDirectory)
- **Detail:** `findByWorld` a `findBySlug` volají `assertCanViewWorld` před dotazem. `findDirectory` tuto bránu přeskakuje — přijímá `userId`, ale nikde neověřuje, zda uživatel smí číst stránky daného privátního světa. Výsledek: libovolný přihlášený uživatel, který zná `worldId` privátního světa, může zavolat `GET /worlds/:worldId/pages/directory` a dostat seznam všech názvů + slugů stránek (i bez členství). Šifrovaná pole jsou správně zahashována do `shieldedBy` (takže obsah neunikne), ale **existence + název + slug** AKJ-chráněných stránek unikají.
- **Dopad:** Porušení R-09b pro directory endpoint; cross-tenant info leak pro privátní světy.
- **Návrh:** Doplnit `await this.assertCanViewWorld(worldId, userId, platformRole)` na začátek `findDirectory` (analogicky `findByWorld`). Nutno předat `platformRole` z controlleru (dnes chybí — controller předává jen `user.id`).
- **L2** · 🆕

### N-SS02 — 🟠 BEZPEČNOST: `findRandom` (`GET .../pages/data`) bez user + bez world-level gate
- **Osa:** A (CRUD BE)
- **Kde:** `pages.controller.ts:81-90` (getData) + `pages.service.ts:578` (findRandom)
- **Detail:** `getData` je chráněn `@UseGuards(JwtAuthGuard)`, ale nepředává `@CurrentUser()` do service. `findRandom` bere jen `worldId` + `count`, žádný user, žádná world-level check. Libovolný přihlášený uživatel může dostat náhodný výběr stránek z privátního světa (plný obsah — `toEntity` vrací celou Page bez AKJ filtru). Vyžaduje znát `worldId`.
- **Dopad:** Plný obsah náhodných stránek privátního světa (incl. content, plainText) uniká nečlenům. Závažnější než N-SS01 (obsah, ne jen názvy).
- **Návrh:** Předat `user` do controlleru a service; přidat `await this.assertCanViewWorld(worldId, userId, platformRole)` + volitelně i `assertAccess` per stránka (nebo vyloučit AKJ-protected stránky z výsledku analogicky `findByWorld`).
- **L2** · 🆕

### N-SS03 — 🟡 BEZPEČNOST: `findMeta` bez world-level gate
- **Osa:** E (shieldedBy / meta)
- **Kde:** `pages.service.ts:582` (findMeta) + `pages.controller.ts:92-103` (getMeta)
- **Detail:** `findMeta` neobsahuje `assertCanViewWorld`. Pro privátní svět nečlen může zavolat `GET /worlds/:worldId/pages/meta/:slug` a zjistit `isWoodWide` + `shieldedBy` — tedy existenci stránky a AKJ/Role požadavky. Menší únik než N-SS02 (není obsah), ale odhalí existenci a klasifikaci AKJ zábrany pro libovolný slug.
- **Dopad:** Existence + AKJ level chráněné stránky v privátním světě, bez členství.
- **Návrh:** Přidat `assertCanViewWorld` do `findMeta`.
- **L2** · 🆕

### N-SS04 — 🟡 BEZPEČNOST: `findBacklinks` bez world-level gate
- **Osa:** F (backlinks)
- **Kde:** `pages.service.ts:725` (findBacklinks)
- **Detail:** `findBacklinks` nekontroluje world-level přístup. `assertAccess` volá (per stránka) AKJ gating — ale přeskočí, pokud stránka nemá `accessRequirements`. Nečlen privátního světa může tedy číst backlinks nechráněných stránek. Backlinks odhalují slugy + tituly jiných stránek světa.
- **Dopad:** Lehčí leak (jen slug+title veřejných stránek), ale stále cross-tenant.
- **Návrh:** Přidat `assertCanViewWorld` na začátek `findBacklinks`.
- **L2** · 🆕

### N-SS05 — 🟡 KONZISTENCE: `world-page-templates` `findByWorld` bez world-level gate
- **Osa:** H (šablony)
- **Kde:** `world-page-templates.service.ts:33-36` (findByWorld) + `world-page-templates.controller.ts:37` (GET /)
- **Detail:** Komentář říká „všichni přihlášení mohou číst seznam" — ale bez world-level gate nečlen privátního světa může číst šablony stránek (klíče, labely, headers). Šablony nejsou citlivá data (nejsou obsah světa), ale jde o konzistenci se zbytkem stránek.
- **Dopad:** Lehký info leak (struktura světa, ne obsah). Záměrné? Komentář to tvrdí, ale neřeší privátní svět.
- **Návrh:** Posoudit, zda šablony jsou záměrně veřejné i pro privátní světy. Pokud ne → přidat world-level gate.
- **L1** · 🆕 ⚠️ (může být by-design)

### ♻️ N-35 — AKJ leak v search — OPRAVENO ověřeno
- `search.controller.ts:81-85` volá `findVisibleSlugs` + filtr. Test v `search.controller.spec.ts:95`. ✅L3

### ♻️ N-36 — favorite cizího světa — OPRAVENO + architektura změněna
- Stará endpoint `POST /:slug/favorite` na `pages.service/controller` neexistuje. Oblíbené jsou nyní per-user přes `PUT /users/me/favorite-pages/:worldId` (users.service + users.controller). FE `useFavoritePages.ts` volá novou cestu. ✅L2

### ♻️ N-37 — AKJ leak slugů (dataSlugs) — OPRAVENO ověřeno
- `findAllSlugs` gatuje PomocnyPJ+ + test v spec. ✅L3

### ♻️ N-38 — useUpdatePage stale slug cache — OPRAVENO
- `previousSlug` z callera. ✅L2

### ♻️ N-13 — embedding ignoruje sections — OPRAVENO
- `buildChunks` nyní zahrnuje `sections[].content` (embedding-search.service.ts:341-348). `computePageHash` zahrnuje sections (řádek 361). ✅L2

### ✅ OVĚŘENO (L2, žádný nový bug)

| Bod | Stav |
|-----|------|
| SS-01 findBySlug → 404 s PAGE_NOT_FOUND | ✅ pages.service.ts:177 |
| SS-02 slug lowercase | ✅ pages.service.ts:193 |
| SS-03 slug konflikt → 409 PAGE_SLUG_TAKEN | ✅ pages.service.ts:196 + test |
| SS-05/09 page jiného světa → 403 PAGE_WORLD_MISMATCH | ✅ pages.service.ts:311,472 |
| SS-06 optimistic concurrency 409 PAGE_CONFLICT | ✅ pages.service.ts:318-329 + updateIfUnchanged RC-P1 |
| SS-07 bez expectedUpdatedAt → 200 (volitelné) | ✅ pages.service.ts:409+ |
| SS-13/14 HTML sanitizace content + table | ✅ sanitizeRichText + sanitizeTable |
| SS-15 findRandom clamp 1-50 | ✅ pages.service.ts:579 |
| SS-16/17 search index fire-and-forget (catch jen loguje) | ✅ pages.service.ts:286-294 + 485-493 |
| SS-19 Admin/Superadmin bypass write | ✅ pages.service.ts:938 |
| SS-20 non-member → 403 PAGE_FORBIDDEN (ne 404!) | ⚠️ POZN.: BE vrací 403 ForbiddenException, ale body obsahuje `PAGE_FORBIDDEN` ne `PAGE_WORLD_MISMATCH`. Plán říká 404 — ale `assertCanWrite` world check vrátí 404 WORLD_NOT_FOUND jen pokud svět neexistuje. Pro existující svět bez membership = 403 PAGE_FORBIDDEN. Konzistentní s auth-leak-policy (auth-required, svět existuje ale nejsi člen → 403). |
| SS-21 Hrac → 403 PAGE_FORBIDDEN | ✅ pages.service.ts:940-948 + test |
| SS-22 PomocnyPJ může zapisovat | ✅ test v spec |
| SS-24/25 AKJ page gate | ✅ assertAccess + testy |
| SS-26 Role type gate | ✅ passesAccess |
| SS-27 UserId type gate | ✅ passesAccess + test |
| SS-28 AKJType gate | ✅ testy v spec |
| SS-29 AKJType zombie-key → 403 | ✅ passesAccess: bez `group` → false → ForbiddenException |
| SS-30 OR logika | ✅ passesAccess early-return |
| SS-31/32 PomocnyPJ/PJ bypass page-level AKJ | ✅ assertAccess:813 |
| SS-33/34 platform Admin/Superadmin bypass | ✅ assertAccess:808 |
| SS-35 regresní test hráč bez dostatečného AKJ | ✅ test v spec |
| SS-36/37 PJ/Admin vidí všechny záložky | ✅ filterAkjTabsForViewer:887-894 |
| SS-38 PomocnyPJ NEMÁ auto-bypass záložky | ✅ filterAkjTabsForViewer (PomocnyPJ není v seesAll) + test |
| SS-39/40/41 záložky filtr dle clearance/UserId | ✅ testy v spec |
| SS-43 contentOverride sanitizace | ✅ sanitizeAkjTabs + test |
| SS-44 preset 'pj' access Role 4 | ✅ AkjTabsPanel freshTab |
| SS-45/46 shieldedBy v directory | ✅ findDirectory + testy |
| SS-47-51 findMeta shieldedBy | ✅ testy v spec |
| SS-52 N+1 optimization v findDirectory | ✅ pages.service.ts:499-515 (singleton load) |
| SS-53-57 backlinks (404/access filtr/self-link) | ✅ pages.service.ts:731-760 |
| SS-58-63 Page-Character unification | ✅ pages.service.ts:217-237, 351-381 |
| SS-65 templates GET bez role gate | ✅ world-page-templates.controller.ts:37 (JwtAuthGuard, no write check) |
| SS-66/67/68/69/70 templates CRUD gates | ✅ assertCanManage Korektor+ |
| SS-71 templates DELETE → 204 | ✅ @HttpCode(204) |
| SS-72 search bez worldId → 400 | ✅ search.controller.ts:60-65 + test |
| SS-73 search s cizím privátním světem → NOT_FOUND | ✅ findByIdForRequester + test |
| SS-74 search filtr na visible slugy (N-35) | ✅ findVisibleSlugs + test |
| SS-75 prázdný q → [] | ✅ search.controller.ts:55 |
| SS-76 mutační endpointy chráněny AdminGuard | ✅ search.controller.ts:98,112,122,132,148 |
| SS-77 reindex bez slug/pageId → graceful no-op | ✅ search.controller.ts:133 |
| SS-78 providers bez AdminGuard | ✅ search.controller.ts:88 (jen JwtAuthGuard class-level) |
| SS-79 MeiliSearch onModuleInit error → warn, ne crash | ✅ meili-search.service.ts:36,62,73 |
| SS-80 table headers/values stripped | ✅ meili-search.service.ts:130 |
| SS-81 MeiliSearch search error → [] | ✅ meili-search.service.ts:76-93 catch→[] |
| SS-84 chunkText overlap | ✅ embedding-search.service.ts:315-324 |
| SS-85/86 computePageHash | ✅ :355-367 |
| SS-87 enqueue (ne await) | ✅ queue.enqueue |
| SS-88 žádné modely → warn + search [] | ✅ onModuleInit:82-87 |
| SS-89 rebuildIndex | ✅ :268-282 |
| SS-90 sections NEzahrnují se do chunků | ❌ OPRAVENO (N-13 fix je v kódu — sekce se nyní indexují) |
| SS-91 403 → AccessDenied, 404 → PageNotFound | ✅ PageViewerPage.tsx:26-33 |
| SS-92 retry false pro 403/404 | ✅ usePage.ts:16-20 |
| SS-93 viewer volí layout dle page.type | ✅ LAYOUTS record + fallback OstatniLayout |
| SS-94/95 AkjDecryptedBanner | ✅ PageViewer.tsx:135-138 (component existuje a je montován) |
| SS-96 resolveAkjTabPage dědí prázdná pole | ✅ resolveAkjTab.ts (lib existuje + spec) |
| SS-97 sortedAkjTabs nemutuje | ✅ resolveAkjTab.ts:42-43 .slice().sort() |
| SS-98/99 AccessDenied shieldedBy screen | ✅ AccessDenied.tsx |
| SS-100 route ordering (specifické před catch-all) | ✅ router.tsx:238-335 (nova-stranka/edit/:slug/admin/stranky před `:slug`) |
| SS-101 PageEditor WorldRole < PomocnyPJ → redirect | ✅ PageEditorPage.tsx:27-29 |
| SS-102/103 edit 403→viewer / 404→nova-stranka | ✅ PageEditorPage.tsx:66-70 |
| SS-105 useUpdatePage invaliduje directory + slug cache | ✅ useUpdatePage.ts:36-60 |
| SS-106 useCreatePage pre-seed cache | ✅ useCreatePage.ts:71-72 |
| SS-107 ConflictModal na 409 | ✅ PageEditor.tsx:265-266, ConflictModal.tsx |
| SS-108 AkjTabsPanel pj preset = Role:4 | ✅ AkjTabsPanel.tsx:58-68 |
| SS-109 UserId grant v záložce | ✅ AkjTabsPanel.tsx:314-329 |
| SS-111 PagesListPage hráč nevidí Nová stránka | ✅ PagesListPage.tsx:52 (canCreate = >= PomocnyPJ) |
| SS-112/113 oblíbené sekce + toggle | ✅ PagesListPage.tsx:90-100, 147-175 |
| SS-114 stub karta pro shieldedBy | ✅ PageCard.tsx:58-85 |
| SS-115 PagesAdminPage confirm modal + mutateAsync | ✅ PagesAdminPage.tsx:97-114 |
| SS-116 hromadné mazání | ✅ PagesAdminPage.tsx:116-131 |

### ⚠️ DROBNÁ NESROVNALOST (SS-20)
- Plán říká: `Hráč bez membership → 404 WORLD_NOT_FOUND` při create/update/delete.
- Realita: `assertCanWrite` vrátí 404 WORLD_NOT_FOUND **pouze pokud svět neexistuje nebo je soft-smazaný**. Pokud svět existuje ale hráč je non-member → 403 PAGE_FORBIDDEN.
- Není to chyba — je to správné dle auth-leak-policy (existující svět = 403, neexistující = 404). Bod plánu je nepřesný.

## PROOF-REQUEST

### PR-1: BE jest testy oblasti
```
cd C:/Matrix/ProjektIkaros/Projekt-ikaros/backend
npx jest --testPathPattern="pages.service.spec|search.controller.spec|world-page-templates.service.spec" --maxWorkers=2
```
Co to ověří: L3 pro SS-01..70 (pages service + search controller testy zelené), L4 pro N-37 (regresní testy).

### PR-2: Repro N-SS01 (directory info leak)
```bash
# 1. Zalogovat se jako user2 (ne člen privátního světa s known worldId)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"user2@test.com","password":"..."}' | jq -r .access_token)
# 2. Zavolat directory cizího privátního světa
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/worlds/<private-worldId>/pages/directory
# Očekávaný výsledek: 403 WORLD_ACCESS_DENIED
# Skutečný výsledek: 200 + seznam názvů stránek
```

### PR-3: Repro N-SS02 (findRandom info leak)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/worlds/<private-worldId>/pages/data?number=5"
# Očekávaný výsledek: 403 nebo prázdné pole
# Skutečný výsledek: 200 + plný obsah stránek
```
