# Spec 5.5 — Rozšíření world dashboardu + plné stránky akcí a novinek

**Status:** ✅ Schváleno + implementováno (2026-05-18)
**Rozsah:** FE (`Projekt-ikaros-FE`) + **BE** (`Projekt-ikaros`) — limity dashboard sloupců, kalendář akcí světa, plná stránka novinek světa (archiv + paginace).
**Větev:** `feat/krok-5.5-svet-akce-novinky`
**Velikost:** odhad FE ~18 souborů / ~900 ř., BE ~10 souborů / ~350 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-18
**Souvisí:** [spec-5.2.md](spec-5.2.md), [spec-5.4.md](spec-5.4.md)
**Předlohy:** globální `AkcePage` (`/ikaros/akce`), `NovinkyPage` (`/ikaros/novinky`), modul `ikaros-news`.

---

## 1. Cíl

World dashboard ([5.2](spec-5.2.md)) ukazuje sloupce Akce / Novinky / Oblíbené bez jasného limitu a bez cesty „na všechno". Cíl — sjednotit chování s globálním dashboardem:

1. **Limity sloupců** — Akce 3, Novinky 3, Oblíbené stránky 10; pod každým sloupcem tlačítko „na vše".
2. **Kalendář akcí světa** — plná stránka (měsíční mřížka, minulé i budoucí akce), 1:1 jako globální `AkcePage`. Nahrazuje stub `CalendarPage`.
3. **Stránka novinek světa** — plná stránka s archivem + paginací, 1:1 jako globální `NovinkyPage`. Nová route.
4. **BE feature parity** — modul `world-news` dostane archiv + offset paginaci + count (dnes umí jen `limit`), aby FE stránka mohla být 1:1 s globální.

---

## 2. Rozsah / pod-kroky

| Pod-krok | Repo | Co |
|---|---|---|
| **5.5a** | FE | Limity dashboard sloupců 3/3/10 + tlačítka „na vše" pod sloupci |
| **5.5b** | BE | `world-news` — `archived` pole, `scope`, offset paginace, `/count`, archive/unarchive |
| **5.5c** | FE | Kalendář akcí světa — plná stránka místo stubu `CalendarPage` |
| **5.5d** | FE | Stránka novinek světa — nová route + plná stránka (archiv, paginace) |

**Pořadí stavby:** 5.5b (BE) → 5.5d (FE novinky, závisí na BE) → 5.5c (kalendář) → 5.5a (sloupce — tlačítka odkazují na c/d).

### Mimo rozsah

- **Tlačítko „Oblíbené → všechny stránky"** funkčně — cíl `/svet/:worldSlug/stranky` je stub, wiki modul = **krok 7**. Tlačítko se přidá, ale vede na stub.
- **Připnuté stránky** nad oblíbené — koncept „pinned page" pro svět neexistuje; vyžaduje wiki modul = **krok 7**.
- **Tvorba/editace herních akcí** — game-events admin = fáze 9. Kalendář akce jen zobrazuje (+ detail modal).

---

## 3. Audit současného stavu

### 3.1 Dashboard sloupce ([5.2](spec-5.2.md))

- `EventsColumn` — `useWorldGameEvents(worldId, 10)`, lokální `useState(5)` + „Zobrazit další" (+5).
- `NewsColumn` — `useWorldNews(worldId)`, zobrazuje **všechny** (bez limitu).
- `FavoritePagesColumn` — `world.favoritePageSlugs`, placeholder, bez limitu.
- `DashColumn` — obal sloupce (ikona + titulek + `action?` slot + panel).

### 3.2 Globální předlohy

- `AkcePage` (`/ikaros/akce`) — desktop měsíční mřížka (`calendarGrid.ts` — `buildMonthGrid` / `dayKey` / `isSameDay` / `WEEKDAY_LABELS`), mobil ≤768 seznam nadcházející/proběhlé; `useIkarosEvents()` (vše), detail v `Modal`.
- `NovinkyPage` (`/ikaros/novinky`) — `useIkarosNewsList({ scope, limit, offset })` + `useIkarosNewsCount(scope)`; admin tabs Aktivní/Archiv, paginace `LIMIT=10`, tvorba/edit/archiv/smazat.
- `DashboardPage` — sekce s 3 položkami + `s.moreLink` odkaz („Kalendář akcí →", „Všechny novinky →").

### 3.3 BE `world-news` (dnes) vs `ikaros-news` (předloha)

| | `world-news` | `ikaros-news` |
|---|---|---|
| GET list | `?worldId=&limit=` (1–200) | `?scope=&limit=&offset=` |
| count | ✗ | `GET /count?scope=` → `{ total }` |
| archiv | ✗ | `archived` pole + `/archive` `/unarchive` |
| schema | `worldId, title, content, date, type, link?, createdBy?` | navíc `archived, archivedAtUtc?, archivedByUserId?` |

### 3.4 Routing

- `/svet/:worldSlug/kalendar` → `CalendarPage` = **stub** (`WorldStubPage area="calendar"`).
- Route pro novinky světa — **neexistuje**.

---

## 4. Návrh řešení

### 4.1 — 5.5b BE: `world-news` archiv + paginace

Zrcadlí modul `ikaros-news`.

- **Schema** — přidat `archived: boolean` (`@Prop({ default: false, index: true })`), `archivedAtUtc?: Date`, `archivedByUserId?: string`.
- **GET `/news`** — nové query `scope: 'active'|'archived'|'all'` (default `active`), `offset?`. Zachovat `worldId`, `limit`.
- **GET `/news/count`** — query `worldId?`, `scope?` → `{ total: number }`.
- **POST `/news/:id/archive`** + **`/news/:id/unarchive`** — idempotentní.
- **Autorizace archivu** — `scope=active` zůstává anon (čtení); `archived`/`all` a archive/unarchive akce vyžadují **PomocnyPJ+ daného světa** nebo globální Admin+ (stejná logika jako write v `world-news.service` §3.3). U `worldId=null` (globální novinka) jen Admin+.
- **Service** — `findMany` rozšířit o `scope`/`offset` filtr; `count(worldId, scope)`; `setArchived(id, bool, userId)`.
- BE testy — scope filtr, count, archive/unarchive, autorizace.

> ⚠️ Zásah do BE repa `Projekt-ikaros` — jediný BE krok fáze 5.5.

### 4.2 — 5.5d FE: stránka novinek světa

- **Route** — `{ path: 'novinky', element: memberOnly(p(WorldNewsPage)) }` pod `/svet/:worldSlug/*`.
- **Nav** — odkaz „Novinky" do `WorldLayout` nav (skupina „Informace").
- **`WorldNewsPage`** — kopie struktury `NovinkyPage`: header s „Nové oznámení" (PomocnyPJ+/Admin), admin tabs Aktivní/Archiv, paginace `LIMIT=10`, empty/loading. Karty = reuse `WorldNewsCard` (z 5.2) s akcemi edit/archiv/smazat pro oprávněné.
- **FE hooky** (`useWorldNews.ts`) — rozšířit:
  - `useWorldNewsList({ worldId, scope, limit, offset })` — `GET /news?worldId=&scope=&limit=&offset=`.
  - `useWorldNewsCount(worldId, scope, enabled)` — `GET /news/count`.
  - `useArchiveWorldNews(worldId)` / `useUnarchiveWorldNews(worldId)`.
  - Stávající `useWorldNews(worldId, limit)` zůstává (dashboard sloupec).
- **Typ** `WorldNewsItem` — doplnit `archived?: boolean`.

### 4.3 — 5.5c FE: kalendář akcí světa

- **`CalendarPage`** — nahradit stub plnou stránkou; route `/svet/:worldSlug/kalendar` beze změny.
- **Sdílení `calendarGrid.ts`** — přesunout z `AkcePage/calendarGrid.ts` do `src/shared/lib/calendarGrid.ts` (čistá utilita, bez závislostí); `AkcePage` upravit import. Žádná logická změna.
- **Layout** — 1:1 jako `AkcePage`: měsíční mřížka (desktop) + mobilní seznam nadcházející/proběhlé, navigace měsíců, „Dnes", detail akce v `Modal`.
- **Data** — všechny akce světa vč. minulých. Nový hook `useAllWorldGameEvents(worldId)` — `GET /game-events?worldId=&limit=500` **bez `fromDate`** (BE bez `fromDate` vrací vše). Stávající `useWorldGameEvents` (dashboard, `fromDate`=dnes) zůstává.
- **Karta** — `WorldEventCard` (z 5.2) v mobilním seznamu i detail modalu.
- **Tvorba akcí** — mimo rozsah (fáze 9); na rozdíl od `AkcePage` žádné „Nová akce".

### 4.4 — 5.5a FE: limity dashboard sloupců + tlačítka

- `EventsColumn` — limit **3** (`events.slice(0, 3)`), zrušit `useState`/„Zobrazit další"; pod panelem tlačítko **„Kalendář akcí →"** → `/svet/:worldSlug/kalendar`.
- `NewsColumn` — limit **3**; pod panelem **„Všechny novinky →"** → `/svet/:worldSlug/novinky`.
- `FavoritePagesColumn` — limit **10** (`slugs.slice(0, 10)`); pod panelem **„Všechny stránky →"** → `/svet/:worldSlug/stranky` (stub do kroku 7).
- **Tlačítko** — `<Link>` pod panelem, vizuál jako globální `moreLink`. `DashColumn` dostane volitelný prop `footer?: ReactNode` (Link se vykreslí pod panelem).

### 4.5 Design audit (`frontend-design`)

- **Kalendář / novinky světa** — žijí uvnitř světového motivu; vizuál 1:1 s globálními předlohami, jen barvy dědí ze skinu (tokeny). Žádná nová vizuální koncepce — konzistence s `AkcePage` / `NovinkyPage`.
- **Tlačítko „na vše"** — tiché, sekundární (`moreLink` styl: text + šipka, žádné plné tlačítko); nekonkuruje obsahu sloupce.
- **Tokeny only** — `lint:colors` ✓.

### 4.6 mobil-desktop + nápověda

`mobil-desktop` — kalendář (mřížka → mobil seznam), stránka novinek, dashboard sloupce s tlačítky.
`napoveda` — `CalendarPage` přechod stub → ✅; nová stránka „Novinky světa" do `PagesSection` (`SOON_WORLD` → reálná); aktualizovat datum.

---

## 5. Out of scope

- Tlačítko Oblíbené funkčně + připnuté stránky → **krok 7** (wiki modul).
- Tvorba/editace/RSVP herních akcí z kalendáře → **fáze 9**.
- Archiv globálních novinek z `world-news` (`worldId=null`) — řeší globální `NovinkyPage`/`ikaros-news`.

---

## 6. Acceptance kritéria

1. **5.5b** — `world-news`: schema `archived`; `GET /news` přijímá `scope`+`offset`; `GET /news/count`; `POST /news/:id/archive|unarchive`; autorizace archivu PomocnyPJ+ světa / Admin+; BE testy ✓.
2. **5.5c** — `/svet/:worldSlug/kalendar` = měsíční kalendář (desktop) + mobil seznam; zobrazuje minulé i budoucí akce; detail v modalu; `calendarGrid.ts` v `shared/lib`, `AkcePage` funguje dál.
3. **5.5d** — `/svet/:worldSlug/novinky` = stránka novinek; PomocnyPJ+ vidí tabs Aktivní/Archiv + tvorbu/edit/archiv/smazat; paginace po 10; odkaz v nav.
4. **5.5a** — sloupce: Akce 3 / Novinky 3 / Oblíbené 10; pod každým tlačítko „na vše" s korektním odkazem.
5. FE hooky `useWorldNewsList`/`useWorldNewsCount`/`useArchive…`/`useUnarchive…`, `useAllWorldGameEvents`.
6. Responsivní (mobil/tablet/desktop) — `mobil-desktop` audit.
7. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓ (FE); `lint` + `test` ✓ (BE). Žádný hardcoded barevný literál.
8. `napoveda` aktualizována; roadmapa odškrtnuta.

---

## 7. Test plán

- **BE** — `world-news`: scope filtr (active/archived/all), count, archive/unarchive idempotence, autorizace (hráč vs PomocnyPJ vs Admin).
- **FE** — `useWorldNewsList`/`Count`/`Archive` volají správné URL; `useAllWorldGameEvents` bez `fromDate`.
- `WorldNewsPage` — render seznam, tabs gating dle role, paginace, archiv/unarchiv.
- `CalendarPage` — render mřížky, navigace měsíců, detail modal, mobil seznam.
- Dashboard sloupce — limit 3/3/10, tlačítka mají správný `to`.
- Smoke: dashboard → klik „Kalendář akcí" → kalendář; „Všechny novinky" → stránka; PJ archivuje novinku.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| BE změna `world-news` rozbije 5.2 dashboard sloupec | Střední | Střední | `scope` default `active` — staré volání `?worldId=&limit=` funguje beze změny; BE testy. |
| Autorizace archivu per-svět složitá | Střední | Střední | Reuse existující per-world auth z `world-news.service` (write path). |
| `calendarGrid.ts` přesun rozbije `AkcePage` | Nízká | Nízký | Čistá utilita bez závislostí; jen změna importu; testy `AkcePage` ✓. |
| Kalendář s 500 akcemi pomalý | Nízká | Nízký | Limit 500; reálně světy mají desítky akcí. |

**Rollback:** FE pod-kroky aditivní (revert commitu). BE 5.5b — `archived` pole s defaultem `false`, zpětně kompatibilní; revert vrátí GET bez `scope`.

---

## 9. Otázky k autorovi

Žádné — rozsah odsouhlasen (kalendář akcí 1:1 jako globální; novinky světa s BE změnou 1:1 jako globální; oblíbené tlačítko + připnuté = krok 7).

> Po schválení → implementační plán → potvrzení → kód.
