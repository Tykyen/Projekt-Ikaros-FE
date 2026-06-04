# 04 — Svět: stránky / wiki / AKJ

Nejhlubší oblast na `PC` (konzistence cest) a `DD` (vrstvení) — stránka je **jeden zdroj se šesti
dveřmi**: REST detail, REST seznam/directory, **search index**, **embedding** (semantic), **slugs**
(wikilink suggestions), **favorite**. Každé dveře musí ctít stejný AKJ/membership gate. Historicky
tekly tři: N-35 (search), N-37 (slugs), N-36 (favorite cizího světa). Druhá osa je **AKJ clearance**:
page-level vs tab-level, kde má PomocnyPJ jen page-level bypass, ne tab-level (kandidát K-R2).

**BE:** `pages` (controller, service, repository), `world-page-templates`, `search` (controller,
embedding-search), `world-page-templates`
**FE:** `features/world/pages` (PageViewer, PageEditor, AkjTabsPanel, CharacterDirectory), search UI

> Sourozenec [bug-plan/08-svet-stranky](../bug-plan/08-svet-stranky.md). Tady jen role/AKJ/leak hrany.

---

## A. Inventura dveří (povinné `PC` — vyplnění šablony z oblasti 00)

| Cesta ke stránce | BE gate | role/AKJ check? | nález |
|---|---|---|---|
| `GET /pages/:slug` (detail) | `assertAccess` ([pages.service.ts:684]) | AKJ + membership | ✅ |
| `GET /pages` / `/directory` (seznam) | `assertCanWrite` (PomocnyPJ+) | role | ✅ |
| `GET /search?q=` (fulltext) | `findVisibleSlugs` filtr (N-35 fix) | ověřit per-page AKJ | ⚠️ ověřit |
| embedding / semantic search | indexer access filtr? | ověřit | ⚠️ ověřit |
| `GET .../pages/dataSlugs` (wikilink) | PomocnyPJ+ (N-37 fix) | role | ⚠️ ověřit |
| `POST/DELETE /:slug/favorite` | `assertCanWrite`/membership (N-36 fix) | membership | ⚠️ ověřit |

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SP-01 | **Search** ([search.controller]) — výsledky filtruje `pages.service.findVisibleSlugs(worldId, requester)` (N-35). Red-team: hráč hledá výraz z AKJ-chráněné stránky → název/slug se **nesmí** objevit `[auto]` | `PC` `LK` | M8 | ✅L2 ([search.controller.ts:81-85](../Projekt-ikaros/backend/src/modules/search/search.controller.ts#L81); worldId povinný + findByIdForRequester + findVisibleSlugs) |
| SP-02 | **Embedding** ([embedding-search.service]) — semantic search respektuje stejný access filtr jako REST? Red-team: hráč semantic dotaz na obsah chráněné sekce → nesmí vrátit chunk `[auto]` | `PC` `LK` | M8 | ✅L2 (filtr je na **sjednoceném** výsledku coordinatoru → kryje i embedding; `count`-před-filtrem = UX nit, ne leak) |
| SP-03 | **dataSlugs** ([pages.service.ts:379]) — wikilink suggestions gate PomocnyPJ+ (N-37). Hráč → nedostane slugy chráněných stránek `[auto]` | `PC` `LK` | M4 | ⬜ |
| SP-04 | **favorite** ([pages.service.ts:524]) — `POST/DELETE /:slug/favorite` ověřuje membership cílového světa (N-36). Red-team: přihlášený přidá slug do favorit **cizího** světa → 403/404 `[auto]` | `PC` `OW` | M8 | ⬜ |

---

## B. AKJ clearance — page-level (`BY` `LK`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SP-05 | `assertAccess` ([pages.service.ts:684]) — `passesAccess` ([:650]) vyhodnotí `accessRequirements[]` (OR logika): typ AKJ (membership.akj ≥ level), AKJType (klíč), Role, UserId. Ověřit všechny 4 typy `[auto]` | `LK` | M4 | ⬜ |
| SP-06 | **Bypass page-level:** GlobalAdmin + **PomocnyPJ+** obchází `accessRequirements`. Ověřit, že práh je PomocnyPJ(4), ne PJ(5) `[auto]` | `BY` | M1 | ⬜ |
| SP-07 | AKJ denied → **404** (ne 403) — neprozradí existenci chráněné stránky. Ověřit, že `assertAccess` hází 404, ne 403 `[auto]` | `LK` | M4 | ⬜ |
| SP-08 | FE `PageViewer` — `WithAkjTabs` renderuje jen to, co BE vrátil (BE autoritativní, FE nerekomputuje). Ověřit, že FE nikde sám nerozhoduje AKJ (jinak by mohl prozradit/skrýt špatně) `[auto]` | `DD` | M1 | ⬜ |

---

## C. AKJ clearance — tab-level (`BY` — kandidát K-R2)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SP-09 | `filterAkjTabsForViewer` ([pages.service.ts:722]) — **PomocnyPJ nemá auto-bypass na tab-level** (jen na page-level, SP-06). Vidí jen taby, kterým splní `tab.access[]`. GlobalAdmin + PJ vidí vše. Ověřit tu nuanci `[auto]` | `BY` | M1 | ✅L2 (`seesAll` = GlobalAdmin\|\|PJ [:733-736](../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L733); PomocnyPJ jde přes per-tab `passesAccess`, BE vrací oříznuté = autoritativní, FE jen renderuje → K-R2 bez díry) |
| SP-10 | Nedostupné taby se **odstraní** z response (ne `visible:false`) — žádný leak existence tabu. Ověřit, že BE nevrací metadata skrytého tabu `[auto]` | `LK` | M1 | ⬜ |
| SP-11 | `contentOverride` na tabu — různý obsah dle clearance. Ověřit, že override neteče napříč clearance úrovněmi (vyšší obsah hráči nižší úrovně) `[auto]` | `LK` `ST` | M1 | ⬜ |
| SP-12 | **Field-level (P1) sub-matice AKJ tab:** `clearance level × AKJType × role`. Rozepsat, kdo vidí který tab. Pozor na kombinaci „PomocnyPJ + tab bez explicitního access" (vidí? nevidí?) `[auto]` | `BY` `LK` | M1 | ⬜ |

### P1 sub-matice: viditelnost AKJ tabu

| tab.access požadavek / viewer | Hrac (akj<lvl) | Hrac (akj≥lvl) | Korektor | PomocnyPJ | PJ | GlobalAdmin |
|---|---|---|---|---|---|---|
| `AKJ:3` (clearance) | 🚫 | ✅ˢ | dle akj | dle akj? | ✅ | ✅ |
| `Role:PomocnyPJ` | 🚫 | 🚫 | 🚫 | ✅ | ✅ | ✅ |
| `UserId:X` (konkrétní) | jen X | jen X | jen X | jen X? | ✅ | ✅ |
| `AKJType:tajne` | dle typu | dle typu | dle typu | dle typu? | ✅ | ✅ |

`?` = klíčová nejistota K-R2: má PomocnyPJ vidět tab bez splnění `access`, nebo ne? `filterAkjTabsForViewer`
říká **ne** (jen PJ/GlobalAdmin). Ověřit, že FE `AkjTabsPanel` to reflektuje a PomocnyPJ si nemyslí, že vidí vše.

---

## D. Zápis stránek (`PA` `OW`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| SP-13 | `create`/`update`/`delete` → `assertCanWrite` ([pages.service.ts:754]) = GlobalAdmin \|\| role>=PomocnyPJ(4); neexistující svět → 404 (ne 403, anti-leak) `[auto]` | `PA` `LK` | M4 | ⬜ |
| SP-14 | FE `PageViewer.canEdit` = `(userRole ?? -1) >= PomocnyPJ` ([PageViewer.tsx:62]). Parita s BE `assertCanWrite` (oba PomocnyPJ+). Korektor(3) → **nesmí** psát stránky (jen šablony?) `[auto]` | `PA` | M2 | ⬜ |
| SP-15 | `world-page-templates` `assertCanManage` = role>=**Korektor(3)** (ne PomocnyPJ!). Pozor: šablony má Korektor, stránky až PomocnyPJ. Ověřit, že FE gating ty dva prahy nerozhazuje `[auto]` | `EN` `PA` | M2 | ⬜ |
| SP-16 | FE `nova-stranka` routa — `memberOnly(Ctenar)` na routě, ale editor je PomocnyPJ+. Ctenar/Hrac se na routu dostane, ale nesmí uložit → BE 403. Ověřit, že FE editor sám gatuje (ne až BE 403) `[auto]` | `OR` `PA` | M1 | ⬜ |

---

## E. Matice persona × akce (stránky/wiki)

| Akce / persona | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ | GlobalAdmin |
|---|---|---|---|---|---|---|---|---|
| číst veřejnou stránku | 🚫* | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| číst AKJ-chráněnou stránku | 🚫 | 🚫 | 🚫ˢ | 🚫ˢ | 🚫ˢ | ✅(bypass) | ✅ | ✅ |
| vidět AKJ tab bez `access` | — | 🚫 | 🚫 | 🚫 | 🚫 | 🚫(K-R2) | ✅ | ✅ |
| najít chráněnou str. v **search** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | ✅ | ✅ |
| dataSlugs (wikilink) | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| favorite stránku (vlastní svět) | 🔒 | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| favorite stránku (**cizí** svět) | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| vytvořit/editovat stránku | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| editovat šablonu deníku | 🔒 | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ |

`*` veřejná stránka světa vyžaduje membership (Ctenar+); guest dostane 404 přes private svět. `ˢ` = dle
`membership.akj` vs požadovaný level.

> **Delta parity (stránky/AKJ):**
> - SP-01/02 search+embedding leak — **⚠️ red-team** (N-35 fix ověřit, embedding neověřeno)
> - SP-09/12 PomocnyPJ tab-bypass — FE `AkjTabsPanel` ↔ BE `filterAkjTabsForViewer` · **⚠️ K-R2**
> - SP-15 Korektor šablony vs PomocnyPJ stránky — dva prahy · **ověřit, že FE nerozhazuje**
> - SP-04 favorite cizí svět — **✅** (N-36 fix), potvrdit M8
> - ostatní → vyplnit.

---

## Test coverage gaps

- Embedding access filtr (SP-02) — žádný test, že semantic search respektuje AKJ. **Vysoká priorita** (boční kanál).
- `filterAkjTabsForViewer` — test pro PomocnyPJ (vidí jen explicitně povolené taby, ne vše).
- Red-team M8: search/dataSlugs/favorite leak (SP-01/03/04) — N-35/37 mají regresní test, embedding ne.
- Korektor vs PomocnyPJ práh (SP-15) — kontraktní test FE↔BE.

---

## Známá rizika

- **RS-1 (`PC`/SP-02)** — **embedding je neprověřený boční kanál.** Pokud indexer nebere `worldId`+access,
  semantic search prozradí obsah chráněných sekcí i bez AKJ. Nejvyšší priorita oblasti.
- **RS-2 (`BY`/K-R2)** — PomocnyPJ tab-bypass: pokud FE `AkjTabsPanel` PomocnyPJ ukáže, že „vidí vše",
  ale BE filtr ho omezí → matoucí (PJ nastaví tab a PomocnyPJ ho nevidí). Ověřit shodu očekávání.
- **RS-3 (`DD`/SP-08)** — FE nesmí rozhodovat AKJ sám; jediný autoritativní filtr je BE `filterAkjTabsForViewer`.
  Kdyby FE někde renderoval taby z neoříznutých dat, byl by to leak.
