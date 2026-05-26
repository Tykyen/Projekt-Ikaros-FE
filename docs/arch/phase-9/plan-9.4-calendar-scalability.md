# Plan 9.4 — Calendar scalability — implementační plán

**Status:** DRAFT — čeká na souhlas
**Spec:** [spec-9.4-calendar-scalability.md](./spec-9.4-calendar-scalability.md)
**Velikost:** M (FE-only, ~10 nových souborů, refactor 1 velkého)

---

## 1 — Pořadí kroků

Postupujeme **bottom-up**: nejdřív malé čisté komponenty + hooks, pak je složíme do refaktorované `CalendarPage`. Každý krok je samostatně commitable.

### Krok 0 — Bug fixy + spec commit *(už hotové fixy, jen commit)*

- Soubory:
  - `src/themes/_shared/reset.css` (✅ edit)
  - `src/features/world/pages/CalendarPage.module.css` (✅ edit chip continuity)
  - `docs/arch/phase-9/spec-9.4-calendar-scalability.md`
  - `docs/arch/phase-9/plan-9.4-calendar-scalability.md`
- Commit: `fix(ui): select option contrast + calendar chip continuity + spec 9.4`

### Krok 1 — Density mode infrastruktura

**Cíl:** Toolbar segmented control + auto-fallback logika + persistence. Bez vizuální změny v gridu (Detail mode = current).

- `src/features/world/pages/CalendarPage/hooks/useDensity.ts` — nový hook
  - Vrací `{ density, setDensity, effectiveDensity, isFallback }`
  - localStorage key `calendar-density-<worldId>`
  - Fallback výpočet z `eventsByDay` (passed in)
- `src/features/world/pages/CalendarPage/components/EventDensityToggle.tsx` — segmented control
  - `role="radiogroup"`, arrow keys, ARIA
  - Fallback badge inline napravo s tooltipem
- `src/features/world/pages/CalendarPage/components/EventDensityToggle.module.css`
- `src/features/world/pages/CalendarPage.tsx` — wire-up: použít hook, zařadit toggle do toolbaru
- Test: `__tests__/useDensity.spec.ts` — fallback thresholds (8 → compact, 30 → heat)

**Acceptance:** Toggle vidět, persistence funguje, fallback badge zobrazený při >8 events/den.

### Krok 2 — Compact density rendering

**Cíl:** Compact mode plně funkční (4px proužky, tooltip, multi-day spojitost).

- `src/features/world/pages/CalendarPage/components/EventChipCompact.tsx`
  - Props: `event`, `position`, `isWeekRestart`
  - Native `title` attribut + custom tooltip on hover (Radix Tooltip pokud už máme, jinak CSS)
- `src/features/world/pages/CalendarPage/components/EventChipCompact.module.css`
  - Height 4px, full-width minus margins
  - `chipSpan*` paralelní pravidla pro continuity (přebrat z `CalendarPage.module.css`)
- `src/features/world/pages/CalendarPage.tsx` — conditional render: `effectiveDensity === 'compact'` → `<EventChipCompact>`, jinak současný `<button class={chipClasses}>`
- Test: `__tests__/EventChipCompact.spec.tsx` — render + tooltip on hover

**Acceptance:** Přepnutí na Kompakt → 4px proužky, multi-day spojitost zachována, hover ukáže název.

### Krok 3 — Heat density rendering

**Cíl:** Heat mode — gradient overlay + event count v header, žádné chipy.

- `src/features/world/pages/CalendarPage/components/CellHeatLayer.tsx`
  - Props: `eventCount`
  - Vrací `<div className={s.layer} style={{ opacity: ... }} aria-hidden />`
  - 5 úrovní opacity podle count
- `src/features/world/pages/CalendarPage/components/CellHeatLayer.module.css`
  - `::before` pseudo-style na cell — accent color gradient
- `src/features/world/pages/CalendarPage.tsx`:
  - `effectiveDensity === 'heat'` → vykreslit `<CellHeatLayer>` místo chipů
  - V header zobrazit `· {count} ev` vedle čísla dne
  - Klik kdekoli v cell → otevře drawer (pro tento krok jen `console.log`, drawer přidáme krok 4)
- Test: opacity per count threshold

**Acceptance:** Heat mode = jen barevný gradient + číslo eventů, klik logguje den.

### Krok 4 — Day Detail Drawer

**Cíl:** Side panel s plným seznamem eventů dne. Trigger: „+N dalších" + klik na heat cell.

- `src/features/world/pages/CalendarPage/components/DayDetailDrawer.tsx`
  - Props: `day`, `events`, `config`, `onClose`, `onEventClick`
  - Slide-in zprava 380px desktop / 100vw mobile
  - Sortable list (akce světa first, pak chronologicky)
  - Focus trap (lib `focus-trap-react` pokud máme, jinak custom hook)
  - ESC close, klik mimo close
- `src/features/world/pages/CalendarPage/components/DayDetailDrawer.module.css`
- `src/features/world/pages/CalendarPage/hooks/useFocusTrap.ts` — pokud lib nemáme
- `src/features/world/pages/CalendarPage.tsx`:
  - `expandedDay` state
  - Detail/Compact mode: „+N dalších" odkaz když `dayEvents.length > maxVisible`
  - Heat mode: cell `onClick` setExpandedDay
  - Render `<DayDetailDrawer>` když `expandedDay !== null`
  - Klik na event v draweru → současný `setSelected` modal (reuse)
- Test: `__tests__/DayDetailDrawer.spec.tsx` — sort order, ESC close, focus trap

**Acceptance:** „+N dalších" + heat cell otevírají drawer, sortable list, ESC zavře, focus se vrátí.

### Krok 5 — Entity Filter Tree

**Cíl:** Nahradit současný plochý sidebar (`Typy` toggles) hierarchickým stromem s search.

- `src/features/world/pages/CalendarPage/components/EntityFilterTree.tsx`
  - Props: `unifiedEvents`, `hiddenEntities`, `setHiddenEntities`, `expandedGroups`, `setExpandedGroups`
  - 4 groups: Akce světa, Hráči, NPC, Lokace
  - Search box s debounce 150ms (lib `use-debounce` pokud máme, jinak ručně)
  - Group checkbox tri-state (all/none/mixed)
  - Bulk actions: „Schovat vše" / „Reset"
- `src/features/world/pages/CalendarPage/components/EntityFilterTree.module.css`
- `src/features/world/pages/CalendarPage/hooks/useEntityIndex.ts` — memoized index entit z `unifiedEvents`
  - Vrací `{ groups: Record<EntityGroup, Entity[]>, search: (q: string) => Entity[] }`
  - Lowercase search cache
- `src/features/world/pages/CalendarPage.tsx`:
  - Odstranit současné `FilterToggle` komponenty + `showGameEvents/Players/Npcs/Locations` state
  - Wire-up `<EntityFilterTree>` s `hiddenEntities` (už existuje) + nové `expandedGroups` state
  - `unifiedEvents` filtr přepsat: místo flat group toggles → kontrola `hiddenEntities.has(entityId)` + `hiddenGroups.has(group)`
  - localStorage `calendar-prefs-<worldId>` pro `expandedGroups`
- Test: `__tests__/EntityFilterTree.spec.tsx` — search, tri-state, bulk actions

**Acceptance:** Sidebar zobrazí strom, search filtruje, group checkbox má 3 stavy, bulk actions funkční.

### Krok 6 — Refactor `CalendarPage.tsx`

**Cíl:** Extrahovat 550ř. monolith na sub-komponenty. Žádná funkční změna.

- `src/features/world/pages/CalendarPage/CalendarPage.tsx` — orchestrace, state, layout (≤200ř.)
- `src/features/world/pages/CalendarPage/components/CalendarToolbar.tsx` — nav + density + jump popover
- `src/features/world/pages/CalendarPage/components/CalendarGrid.tsx` — grid s weekday headers + cell map
- `src/features/world/pages/CalendarPage/components/CalendarCell.tsx` — single cell (header + chips/heat)
- `src/features/world/pages/CalendarPage/index.ts` — re-export default
- Update router import path: `import CalendarPage from '@/features/world/pages/CalendarPage'` zůstává — index.ts to vyřeší
- Old `CalendarPage.tsx` + `CalendarPage.module.css` smazat / přesunout obsah
- Test: smoke render `CalendarPage` (mount + unmount bez chyb)

**Acceptance:** Vizuálně beze změny, lint pass, existující testy pass.

### Krok 7 — Performance + memo

**Cíl:** Optimalizovat pro 1000+ events.

- `CalendarCell` → `React.memo` s custom `propsAreEqual`
- `EventChipCompact` → `React.memo`
- `eventsByDay` audit deps — minimalizovat recompute
- Benchmark: ručně otestovat na seedu 1000 events (skript do `__tests__/perf/` pokud existuje, jinak manual)
- Pokud první render >500ms → použít `useDeferredValue` pro `unifiedEvents`

**Acceptance:** První render 1000 events ≤500ms, filter change ≤100ms.

### Krok 8 — Mobile + a11y audit

- `mobil-desktop` skill
- Sidebar `<details>` collapsible na ≤900px (drawer style)
- Drawer 100vw na mobile
- Keyboard test: tab order, focus trap, arrow keys v density toggle
- Screen reader: aria labels na heat cells, density toggle, entity tree

**Acceptance:** mobil-desktop skill report čistý, keyboard navigation 100% funkční.

### Krok 9 — Nápověda + finalize

- `napoveda` skill spustit
- Sekce v help page: „Kalendář — density modes, filter tree, day drawer"
- Commit final

---

## 2 — Závislosti / risks

| Risk | Mitigace |
|---|---|
| `focus-trap-react` lib možná není v projektu | Krok 4: nejdřív zjistit, pokud chybí → vlastní `useFocusTrap` hook |
| `use-debounce` lib možná není | Inline `setTimeout` debounce ručně, OK pro 1 input |
| `eventsByDay` recompute na každý filter | Memo + selektivní deps — krok 7 řeší |
| Refactor (krok 6) může rozbít existující testy | Krok 6 = poslední strukturální, předchozí kroky drží `CalendarPage.tsx` přejmenovaný a postupně rozkrájený |
| BE `aggregate` endpoint vrací vše — při 5000 events může být pomalý | Mimo scope (non-goal 2.2). Pokud bude bolet → samostatný BE ticket |

---

## 3 — Soubory dotčené

### Nové (15)

```
src/features/world/pages/CalendarPage/
├── CalendarPage.tsx                                  (přesunutý + refactored)
├── index.ts                                          (re-export)
├── hooks/
│   ├── useDensity.ts
│   ├── useEntityIndex.ts
│   └── useFocusTrap.ts                               (pokud chybí lib)
├── components/
│   ├── CalendarToolbar.tsx + .module.css
│   ├── CalendarGrid.tsx + .module.css
│   ├── CalendarCell.tsx + .module.css
│   ├── EventDensityToggle.tsx + .module.css
│   ├── EventChipCompact.tsx + .module.css
│   ├── CellHeatLayer.tsx + .module.css
│   ├── DayDetailDrawer.tsx + .module.css
│   └── EntityFilterTree.tsx + .module.css
└── __tests__/
    ├── useDensity.spec.ts
    ├── EventChipCompact.spec.tsx
    ├── DayDetailDrawer.spec.tsx
    └── EntityFilterTree.spec.tsx
```

### Smazané / přesunuté

- `src/features/world/pages/CalendarPage.tsx` → přesunuto + refactored
- `src/features/world/pages/CalendarPage.module.css` → rozbité do sub-modulů

### Modifikované

- `src/themes/_shared/reset.css` (✅ už hotové)
- `src/features/ikaros/pages/HelpPage/sections/PagesSection.tsx` (krok 9, napoveda skill)

---

## 4 — Testing strategy

- **Unit:** `useDensity` (fallback thresholds), `useEntityIndex` (search match), `EntityFilterTree` (tri-state group checkbox)
- **Component:** `EventChipCompact`, `DayDetailDrawer` (sort, close, focus trap)
- **Smoke:** `CalendarPage` mount bez crashe
- **Manual:** seed 1000 events, ručně přepínat density, filtrovat, otevírat drawer
- **e2e:** *(out of scope pro MVP, dluh)*

---

## 5 — Commit plán

```
1. fix(ui): select option contrast + calendar chip continuity + spec/plan 9.4
2. feat(calendar-9.4): density toggle hook + UI + auto-fallback
3. feat(calendar-9.4): compact density rendering
4. feat(calendar-9.4): heat density rendering
5. feat(calendar-9.4): day detail drawer
6. feat(calendar-9.4): entity filter tree + search
7. refactor(calendar-9.4): split CalendarPage do sub-komponent
8. perf(calendar-9.4): memo + performance pass
9. feat(calendar-9.4): mobile + a11y audit + nápověda
```

Commity přímo na `main` (memory `feedback_work_on_main`).

---

## 6 — Estimate

- Kroky 0–4: ~3h (core features)
- Krok 5 (entity tree): ~2h
- Krok 6 (refactor): ~1.5h
- Kroky 7–9: ~1.5h
- **Total: ~8h**

---

## 7 — Open questions

(žádné — všechno rozhodnuto)

---

## 8 — Souhlas

☐ Plan reviewed & approved → spustit krok 0 (commit bug fixů + spec + plan) a hned krok 1.
