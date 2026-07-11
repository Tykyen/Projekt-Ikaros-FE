# Checkpoint — bug / 08-svet-stranky

Datum: 2026-07-11 · RUN-2026-07-11-1213 · styl **bug** (registr `docs/bug-audit.md`, prefix `N-`)
Auditor: read-only, needituje kód. Oblast: `docs/bug-plan/08-svet-stranky.md` (pages / wiki / templates / search).

## Dosažená vs cílová L

- **Cílová L (auto kritické cesty):** L3/L4.
- **Dosažená L:** **L2** (statické čtení L1 + kontrakt/authz/sanitizace reasoning L2 přes celý BE záběr + FE sink verifikace). Pro pages.service / world-page-templates / search.controller / meili / embedding existují unit specy (`pages.service.spec.ts` 37 KB, `search.controller.spec.ts`, `world-page-templates.service.spec.ts`, `embedding-*.spec.ts`) → happy-path je fakticky L3, ale specy jsem v tomto běhu NEspouštěl (M3 neproveden). Doběh na L3/L4 = spustit tyto jesty + doplnit test na 2 nálezy níže (findBacklinks bare-slug, customData non-string).

## Co jsem prošel (plná hloubka)

**BE — celý záběr oblasti (L1+L2):**
- `pages/pages.service.ts` (celé, 1272 ř.): findByWorld/findBySlug/create/update/delete (R-09/R-09b world-gate + per-page assertAccess + rollback DI-04 + RC-D2/P1/P4), ensureAvailableSlug, findDirectory (D-062c shieldedBy, B4b moderationHidden), findAllSlugs (N-37 gate), findVisibleSlugs (N-35), findRandom, findMeta/computeShieldedBy/shieldedFromRequirements, findBacklinks (silent-skip), passesAccess, assertAccess, assertCanViewWorld, filterAkjTabsForViewer, assertCanWrite, isWorldActive, sanitizeTable (PT-36a title fix)/sanitizeCustomData/sanitizeAkjTabs.
- `pages/pages.controller.ts` (routy + FIX-67 number-guard), `dto/create-page.dto.ts` + interface `page.interface.ts`, `repositories/pages.repository.ts` (toEntity, findBacklinksToSlug regex, findDirectory projekce, updateIfUnchanged).
- `world-page-templates/world-page-templates.service.ts` + `.controller.ts` (assertCanManage Korektor+, assertCanViewWorld, key-collision 409, world-mismatch 403, DELETE 204).
- `search/search.controller.ts` (worldId-required, findByIdForRequester gate, findVisibleSlugs filtr N-35, AdminGuard na mutace, reindex N-39b), `search.coordinator.ts`, `meili-search.service.ts` (toDocument strip, graceful degrade, filterable worldId), `embedding-search.service.ts` (N-13 sekce v buildChunks+hash, chunkText step, queue enqueue, model configs).

**FE — sinky + hooky (L1+L2):**
- `PageViewer/layouts/NovinyLayout.tsx`, `PostavaLayout.tsx` (InfoBlockList), `components/PageSidebar.tsx`, `PageSections.tsx` — všechny `dangerouslySetInnerHTML` sinky protaženy k BE zdroji.
- `api/useUpdatePage.ts` (N-38 previousSlug z callera ✓), `usePage.ts` (SS-92 retry 403/404→false ✓), `PageEditor/hooks/useWikilinkExtension.ts` (href=bare slug), `SmartCellInput.tsx`.

## Ověřené spec body (výběr, bez nálezu)

- SS-01/05/08/09 PAGE_NOT_FOUND / PAGE_WORLD_MISMATCH kódy — ✅L2.
- SS-02/03 slug lowercase + auto-suffix (FIX-21, místo 409) — ✅L2 (pozn.: SS-03 už NEvrací 409, chování změněno na auto-suffix — bug-plán zastaralý, ne nález).
- SS-06/07 optimistic concurrency (app-check + atomický updateIfUnchanged RC-P1) — ✅L2.
- SS-13/14 sanitizace content/sections/table headers+values — ✅L2; **SS (nový) title** taky sanitizován (PT-36a fix na `pages.service.ts:61`).
- SS-19..23 assertCanWrite (Admin bypass elevace, 404 WORLD_NOT_FOUND nečlen, 403 PAGE_FORBIDDEN Hrac, PomocnyPJ OK) — ✅L2.
- SS-24..35 assertAccess (AKJ/Role/UserId/AKJType OR, PomocnyPJ+/PJ/Admin bypass, zombie AKJType→403) — ✅L2.
- SS-36..44 filterAkjTabsForViewer (PJ auto-bypass, PomocnyPJ bez bypassu, locked broadcast, UserId grant, owner visibility) — ✅L2.
- SS-45..52 shieldedBy (privacy: UserId nikdy, roleLabel česky, N+1 batch membership/akjSettings) — ✅L2.
- SS-53..55/57 backlinks (404 target, target access-gate, silent skip, self-link `$ne`) — ✅L2. **SS-56 → nález N-RUN-01.**
- SS-58..63 page↔character auto-create/syncKind/cleanup — ✅L2.
- SS-65..71 templates role/collision/mismatch/204 — ✅L2.
- SS-72..78 search worldId-required, access gate, slug-filtr, empty-q short-circuit, AdminGuard mutace, providers open — ✅L2.
- SS-79..89 meili graceful degrade + filterable worldId; embedding chunk step=500 (SS-84), sekce v hashi/chunk (N-13, ruší SS-90 mezeru) — ✅L2.
- SS-91/92/100 FE viewer retry + reserved-slug route order (RESERVED_PAGE_SLUGS) — ✅L2.

## Nálezy

### N-RUN-08-01 — 🆕 🟠 [F Backlinks] „Odkazuje sem" míjí bare-slug wikilinky (kanonická forma)
- **Kde:** `backend/src/modules/pages/repositories/pages.repository.ts:210` (`findBacklinksToSlug`).
- **Úryvek:**
  ```ts
  const pattern = `href=["'][^"']*?(?:/|^)${escaped}(?:["'#?/]|$)`;
  ```
- **Zdroj odkazů:** `[[wikilink]]` autocomplete ukládá interní link jako **bare slug** — `FE PageEditor/hooks/useWikilinkExtension.ts:41` `attrs: { href: item.slug }` → `<a href="atlantida">`. Potvrzeno testy: `useBrokenLinkDecoration.spec.ts:30` `href="atlantida"`, `SmartCellInput.spec.tsx:44` `<a href="aralion">`.
- **Dopad:** `(?:/|^)` vyžaduje **lomítko NEBO začátek celého content-stringu** bezprostředně před slugem. Bare `href="slug"` je uvnitř HTML (pozice ≠ 0) a bez `/` před slugem → regex NEmatchuje. Backlinks (7.1l) tak zachytí jen ručně vložené absolutní odkazy `href="/svet/w/slug"`, ale **NE wikilinky** — což je hlavní/kanonický způsob interního odkazování. Panel „Odkazuje sem" je de-facto prázdný pro běžný obsah. Bug-plán SS-56 tvrdí opak (bare slug „chytne") — mylně; feature není testovaná (viz Test coverage gaps v plánu).
- **Návrh:** `href=["'](?:[^"']*/)?${escaped}(?:["'#?/]|$)` — nepovinný cesta-prefix končící `/`, slug pak buď hned po `"` nebo po posledním `/`. Doplnit repo test s bare i path formou.
- **L:** L2 (statika + potvrzený uložený formát z FE testů).

### N-RUN-08-02 — 🆕 ⭐ [A Stránky/XSS] `customData` non-string obchází sanitizaci → stored XSS (NovinyLayout)
- **Kde:** `backend/src/modules/pages/pages.service.ts:74-83` (`sanitizeCustomData`); DTO `dto/create-page.dto.ts` (`customData?: Record<string,string>` jen `@IsObject()`); sink `FE PageViewer/layouts/NovinyLayout.tsx:66`.
- **Úryvek (BE):**
  ```ts
  for (const [key, value] of Object.entries(customData)) {
    out[key] = typeof value === 'string' ? sanitizeRichText(value) : value; // ne-string projde RAW
  }
  ```
- **Úryvek (FE sink):**
  ```tsx
  <span className={s.metaValue} dangerouslySetInnerHTML={{ __html: value }} /> // value = customData[META_KEY]
  ```
- **Dopad:** `@IsObject()` nevaliduje typy hodnot; `Record<string,string>` je jen compile-time. Autor (PomocnyPJ+) pošle Noviny stránku s `customData: { "Stát": ["<img src=x onerror=…>"] }` (pole/objekt) → `typeof !== 'string'` → sanitizace přeskočí → uloží se raw → NovinyLayout nastaví `innerHTML = array.toString()` = payload → **stored XSS** spustí u KAŽDÉHO diváka stránky (vč. PJ/Admin) = krádež session/cookie, převzetí účtu. Stejná třída jako PT-36a (`table.title`, D-LAUNCH-GAP), ale přes **type-confusion mimo sanitizovanou string-větev** — proto dosud nepokryto. Vyžaduje ne-UI crafted payload + autorskou roli (audience = spolueditoři/PJ/Admin/hráči). String hodnoty jsou sanitizované správně; `table.headers/values` mají `@IsString({each})` (bezpečné), jen `customData` per-value validaci nemá.
- **Návrh:** v `sanitizeCustomData` ne-string coercnout `String(value)` PŘED `sanitizeRichText` (nebo ne-string zahodit); alternativně validovat, že hodnoty jsou stringy (400). Levné, jednořádkové.
- **L:** L2 (BE větev + FE sink protažen; PoC nespuštěn — read-only).

## Drobné / kandidáti (NEeskalováno do N-RUN)

- **`GET /search?count=N` bez clampu** — `search.controller.ts:51` `count = 5` default, ale `Number(count)` jde přímo do providerů; pages endpointy clampují 1–50 (`findRandom`), search ne. Nízké: MeiliSearch `maxTotalHits` (~1000) a VPTree malý dataset limitují dopad. Poznámka pro perf/styl 26.
- **`sanitizeAkjTabs` zavádějící docstring** (`pages.service.ts:88`) zmiňuje „sections, infoBlocks value", ale `AkjTabContentOverride` nese jen `content`+`table` (oboje sanitizováno) → jen mylný komentář, ne bug.
- **type-filtr vs. normalizePageType** — `findByWorld`/`findDirectory` filtrují `?type=` proti DB `type`, ale legacy Zoom je uložen jako `type:'Rodokmen'` (bez familyTree) → `?type=Zoom` je nematchuje. Kosmetika/legacy data, nízké.

## Známé (NEhlásím jako nové — dohledáno v registru/dluhy)

- N-35 (AKJ leak search) ✅ opraveno — `findVisibleSlugs` filtr přítomen.
- N-36 (favorite cizího světa) ✅, N-37 (dataSlugs gate) ✅, N-38 (rename slug cache) ✅ — ověřeno v kódu.
- N-13 (embedding ignoruje sekce) ✅ — sekce v `buildChunks` + `computePageHash`.
- N-39b (reindex cross-world slug přes findAll) — v registru, stále přítomné (`search.controller.ts:137` `findAll()`), NEhlásím znovu.
- PT-36a (stored XSS `table.title`) — D-LAUNCH-GAP; ✅ opraveno (`sanitizeTable` sanitizuje title).
- D-NEW-INV-CLEANUP (Meili tichý fail) — nyní `logWarn`, částečně adresováno.

## PROOF-REQUESTy (pro doběh na L3/L4)

1. Spustit `pages.service.spec.ts` + `world-page-templates.service.spec.ts` + `search.controller.spec.ts` + `embedding-*.spec.ts` (M3) — potvrdit zelené na HEAD.
2. Gap-fill test (M7) pro **N-RUN-08-01**: repo `findBacklinksToSlug` s uloženým `<a href="slug">` (bare) i `<a href="/svet/w/slug">` (path) → oba musí být backlink.
3. Gap-fill test (M7) pro **N-RUN-08-02**: `create`/`update` s `customData:{k:['<img onerror>']}` → po sanitizaci nesmí projít raw HTML (buď coerced+sanitized, nebo 400).
