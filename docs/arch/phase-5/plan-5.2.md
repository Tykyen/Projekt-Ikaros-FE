# Implementační plán 5.2 — World dashboard

**Spec:** [spec-5.2.md](spec-5.2.md)
**Repo:** `Projekt-ikaros-FE` (bez BE změn)
**Větev:** `feat/krok-5.2-world-dashboard`

Pořadí: typy/hooky → skeleton dashboardu → sloupce → napojení → testy → úklid.

---

## Task 1 — FE typy + API hooky

**Soubory:**
- Modify: `src/shared/types/index.ts`
- Create: `src/features/world/api/useWorldNews.ts`
- Modify: `src/features/world/api/useGameEvents.ts`

- [ ] **Step 1 — typy:** `WorldNewsItem` (`id, worldId: string|null, title, content, date, type: 'info'|'alert'|'system', link?, createdBy?`), `GameEvent` (dle spec §3.3 — `id, worldId, title, date, description, imageUrl, targetGroup, groupOnly, confirmable, confirmedBy: {userId,userName}[], …`).
- [ ] **Step 2 — `useWorldNews.ts`:** `useWorldNews(worldId)` (`GET /world-news?worldId=&limit=20`), `useCreateWorldNews` / `useUpdateWorldNews` / `useDeleteWorldNews` (POST/PUT/DELETE) — invalidace `['world-news', worldId]`.
- [ ] **Step 3 — `useGameEvents.ts`:** přidat `useWorldGameEvents(worldId, limit=10)` — `GET /game-events?worldId=&limit=&fromDate=<dnešek 00:00>`, queryKey `['game-events', 'world', worldId]`.
- [ ] **Step 4:** `tsc` ✓.

**Acceptance:** spec #8.

---

## Task 2 — `WorldDashboard` skeleton + `DashColumn` + `StatBar`

**Soubory:** Create `WorldDashboardPage/WorldDashboard/{WorldDashboard.tsx,.module.css,index.ts}`, `components/{DashColumn,StatBar}.tsx` + CSS.

- [ ] **Step 1 — `DashColumn`:** props `icon`, `title`, `action?`, `children`. Nadpisová lišta (ikona + uppercase titulek) nad panelem (`--surface-2`, `--frame-border`, radius 12).
- [ ] **Step 2 — `WorldDashboard`:** grid `1fr 1.4fr 1fr` → 2 (≤1024) → 1 (≤768, pořadí Novinky→Akce→Oblíbené); `align-items: start`; `fadeUp` stagger. Pod gridem `StatBar`.
- [ ] **Step 3 — `StatBar`:** 3 panely (`repeat(3,1fr)`) — číslo + ikona + uppercase popisek. Props: počty hráčů / akcí / novinek.
- [ ] **Step 4:** lint:colors — tokeny only.

**Acceptance:** spec #1, #6, #7.

---

## Task 3 — Levý sloupec: Akce

**Soubory:** Create `columns/EventsColumn.tsx` + CSS, `components/WorldEventCard.tsx` + CSS.

- [ ] **Step 1:** `EventsColumn` — `useWorldGameEvents(worldId, 10)`; loading skeleton / empty („Žádné nadcházející akce.") / seznam.
- [ ] **Step 2:** `WorldEventCard` — datum-chip (den + měsíc, reuse `relativeEventDate` util), název, „✓ N potvrzeno" (`confirmedBy.length`); `isWithin24h` → urgentní chip.
- [ ] **Step 3:** „Zobrazit další" — postupné odkrývání (`visibleCount` state, +5).

**Acceptance:** spec #3.

---

## Task 4 — Prostřední sloupec: Novinky + tvorba

**Soubory:** Create `columns/NewsColumn.tsx` + CSS, `components/{WorldNewsCard,WorldNewsEditorModal}.tsx` + CSS.

- [ ] **Step 1:** `NewsColumn` — `useWorldNews(worldId)`; loading / empty / seznam `WorldNewsCard`.
- [ ] **Step 2:** `WorldNewsCard` — 3px type-proužek (info `--text-muted` / alert `--warning` / system `--accent`), titulek, relativní datum, 2řádkový úryvek `content` (plain text, ne raw HTML), `link` proklik. PJ akce v `KebabMenu` (edit/smazat).
- [ ] **Step 3:** gating tvorby — `userRole ≥ PomocnyPJ` || globální admin → tlačítko „Nové oznámení" v `DashColumn` action slotu.
- [ ] **Step 4:** `WorldNewsEditorModal` — `Modal` + RHF/zod formulář (title, content, type select, link, date); create i edit (prefill); `useCreateWorldNews` / `useUpdateWorldNews`; toast.
- [ ] **Step 5:** mazání — `ConfirmDialog` → `useDeleteWorldNews`.

**Acceptance:** spec #4.

---

## Task 5 — Pravý sloupec: Oblíbené stránky (placeholder)

**Soubory:** Create `columns/FavoritePagesColumn.tsx` + CSS.

- [ ] **Step 1:** `World.favoritePageSlugs` — seznam slugů (read-only, bez prokliku — stránky neexistují).
- [ ] **Step 2:** sdělení „Stránky světa budou dostupné s krokem 7"; empty stav („Zatím žádné oblíbené stránky").

**Acceptance:** spec #5.

---

## Task 6 — Napojení do `WorldDashboardPage`

**Soubory:** Modify `WorldDashboardPage/WorldDashboardPage.tsx`.

- [ ] **Step 1:** member větev → `<WorldDashboard />` místo `<MemberDashboardStub>`. Non-member / pending beze změny.
- [ ] **Step 2:** `MemberDashboardStub` — ponechat soubor nebo `git rm` (rozhodne se — pravděpodobně smazat, nikde jinde se nepoužívá; ověřit grep).

**Acceptance:** spec #1, #2.

---

## Task 7 — Testy

**Soubory:** Create `WorldDashboardPage/WorldDashboard/__tests__/*`.

- [ ] FE testy dle spec §7 (~12): `useWorldNews`/`useWorldGameEvents` URL, `WorldDashboard` render, `NewsColumn` gating, `WorldNewsEditorModal` submit, `WorldNewsCard`/`WorldEventCard`, `FavoritePagesColumn` placeholder.
- [ ] `npm run lint && npm run lint:colors && npx tsc --noEmit && npm run build && npm run test:run` ✓.

**Acceptance:** spec #9, #10.

---

## Task 8 — Úklid

- [ ] `mobil-desktop` audit — 3/2/1 sloupec.
- [ ] `napoveda` — ověřit popis úvodní stránky světa.
- [ ] roadmapa — odškrtnout 5.2.
- [ ] commit.

---

## Pořadí commitů

1. `feat(svet): API hooky novinky + world-eventy (krok 5.2)`
2. `feat(svet): World dashboard — 3 sloupce + statistiky (krok 5.2)`
3. `test(svet): krok 5.2 — testy + nápověda + mobil-desktop`
