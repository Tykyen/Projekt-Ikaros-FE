# Spec 9.4 — Calendar scalability (PJ pohled)

**Status:** DRAFT — čeká na souhlas
**Velikost:** M (FE-only, žádný BE redesign)
**Návaznost:** 9.2d PJ aggregate kalendář (`CalendarPage.tsx`)

---

## 1 — Cíl

User: „Mám kolem 4000 NPC, ~50 jich má kalendář, ~30 lokací, ~20 hráčů. Bude se to zvyšovat. Potřebuji dlouhodobé a přehledné řešení."

Současný stav: `CalendarPage.tsx` renderuje vertikální seznam barevných chipů per cell. Při >4-5 eventů na den buňka přeteče.

Cíl: měsíční grid, který zůstane čitelný i při 100 → 500 → 1000+ eventů, bez ztráty schopnosti PJ rychle skenovat „co se ten den děje" a drillnout do detailu.

---

## 2 — Scope

### 2.1 In-scope

- **Density modes** v toolbaru: `Detail` / `Kompakt` / `Heat`
- **Auto-fallback** density podle skutečného počtu eventů na cell
- **Day detail drawer** — side panel zprava při kliknutí na den (plný seznam eventů)
- **Entity filter tree** v sidebaru — hierarchie Typ → Entita s checkboxy + search
- Memoizace + perf optimalizace pro 1000+ eventů v aktivním měsíci

### 2.2 Non-goals (mimo MVP, dluh)

- Timeline / Gantt view (`viewMode: 'timeline'`) — state připravený, UI v další iteraci
- Day-only agenda view (`viewMode: 'day'`) — state připravený, UI v další iteraci
- Virtual scroll v entity tree (přidat až při >200 entit v listu)
- Server-side filtering / pagination — aggregate endpoint zatím vrací vše, fix až bude bolet

---

## 3 — Density modes — chování

### 3.1 Detail (default)

- Současný layout: plné chipy s názvy, `eventChip` class
- Max **4 chipy** viditelně v cell, ostatní pod „+N dalších" odkazem
- Klik na „+N dalších" → otevře Day Drawer

### 3.2 Kompakt

- Chipy bez textu, 4px proužek (`EventChipCompact`)
- Hover → tooltip s plným titulkem
- Multi-day spojitost zachovaná (přebírá `chipSpan*` logiku)
- Max **20 chipů** viditelně v cell, jinak „+N dalších"

### 3.3 Heat

- Žádné jednotlivé chipy
- Cell má `::before` overlay s gradientem podle `eventCount`:
  - 0 events: žádný overlay
  - 1–5: light tint accent barvy (12% alpha)
  - 6–20: medium (24%)
  - 21–50: strong (40%)
  - 51+: max (60%)
- Cell header zobrazí číslo eventů: „26. · **23 ev**"
- Klik kdekoli v cell → Day Drawer

### 3.4 Auto-fallback

User vybere v toolbaru `density`, ale efektivní hodnota se může degradovat:

```ts
const maxEventsPerDay = Math.max(0, ...[...eventsByDay.values()].map(arr => arr.length));
const effectiveDensity =
  density === 'detail'  && maxEventsPerDay > 8  ? 'compact' :
  density === 'compact' && maxEventsPerDay > 30 ? 'heat'    :
  density;
```

Fallback se zobrazí jako informační badge v toolbaru: „Detail → automaticky Kompakt (35 eventů na den)". Klik na badge → forced override (zachová user volbu, riskne přetečení).

---

## 4 — Day Detail Drawer

**Trigger:** klik na cell (Heat mode), na „+N dalších" odkaz (Detail/Kompakt),
nebo na **číslo dne** (Detail/Kompakt, když má den ≥1 akci).

> **Amend (2026-06-18):** „+N dalších" vzniká až při přetečení limitu (Detail >4,
> Compact >20). Při 8–20 akcích/den v compactu žádný spouštěč nevznikl → drawer
> byl nedostupný. Fix: číslo dne je v Detail/Compact tlačítko (`.dayNumBtn`) a
> vedle data je počet akcí (`12. · 5`) jako signál klikatelnosti.

**Layout:** Side panel zprava, 380px desktop / 100vw mobile, slide animation 180ms.

**Obsah:**
- Header: datum + zavírací tlačítko
- Sortable list eventů toho dne:
  - Akce světa (vždy first)
  - Eventy postav, řazeno: čas → typ (Hráč/NPC/Lokace) → název entity
- Každý řádek: barevný indikátor (entity color), čas (pokud má hour), titul, jméno entity, kind chip
- Klik na řádek → současný `selected` modal s detailem (reuse `<Modal>`)

**Close:** ESC, klik mimo, klik na zavírací tlačítko. Drawer drží month grid v pozadí (PJ neztratí kontext).

**A11y:** focus trap inside drawer, `role="dialog"`, `aria-modal="true"`, focus návrat na trigger po close.

---

## 5 — Entity Filter Tree

Nahradí současný plochý sidebar (`Typy` toggles).

**Struktura:**
```
🔍 [Hledat entitu...]

▼ Akce světa            ☑ (45 eventů)
▼ Postavy hráčů         ☑ (20)
  ☑ Krásná elfka
  ☑ Postava 2
  ...
▼ NPC                   ☑ (50)
  ☑ Vesmírná stanice Savnost
  ☐ NPC X
  ...
▼ Lokace                ☑ (30)
  ...

[ Schovat vše ]  [ Reset ]
```

**State:**
- `hiddenEntities: Set<string>` (už existuje) — entity IDs schované
- `entitySearch: string` — search query, debounce 150ms
- `expandedGroups: Set<'gameEvents'|'players'|'npcs'|'locations'>` — collapsed by default, otevře se klikem

**Group checkbox semantika:**
- Klik na group checkbox = toggle všech entit v dané group
- Group checkbox stav: `all` (☑) / `none` (☐) / `mixed` (⊟ indeterminate)

**Search:**
- Filtruje seznam entit per group (case-insensitive substring)
- Pokud má group ≥1 match → group expanded a zobrazí jen matche
- Pokud nemá match → group skryt
- Group checkbox v search modu toggluje **jen viditelné matche**

**Bulk actions:**
- „Schovat vše" → `hiddenEntities = Set(allEntityIds)`
- „Reset" → `hiddenEntities = new Set()`

---

## 6 — State (CalendarPage)

```ts
// Density
type Density = 'detail' | 'compact' | 'heat';
const [density, setDensity] = useState<Density>('detail');

// View mode — připraveno na rozšíření, MVP jen 'month'
type ViewMode = 'month' | 'day' | 'timeline';
const [viewMode, _setViewMode] = useState<ViewMode>('month'); // setter nepoužitý v MVP

// Filter
const [hiddenEntities, setHiddenEntities] = useState<Set<string>>(new Set()); // už existuje
const [entitySearch, setEntitySearch] = useState('');
const [expandedGroups, setExpandedGroups] = useState<Set<EntityGroup>>(new Set());

// Drawer
const [expandedDay, setExpandedDay] = useState<FantasyDate | null>(null);
```

Persistence: `density`, `expandedGroups` → `localStorage` per worldId (key `calendar-prefs-<worldId>`). `hiddenEntities` zůstává session-only (PJ často mění focus).

---

## 7 — Komponenty

### Nové (`src/features/world/pages/CalendarPage/components/`)

| Komponenta | Účel |
|---|---|
| `EventDensityToggle.tsx` | Segmented control v toolbaru (Detail/Kompakt/Heat) + fallback badge |
| `EventChipCompact.tsx` | 4px proužek varianta chipu, tooltip on hover |
| `CellHeatLayer.tsx` | `::before` overlay s gradientem podle eventCount |
| `DayDetailDrawer.tsx` | Side panel s plným listem eventů dne, sortable |
| `EntityFilterTree.tsx` | Hierarchický sidebar s search + checkboxy |

### Reorganizace existujícího

`CalendarPage.tsx` extrahovat z 550 ř. na:
- `CalendarPage.tsx` (hlavní orchestrace, state, layout)
- `CalendarToolbar.tsx` (nav + density + jump popover)
- `CalendarGrid.tsx` (samotný grid + cell render)
- `CalendarCell.tsx` (cell s overlays a chips)

### CSS modules

Nové `.module.css` pro každou novou komponentu. Existující `CalendarPage.module.css` rozřezat na sub-moduly per komponenta.

---

## 8 — Performance

| Obavy | Mitigace |
|---|---|
| 1000+ eventů → `eventsByDay` recompute | `useMemo` s minimal deps (už máte, ale ověřit) |
| Entity tree render 500+ položek | Collapsed by default, expand jen klikem; virtual scroll až při >200 v jedné group |
| Search input lag | Debounce 150ms, cached lowercase search index |
| Drawer mount lag | Render jen když `expandedDay !== null` (lazy mount) |
| Cell rerender při filter change | `CalendarCell` memo-ovaný, deps jen `cellEvents` reference |

**Benchmark target:** 1000 eventů na měsíc → first render ≤500ms, filter change ≤100ms, density switch ≤50ms (desktop).

---

## 9 — A11y

- Density toggle: `role="radiogroup"`, arrow keys přepínají
- Entity tree: `role="tree"` + `role="treeitem"` + `aria-expanded`
- Day drawer: focus trap, `aria-modal`, ESC close
- Heat cells: `aria-label="26. května 2026, 23 eventů"` (screen reader friendly)
- Tooltip on hover: také focusable (keyboard accessible)

---

## 10 — Acceptance criteria

- ☐ Density toggle vidět v toolbaru, přepíná mezi 3 mody, persistence v localStorage
- ☐ Auto-fallback funguje při překročení thresholdu (8 → compact, 30 → heat)
- ☐ Fallback badge se zobrazí a klikatelný (force override)
- ☐ Detail mode: max 4 chipy + „+N dalších" odkaz funkční
- ☐ Compact mode: 4px proužky, multi-day spojitost zachována, tooltip on hover
- ☐ Heat mode: gradient overlay 5 úrovní, číslo eventů v header
- ☐ Day drawer: otevírá z „+N dalších" i z heat cell, sortable, ESC close, focus trap
- ☐ Entity tree: search funguje, debounce, group checkbox tri-state
- ☐ Bulk actions („Schovat vše", „Reset") funkční
- ☐ Mobile (≤900px): sidebar collapsible, drawer 100vw
- ☐ Mobil-desktop audit (skill `mobil-desktop`) pass
- ☐ Nápověda update (skill `napoveda`) — sekce o density modes + filter tree
- ☐ Tests: alespoň 1 unit test pro auto-fallback logiku + 1 e2e pro density toggle

---

## 11 — Open questions

(žádné — všechno rozhodnuto dle user feedback „Nechám to na tobě")

---

## 12 — Next steps

1. **Souhlas s tímto specem** ← jsme tady
2. Impl plán (`docs/arch/phase-9/plan-9.4-calendar-scalability.md`)
3. Souhlas s impl plánem
4. Implementace (commits přímo na `main` dle memory `feedback_work_on_main`)
5. `mobil-desktop` skill po grafických úpravách
6. `napoveda` skill po dokončení
