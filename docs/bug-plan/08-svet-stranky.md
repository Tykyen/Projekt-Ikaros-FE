# 08 — Svět: stránky / wiki / search

Wiki stránky světa (CRUD, typy, AKJ chráněné záložky, directory, backlinks, oblíbené, šablony) a full-text + embedding vyhledávání (MeiliSearch + Granite ONNX per-world s access check).

**BE:** `pages` (pages.controller, pages.service, pages.repository, dto, schemas), `world-page-templates` (controller, service), `search` (search.controller, search.coordinator, meili-search.service, embedding-search.service, embedding-queue)
**FE:** `features/world/pages` — PageViewerPage, PageEditorPage, PagesListPage, PagesAdminPage; AkjTabsPanel, AkjDecryptedBanner, AccessDenied; PageSidebar, BacklinksPanel; api hooks (usePage, usePagesDirectory, useCreatePage, useUpdatePage, useDeletePage, useFavoritePage, usePageMeta, usePageBacklinks, useWorldPageTemplates)
**Routy:** `/svet/:slug/stranky`, `/svet/:slug/nova-stranka`, `/svet/:slug/edit/:slug`, `/svet/:slug/:slug` (catch-all viewer), `/svet/:slug/admin/stranky`

---

## A. Stránky CRUD — BE service + controller

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-01 | `GET /worlds/:worldId/pages/:slug` — neexistující stránka → 404 s `code: PAGE_NOT_FOUND` (ne 500) `[auto]` | M3 | ⬜ |
| SS-02 | `POST /worlds/:worldId/pages` — slug se ukládá lowercase i když klient pošle uppercase `[auto]` | M3 | ⬜ |
| SS-03 | `POST` — slug již existuje v daném světě → 409 `PAGE_SLUG_TAKEN` `[auto]` | M3 | ⬜ |
| SS-04 | `POST` — stejný slug v jiném světě je přípustný (žádný unique conflict) `[auto]` | M1 | ⬜ |
| SS-05 | `PATCH /worlds/:worldId/pages/:id` — page patří jinému světu → 403 `PAGE_WORLD_MISMATCH` `[auto]` | M3 | ⬜ |
| SS-06 | `PATCH` — optimistic concurrency: `expectedUpdatedAt` neodpovídá server timestamp → 409 `PAGE_CONFLICT` s `serverUpdatedAt` `[auto]` | M3 | ⬜ |
| SS-07 | `PATCH` bez `expectedUpdatedAt` — uložení proběhne bez chyby (pole volitelné) `[auto]` | M1 | ⬜ |
| SS-08 | `DELETE /worlds/:worldId/pages/:id` — neexistující stránka → 404 `[auto]` | M3 | ⬜ |
| SS-09 | `DELETE` — stránka patří jinému světu → 403 `PAGE_WORLD_MISMATCH` `[auto]` | M3 | ⬜ |
| SS-10 | `GET /worlds/:worldId/pages/directory` — filtr `?type=A,B` (CSV split) vrátí pouze stránky odpovídajících typů `[auto]` | M1 | ⬜ |
| SS-11 | `GET /worlds/:worldId/pages/dataSlugs` — vrátí string[] slugů světa (bez access filtru) `[auto]` | M1 | ⬜ |
| SS-12 | `GET /worlds/:worldId/pages/data?number=N` — respektuje limit 1–50 (clamp), default 5 `[auto]` | M1 | ⬜ |
| SS-13 | HTML sanitizace: `content` + `sections[].content` — `<script>` odstraněn, `<a>` ponechán `[auto]` | M3 | ⬜ |
| SS-14 | HTML sanitizace: `table.headers[]` + `table.values[]` — rich-text HTML, `<script>` odstraněn `[auto]` | M1 | ⬜ |
| SS-15 | `findRandom` — count vždy v rozmezí 1–50 (clamp), žádná výjimka pro count=0 nebo count=999 `[auto]` | M1 | ⬜ |
| SS-16 | Search index — `addPageToIndex` se zavolá při `create` a `updatePageInIndex` při `update` (async fire-and-forget, chyba se jen loguje, nenhazuje) `[auto]` | M1 | ⬜ |
| SS-17 | `delete` — `deletePageFromIndex` se zavolá s `page.slug` (ne `id`) `[auto]` | M1 | ⬜ |
| SS-18 | Oblíbené — `POST /:slug/favorite` — `@CurrentUser()` se do service nepředává; oblíbené nejsou per-user (ukládají se na world.favoritePageSlugs) — záměrné, ale nechybí autorizace? `[human]` | M4 | ⬜ |

## B. Write-access gating (assertCanWrite)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-19 | Platform Admin/Superadmin obcházejí world membership check — create/update/delete projde bez membership `[auto]` | M3 | ⬜ |
| SS-20 | Hráč bez membership → 404 WORLD_NOT_FOUND (ne 403) při create/update/delete `[auto]` | M3 | ⬜ |
| SS-21 | Hráč s `WorldRole.Hrac` (< PomocnyPJ) → 403 PAGE_FORBIDDEN při create/update/delete `[auto]` | M3 | ⬜ |
| SS-22 | PomocnyPJ (role=4) může vytvořit/upravit/smazat stránku `[auto]` | M3 | ⬜ |
| SS-23 | Neexistující svět při write (Hrac requester) → 404 WORLD_NOT_FOUND (auth-leak-policy: 404 ne 403) `[auto]` | M3 | ⬜ |

## C. AKJ access gating — page-level (assertAccess)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-24 | Stránka bez `accessRequirements` → volný přístup pro všechny přihlášené `[auto]` | M3 | ⬜ |
| SS-25 | `type: 'AKJ'` — hráč s `membership.akj >= required` → přístup; hráč s nižším → 403 `[auto]` | M3 | ⬜ |
| SS-26 | `type: 'Role'` — hráč s `membership.role >= required` → přístup; nižší → 403 `[auto]` | M3 | ⬜ |
| SS-27 | `type: 'UserId'` — hráč s matchujícím userId → přístup (OR s ostatními) `[auto]` | M3 | ⬜ |
| SS-28 | `type: 'AKJType'` — klíč resolved z `worldSettings.akjTypes`, `membership.akj >= group.level` → přístup `[auto]` | M3 | ⬜ |
| SS-29 | `type: 'AKJType'` — neznámý klíč (zombie key) → 403 (group nenalezena, level=0, akj≥0 nestačí pro defenzivní větev) `[human]` | M4 | ⬜ |
| SS-30 | OR logika: stačí splnit JEDNU podmínku z více `accessRequirements` → přístup `[auto]` | M1 | ⬜ |
| SS-31 | PomocnyPJ (WorldRole >= 4) — page-level AKJ obcházen bez ohledu na vlastní akj úroveň `[auto]` | M3 | ⬜ |
| SS-32 | PJ (WorldRole=5) — page-level AKJ obcházen `[auto]` | M1 | ⬜ |
| SS-33 | Platform Admin (UserRole.Admin) — obcházen i bez world membership `[auto]` | M3 | ⬜ |
| SS-34 | Platform Superadmin — obcházen i bez world membership `[auto]` | M3 | ⬜ |
| SS-35 | Hráč s nedostatečným AKJ (regresní test) — i když má Platform role `UserRole.Hrac`, dostane 403 `[auto]` | M3 | ⬜ |

## D. AKJ chráněné záložky — per-tab gating (filterAkjTabsForViewer)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-36 | PJ (WorldRole=5) vidí všechny záložky — auto-bypass `[auto]` | M3 | ⬜ |
| SS-37 | Platform Admin/Superadmin vidí všechny záložky i bez world membership `[auto]` | M3 | ⬜ |
| SS-38 | PomocnyPJ **nemá** auto-bypass pro záložky — vidí jen záložky, kde splní `tab.access` `[auto]` | M3 | ⬜ |
| SS-39 | Hráč s clearance 5: záložky s AKJ≤5 viditelné, AKJ>5 odstraněny z response `[auto]` | M3 | ⬜ |
| SS-40 | Hráč s UserId grantem: vidí záložku chráněnou svým UserId i bez clearance `[auto]` | M3 | ⬜ |
| SS-41 | Hráč bez jakéhokoli grantu: `akjTabs: []` (prázdné, žádný leak existence záložek) `[auto]` | M3 | ⬜ |
| SS-42 | `findByWorld` (listing) — per-item filtrace záložek voláním `filterAkjTabsForViewer` — PomocnyPJ nevidí záložky mimo svůj grant v listingu `[human]` | M4 | ⬜ |
| SS-43 | AKJ tabs sanitizace: `contentOverride.content` — `<script>` odstraněn při create i update `[auto]` | M3 | ⬜ |
| SS-44 | Čerstvá záložka (preset 'pj') v editoru — výchozí `access: [{ type: 'Role', value: '4' }]` (PomocnyPJ) `[auto]` | M1 | ⬜ |

## E. shieldedBy — directory stub karty + meta endpoint

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-45 | `GET /pages/directory` — chráněná stránka (AKJ nesplněn) → `shieldedBy` přítomno, `accessRequirements` v response chybí (privacy) `[auto]` | M3 | ⬜ |
| SS-46 | Directory — hráč s dostatečným AKJ → `shieldedBy: undefined` `[auto]` | M3 | ⬜ |
| SS-47 | `GET /pages/meta/:slug` — neexistující stránka → 404 `[auto]` | M1 | ⬜ |
| SS-48 | `GET /pages/meta/:slug` — AKJ nesplněn → `shieldedBy` obsahuje AKJ level `[auto]` | M3 | ⬜ |
| SS-49 | `GET /pages/meta/:slug` — AKJType s neznámým key → fallback `akjLabel = key`, `level: undefined` `[auto]` | M3 | ⬜ |
| SS-50 | `shieldedBy` nikdy neobsahuje `type: 'UserId'` entry (privacy) `[auto]` | M3 | ⬜ |
| SS-51 | Role requirement → `shieldedBy` obsahuje `roleLabel` česky `[auto]` | M3 | ⬜ |
| SS-52 | N+1 problém: membership + akjSettings se v `findDirectory` načtou jednou pro celý listing (ne per-stránka) `[auto]` | M1 | ⬜ |

## F. Backlinks (7.1l)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-53 | `GET /pages/:slug/backlinks` — neexistující cílová stránka → 404 `[auto]` | M1 | ⬜ |
| SS-54 | Cílová stránka chráněna AKJ — requester bez přístupu → 403 (neleakujeme existenci přes backlinks endpoint) `[auto]` | M4 | ⬜ |
| SS-55 | Backlinky od stránek, ke kterým requester nemá přístup, jsou tiše vynechány (silent skip) `[auto]` | M1 | ⬜ |
| SS-56 | Regex pattern v `findBacklinksToSlug` zachytí `href="/svet/slug"` i `href="slug"` (bare slug) tvary `[auto]` | M1 | ⬜ |
| SS-57 | Self-link (stránka odkazuje sama na sebe) → ve výsledku chybí `[auto]` | M1 | ⬜ |

## G. Page-Character unification (9.1 / 9.2)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-58 | Create `PostavaHrace`/`NPC` bez `characterRef` → auto-create Character entity (`kind: 'persona'`) `[auto]` | M1 | ⬜ |
| SS-59 | Create `Lokace` bez `characterRef` → auto-create Character entity (`kind: 'location'`) `[auto]` | M1 | ⬜ |
| SS-60 | Create s existujícím `characterRef` → nový Character se **nevytváří** (migrace-safe) `[auto]` | M1 | ⬜ |
| SS-61 | Update: přechod wiki typ → `PostavaHrace` bez `characterRef` → auto-create Character `[auto]` | M1 | ⬜ |
| SS-62 | Update: přechod `Lokace` → `PostavaHrace` → `Character.kind` sync na `'persona'` (syncKind) `[auto]` | M1 | ⬜ |
| SS-63 | Update: přechod persona/Lokace → jiný typ → `characterRef` v response `undefined` (vyčistí se) `[auto]` | M1 | ⬜ |
| SS-64 | `PageDirectoryEntry.id` = page ID ≠ `characterId`; pro characterId použít `page.characterRef.characterId` (past, D-063) `[human]` | M4 | ⬜ |

## H. Šablony stránek (world-page-templates)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-65 | `GET /worlds/:worldId/page-templates` — bez role gate (všichni přihlášení mohou číst) `[auto]` | M1 | ⬜ |
| SS-66 | `POST /page-templates` — Korektor (WorldRole=3) ve světě může vytvořit šablonu `[auto]` | M3 | ⬜ |
| SS-67 | `POST /page-templates` — hráč bez membership → 404 WORLD_NOT_FOUND; membership s rolí < Korektor → 403 `[auto]` | M3 | ⬜ |
| SS-68 | `POST /page-templates` — duplicitní klíč v daném světě → 409 TEMPLATE_KEY_TAKEN `[auto]` | M3 | ⬜ |
| SS-69 | `PATCH` — změna klíče na existující → 409; změna klíče na stejný (no-op) → 200 `[auto]` | M3 | ⬜ |
| SS-70 | `PATCH` — šablona patří jinému světu → 403 TEMPLATE_WORLD_MISMATCH `[auto]` | M3 | ⬜ |
| SS-71 | `DELETE` — vrátí 204 (no content), ne 200 `[auto]` | M1 | ⬜ |

## I. Search REST (search.controller)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-72 | `GET /search` bez `worldId` → 400 WORLD_ID_REQUIRED (zákaz globálního leaku) `[auto]` | M3 | ⬜ |
| SS-73 | `GET /search` s `worldId` cizího privátního světa → propaguje NOT_FOUND (z `findByIdForRequester`); `coordinator.search` se nezavolá `[auto]` | M3 | ⬜ |
| SS-74 | Výsledky se filtrují na slugy patřící danému světu (`pagesRepo.findByWorld(worldId)`) — eliminuje cross-world leaky z MeiliSearch indexu `[auto]` | M1 | ⬜ |
| SS-75 | `GET /search` s prázdným `q` → vrátí `[]` (short-circuit, coordinator se nevolá) `[auto]` | M1 | ⬜ |
| SS-76 | Mutační endpointy (`POST /search/created`, `/updated`, `/deleted`, `/reindex`, `/rebuild`) — chráněny `AdminGuard` (UserRole <= Admin) `[auto]` | M4 | ⬜ |
| SS-77 | `POST /search/reindex` bez `slug` i `pageId` → vrátí message bez volání coordinator (graceful no-op) `[auto]` | M1 | ⬜ |
| SS-78 | `GET /search/providers` — dostupný i bez AdminGuard (všichni přihlášení), vrátí seznam providerů `[auto]` | M1 | ⬜ |

## J. MeiliSearch service

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-79 | `onModuleInit` — selhání MeiliSearch připojení (warn log) nesmí shodit aplikaci `[auto]` | M1 | ⬜ |
| SS-80 | `toDocument` — `table.headers`/`values` jsou stripped (bez HTML tagů) před indexováním `[auto]` | M1 | ⬜ |
| SS-81 | `search` — při MeiliSearch error vrátí prázdné pole (nevyhazuje exception) `[auto]` | M3 | ⬜ |
| SS-82 | Index nenakonfigurován (MeiliSearch není v docker-compose) → search vrátí `[]` tiše (žádný 500 na FE) `[human]` | M1 | ⬜ |
| SS-83 | MeiliSearch index obsahuje `worldId` jako filterable attribute — umožní budoucí per-world meili filter (aktuálně filtr je na BE `findByWorld`) `[human]` | M1 | ⬜ |

## K. Embedding search service

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-84 | `chunkText` — překrývající se chunky s `size=750, overlap=250` → step=500 `[auto]` | M3 | ⬜ |
| SS-85 | `computePageHash` — hash závisí na `title`, `plainText`, `table`, `accessRequirements`; změna obsahu → odlišný hash `[auto]` | M1 | ⬜ |
| SS-86 | Stránka bez změny hashe → `indexPage` přeskočí re-embedding (inkrementální update) `[auto]` | M1 | ⬜ |
| SS-87 | `addPageToIndex`/`updatePageInIndex` — enqueue (async queue), ne přímé awaiting (nesmí blokovat request) `[auto]` | M1 | ⬜ |
| SS-88 | Žádné modely nejsou povoleny (env `EMBEDDING_GRANITE*_ENABLED=false`) → `onModuleInit` loguje warn, search vrátí `[]` `[auto]` | M3 | ⬜ |
| SS-89 | `rebuildIndex` — resetuje embeddings, reindexuje všechny stránky + aktualizuje stats `[auto]` | M1 | ⬜ |
| SS-90 | `buildChunks` — sekce stránek (`sections[].content`) se do chunků NEzahrnují (jen `plainText` + `table`) — potenciální mezera ve full-text pokrytí `[human]` | M1 | ⬜ |

## L. FE PageViewer

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-91 | `usePage` — 403 → AccessDenied screen (ne retry); 404 → PageNotFound screen `[auto]` | M2 | ⬜ |
| SS-92 | `usePage` — 403/404 → retry false; ostatní chyby → max 2 retry `[auto]` | M1 | ⬜ |
| SS-93 | Viewer volí správný layout dle `page.type` (Lokace→LokaceLayout, PostavaHrace→PostavaLayout, …) `[auto]` | M1 | ⬜ |
| SS-94 | AkjDecryptedBanner — zobrazen nad obsahem pokud `accessRequirements` obsahují AKJ/AKJType (user má přístup = „dešifrováno") `[auto]` | M3 | ⬜ |
| SS-95 | AkjDecryptedBanner — AKJType resolved z `worldSettings.akjTypes` (level + name) `[auto]` | M3 | ⬜ |
| SS-96 | `resolveAkjTabPage` — prázdná override pole dědí ze základní stránky (nepřepíší prázdnem) `[auto]` | M3 | ⬜ |
| SS-97 | `sortedAkjTabs` — seřadí záložky dle `order`, nemutuje originální pole `[auto]` | M3 | ⬜ |
| SS-98 | AccessDenied screen — zobrazí konkrétní požadavky z `shieldedBy` (AKJ level, AKJType label, role) `[auto]` | M3 | ⬜ |
| SS-99 | AccessDenied — `shieldedBy` chybí → generická zpráva (ne crash) `[auto]` | M3 | ⬜ |
| SS-100 | Catch-all route `/svet/:slug/:slug` — specifické subroutes (nova-stranka, edit, admin, stranky) musí předcházet catch-all `[auto]` | M1 | ⬜ |

## M. FE PageEditor

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-101 | `PageEditorPage` — `WorldRole < PomocnyPJ` → redirect na world dashboard (FE guard) `[auto]` | M2 | ⬜ |
| SS-102 | Edit mode: 403 z `usePage` → redirect na viewer (PJ mohl AKJ záložky omylem zablokovat) `[auto]` | M1 | ⬜ |
| SS-103 | Edit mode: 404 z `usePage` → redirect na nova-stranka `[auto]` | M1 | ⬜ |
| SS-104 | `?type=PostavaHrace` → editor inicializuje type bez překladu (slug klíč i display-name akceptovány) `[auto]` | M1 | ⬜ |
| SS-105 | `useUpdatePage` — po úspěšném PATCH invaliduje directory; pokud slug se změnil, smaže starou detail cache `[auto]` | M2 | ⬜ |
| SS-106 | `useCreatePage` — po POST pre-seed detail cache (`qc.setQueryData`) → viewer hned vidí data bez extra fetch `[auto]` | M1 | ⬜ |
| SS-107 | Concurrency conflict (409 PAGE_CONFLICT) — editor zobrazí `ConflictModal` s volbou reload vs. force-override `[human]` | M1 | ⬜ |
| SS-108 | `AkjTabsPanel` — fresh PJ záložka má `access: [{ type: 'Role', value: '4' }]` (PomocnyPJ) jako preset `[auto]` | M1 | ⬜ |
| SS-109 | `AkjTabsPanel` — přidání UserId grantu: hledání v members, klik přidá `{ type: 'UserId', value: user.id }` do `tab.access` `[auto]` | M1 | ⬜ |
| SS-110 | `AkjTabsPanel` — AKJType typ se v editoru **nenastavuje** (jen clearance + role + userId); AKJType se dostane jen přes `accessRequirements` stránky, ne záložky — záměrné? `[human]` | M4 | ⬜ |

## N. FE PagesListPage / PagesAdminPage

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SS-111 | PagesListPage — hráč nevidí tlačítko „Nová stránka" (jen PomocnyPJ+) `[auto]` | M3 | ⬜ |
| SS-112 | PagesListPage — favoritePage klik volá `mutate({ slug, nextState: true/false })` `[auto]` | M3 | ⬜ |
| SS-113 | PagesListPage — oblíbené se zobrazí v samostatné sekci nad ostatními `[auto]` | M3 | ⬜ |
| SS-114 | PagesListPage — stránky s `shieldedBy` se renderují jako stub karta (🔒) `[human]` | M4 | ⬜ |
| SS-115 | PagesAdminPage — mazání jedné stránky: confirm modal → `mutateAsync({ id, slug })` `[auto]` | M3 | ⬜ |
| SS-116 | PagesAdminPage — hromadné mazání: volá `mutateAsync` pro každou vybranou stránku `[auto]` | M3 | ⬜ |

---

## Test coverage gaps

- `pages.service.spec.ts` — chybí test pro `findBacklinks` (backlinks access gating, silent skip nepřístupných kandidátů)
- `pages.service.spec.ts` — chybí test pro `update` + optimistic concurrency 409 (expectedUpdatedAt mismatch)
- `pages.service.spec.ts` — chybí test pro `assertAccess` s `type: 'AKJType'` s neznámým zombie-key (zda vrátí 403 nebo projde)
- `search.controller.spec.ts` — chybí test pro slug-filter: coordinator vrátí výsledek s cizím slugem (z jiného světa) a ten musí být odfiltrován
- `search.controller.spec.ts` — chybí test pro `reindex` s validním `slug`/`pageId` (updatePageInIndex se zavolá)
- `world-page-templates.service.spec.ts` — chybí test pro update key na stejný (no-op, žádný 409)
- FE: `PageViewerPage` nemá spec (403/404 větvení, worldLoading stav)
- FE: `PageEditorPage` nemá spec (role redirect, concurrency ConflictModal)
- FE: `AkjTabsPanel` nemá spec (UserId grant, move up/down, preset 'pj')
- FE: `usePagesDirectory` (hook) nemá spec
- FE: `BacklinksPanel` nemá spec

## Známá rizika

- **Oblíbené bez per-user ownership (SS-18)**: `POST/DELETE /:slug/favorite` nepředává `userId` do service — každý přihlášený může upravit world.favoritePageSlugs. Záměrné (oblíbené jsou per-world, ne per-user), ale chybí dokumentace záměru a FE guard.
- **MeiliSearch tichá prázdnota (SS-82)**: Pokud MeiliSearch není v docker-compose, search vrátí `[]` bez jakékoliv indikace pro uživatele. FE nezobrazí error — hráč si myslí, že svět prostě nic nemá. Potenciálně matoucí debug.
- **buildChunks vynechává sections (SS-90)**: Embedding index zpracovává `plainText` + `table`, ale `sections[].content` (samostatné sekce stránek) se nechunkují. Dlouhé sekce nebudou sémanticky vyhledatelné přes embedding search.
- **AKJType v záložkových access pravidlech (SS-110)**: Editor `AkjTabsPanel` nabízí pouze clearance (AKJ číslo), role a UserId. Typ `AKJType` pro záložky nelze nastavit přes UI — pouze `accessRequirements` stránky ho podporují. Specifikace to neřeší explicitně — potenciální funkční mezera.
