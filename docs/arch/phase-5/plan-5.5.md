# Implementační plán 5.5 — World akce + novinky

**Spec:** [spec-5.5.md](spec-5.5.md)
**Repa:** `Projekt-ikaros` (BE — Task 1), `Projekt-ikaros-FE` (FE — Task 2–7)
**Větev:** `feat/krok-5.5-svet-akce-novinky` (obě repa)

Pořadí: BE → FE hooky → stránka novinek → kalendář → sloupce → testy → úklid.

---

## Task 1 — BE: `world-news` archiv + paginace (5.5b)

**Repo:** `Projekt-ikaros` · **Soubory:** `backend/src/modules/world-news/**`

- [ ] **Step 1 — schema:** `world-news.schema.ts` — přidat `archived: boolean` (`@Prop({ default: false, index: true })`), `archivedAtUtc?: Date`, `archivedByUserId?: string`.
- [ ] **Step 2 — repo interface + impl:** `FindOptions` rozšířit o `scope?: 'active'|'archived'|'all'`, `offset?`; `findMany` aplikuje scope filtr (`archived` bool) + `skip(offset)`; přidat `count(worldId?, scope)`; `setArchived(id, bool, userId)`.
- [ ] **Step 3 — DTO:** query DTO pro GET — `scope?`, `offset?` (validace, default `scope=active`).
- [ ] **Step 4 — service:** `findMany` předá scope/offset; `count()`; `archive(id, user)` / `unarchive(id, user)` — autorizace: PomocnyPJ+ daného světa nebo Admin+ (reuse write-auth helper), `worldId=null` jen Admin+; nastaví audit pole.
- [ ] **Step 5 — controller:** `GET /news` přijme `scope`+`offset`; `GET /news/count?worldId=&scope=` → `{ total }`; `POST /news/:id/archive` + `/unarchive` (idempotentní). `scope=archived|all` čtení jen oprávněným.
- [ ] **Step 6 — BE testy:** scope filtr, count, archive/unarchive idempotence, autorizace (hráč 403 / PomocnyPJ / Admin).
- [ ] **Step 7:** `npm run lint && npm test` (BE) ✓.

**Acceptance:** spec #1.

---

## Task 2 — FE: hooky novinek + typ (5.5d část)

**Repo:** FE · **Soubory:** Modify `src/features/world/api/useWorldNews.ts`, `src/shared/types/index.ts`

- [ ] **Step 1 — typ:** `WorldNewsItem` — přidat `archived?: boolean`. `WorldNewsScope = 'active'|'archived'|'all'`.
- [ ] **Step 2 — hooky:** `useWorldNewsList({ worldId, scope, limit, offset })` (`GET /news?worldId=&scope=&limit=&offset=`), `useWorldNewsCount(worldId, scope, enabled)` (`GET /news/count`), `useArchiveWorldNews(worldId)` / `useUnarchiveWorldNews(worldId)` (POST archive/unarchive, invalidace). Stávající `useWorldNews(worldId, limit)` zachovat.
- [ ] **Step 3:** `tsc` ✓.

**Acceptance:** spec #5.

---

## Task 3 — FE: stránka novinek světa (5.5d)

**Soubory:** Create `src/features/world/pages/WorldNewsPage/{WorldNewsPage.tsx,.module.css,index.ts}`; Modify `src/app/router.tsx`, `WorldLayout.tsx`

- [ ] **Step 1 — `WorldNewsPage`:** kopie struktury `NovinkyPage` — header s „Nové oznámení" (PomocnyPJ+/Admin), admin tabs Aktivní/Archiv (`useSearchParams`), paginace `LIMIT=10` (`useWorldNewsList` + `useWorldNewsCount`), empty/loading.
- [ ] **Step 2 — karty:** `WorldNewsCard` (z 5.2) se slotem akcí — edit (`WorldNewsEditorModal`), archiv/unarchiv, smazat (`ConfirmDialog`) pro oprávněné.
- [ ] **Step 3 — route:** `{ path: 'novinky', element: memberOnly(p(WorldNewsPage)) }` pod `/svet/:worldSlug/*`.
- [ ] **Step 4 — nav:** odkaz „Novinky" do `WorldLayout` `buildNav()` — skupina „Informace".

**Acceptance:** spec #3.

---

## Task 4 — FE: kalendář akcí světa (5.5c)

**Soubory:** Move `AkcePage/calendarGrid.ts` → `src/shared/lib/calendarGrid.ts` (+ `.spec`); Modify `AkcePage.tsx` import; Modify `src/features/world/pages/CalendarPage.tsx` (+ `.module.css`); Modify `useGameEvents.ts`

- [ ] **Step 1 — přesun `calendarGrid`:** do `src/shared/lib/`; upravit import v `AkcePage.tsx`; ověřit `calendarGrid.spec` + `AkcePage.spec` projdou.
- [ ] **Step 2 — hook:** `useAllWorldGameEvents(worldId)` v `useGameEvents.ts` — `GET /game-events?worldId=&limit=500` **bez `fromDate`**; queryKey `['game-events','world-all',worldId]`.
- [ ] **Step 3 — `CalendarPage`:** nahradit stub — měsíční mřížka (desktop) + mobil seznam nadcházející/proběhlé, navigace měsíců + „Dnes", detail akce v `Modal`. Vizuál 1:1 `AkcePage`, karta `WorldEventCard`. Bez „Nová akce" (fáze 9).

**Acceptance:** spec #2.

---

## Task 5 — FE: limity dashboard sloupců + tlačítka (5.5a)

**Soubory:** Modify `DashColumn.tsx` (+ CSS), `EventsColumn.tsx`, `NewsColumn.tsx`, `FavoritePagesColumn.tsx`

- [ ] **Step 1 — `DashColumn`:** přidat prop `footer?: ReactNode` — render pod panelem.
- [ ] **Step 2 — `EventsColumn`:** limit `slice(0, 3)`, zrušit `useState`/„Zobrazit další"; `footer` = `<Link>` „Kalendář akcí →" → `${base}/kalendar`.
- [ ] **Step 3 — `NewsColumn`:** limit `slice(0, 3)`; `footer` = „Všechny novinky →" → `${base}/novinky`.
- [ ] **Step 4 — `FavoritePagesColumn`:** limit `slice(0, 10)`; `footer` = „Všechny stránky →" → `${base}/stranky`.
- [ ] **Step 5 — styl tlačítka:** `moreLink` (text + šipka), tokeny only.

**Acceptance:** spec #4.

---

## Task 6 — FE: testy

**Soubory:** Create/Modify testy

- [ ] `useWorldNewsList`/`Count`/`Archive`, `useAllWorldGameEvents` — správné URL.
- [ ] `WorldNewsPage` — render, tabs gating dle role, paginace.
- [ ] `CalendarPage` — mřížka, navigace měsíců, detail modal.
- [ ] Dashboard sloupce — limit 3/3/10, tlačítka `to`.
- [ ] `npm run lint && npm run lint:colors && npx tsc --noEmit && npm run build && npm run test:run` ✓.

**Acceptance:** spec #6, #7.

---

## Task 7 — Úklid

- [ ] `mobil-desktop` audit — kalendář, stránka novinek, sloupce.
- [ ] `napoveda` — `CalendarPage` stub → ✅; nová „Novinky světa"; datum.
- [ ] roadmapa `roadmap-fe.md` — 5.5 + odškrtnout.
- [ ] commit (FE + BE zvlášť, obě větev `feat/krok-5.5-svet-akce-novinky`).

**Acceptance:** spec #8.

---

## Pořadí commitů

**BE (`Projekt-ikaros`):**
1. `feat(world-news): archiv + offset paginace + count (krok 5.5b)`

**FE (`Projekt-ikaros-FE`):**
1. `feat(svet): hooky + stranka novinek sveta (krok 5.5d)`
2. `feat(svet): kalendar akci sveta + sdileny calendarGrid (krok 5.5c)`
3. `feat(svet): limity dashboard sloupcu + tlacitka na vse (krok 5.5a)`
4. `test(svet): krok 5.5 — testy + napoveda + mobil-desktop`
