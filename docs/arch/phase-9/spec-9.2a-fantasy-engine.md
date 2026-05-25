# Spec 9.2a — Fantasy/Gregorian kalendářový engine

**Status:** Draft — čeká na schválení
**Rozsah:** FE — čistá data/logická vrstva, žádné UI
**Repo:** `Projekt-ikaros-FE`, commit přímo na `main` ([[feedback_work_on_main]])
**Velikost:** ~10 souborů / ~700 řádků (vč. testů)
**Autor:** PJ + Claude
**Datum:** 2026-05-25
**Souvisí:** 9.2b (multi-config + editor), 9.2c (per-entita mřížka), 9.2d (PJ aggregate view), 9.2e (novinky fantasy datum); [spec-9.2-lokace-kalendar.md](spec-9.2-lokace-kalendar.md)

---

## 1. Cíl

Jednotný engine pro **fantasy i gregoriánský kalendář** v `src/shared/lib/calendarEngine/`. Datový model `FantasyDate`, převody mezi structured datem a `absDay` (společný epoch pro všechny kalendáře jednoho světa), výpočet **8 fází Měsíce**, sezón, měsíční mřížky a Gregorian default config. Bez UI — pouze sdílená vrstva, kterou konzumují všechny ostatní sub-spec 9.2.

---

## 2. Kontext / motivace

Krok 9.2 (kalendář světa) vyžaduje:
- Per-entita kalendář (Postava/NPC/Lokace) s mřížkovým pohledem — dnes jen seznam, vypadá mrtvě (viz [CalendarTab.tsx:71-95](../../../src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx#L71-L95) — uživatel vidí jen text „Žádné události"; chybí prázdná mřížka).
- Multi-config per svět — „Lidský kalendář", „Elfí letopočet", „Drowí kruh".
- PJ aggregate view sjednocující postavy + NPC + Lokace + world game events do jedné mřížky s **možností přepnout zobrazený kalendář** — vyžaduje společný `absDay` napříč kalendáři.
- Fantasy datum na novinkách (`WorldNews`).

Engine = nejnižší vrstva. **Bez něj nelze nic z 9.2b–e implementovat.** Současný [calendarGrid.ts](../../../src/shared/lib/calendarGrid.ts) (29 řádků) je pevně gregoriánský, JS Date, Po–Ne — pro fantasy nepoužitelný.

Inspirace: Matrix [CalendarLogic.ts](file:///c:/Matrix/Matrix/frontend/src/helpers/CalendarLogic.ts) (137 řádků, ověřená fantasy logika) — port + rozšíření o 8-fázové lunární cykly, sezóny, typovou bezpečnost a testy.

---

## 3. Audit současného stavu

### FE existující kód

| Soubor | Stav | Použití |
|---|---|---|
| [src/shared/lib/calendarGrid.ts](../../../src/shared/lib/calendarGrid.ts) | 29 ř., gregorian only, Po–Ne pevně | [CalendarPage.tsx](../../../src/features/world/pages/CalendarPage.tsx) (PJ akce world view), [CalendarTab.tsx](../../../src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx) (per-entita — ale jen list) |
| [src/shared/lib/calendarGrid.spec.ts](../../../src/shared/lib/calendarGrid.spec.ts) | Testy gregorian gridu | — |

### BE existující (read-only pro tento spec)

| Soubor | Stav |
|---|---|
| [world-calendar-config.schema.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-calendar-config/schemas/world-calendar-config.schema.ts) | Singular per svět (`worldId UNIQUE`), má `hoursPerDay`/`daysOfWeek`/`months`/`celestialBodies`/`referenceDate` |
| [character-calendar.interface.ts](file:///c:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/interfaces/character-calendar.interface.ts) | `CalendarEvent.start: string` (YYYY-MM-DD, gregorian) |

⚠️ BE změny (multi-config kolekce, FantasyDate na events, `World.timelineEpoch`) přijdou v **9.2b** — tento spec se BE nedotýká. Engine pracuje **pouze v FE paměti** s typy, které 9.2b následně přizpůsobí BE schématům.

### Referenční Matrix kód (port-source)

[CalendarLogic.ts](file:///c:/Matrix/Matrix/frontend/src/helpers/CalendarLogic.ts):
- ✅ `getAbsoluteDay` — gregorian/fantasy hybrid.
- ✅ `getFirstDayOfMonth`, `getDaysInMonth`, `generateCalendarGrid`.
- ⚠️ `getCelestialPhasesForDay` — **jen 2 fáze** (nov/úplněk). Nedostatečné, rozšířit na 8.
- ⚠️ `defaultCalendarConfig` — jen Měsíc 28d, žádné sezony, žádný `epochOffset`.

---

## 4. Návrh řešení

### 4.1 Struktura modulu

```
src/shared/lib/calendarEngine/
├── types.ts                  # FantasyDate, CalendarConfig, CelestialBody, Season, LunarPhase
├── absDay.ts                 # toAbsDay, fromAbsDay (kanonický epoch)
├── monthGrid.ts              # generateMonthGrid → GridCell[]
├── lunar.ts                  # 8-fázový cyklus
├── seasons.ts                # getSeasonForDay (wraparound-safe)
├── gregorianDefault.ts       # default config + Měsíc epoch konstanta
├── index.ts                  # public API re-exports
└── __tests__/
    ├── absDay.spec.ts
    ├── monthGrid.spec.ts
    ├── lunar.spec.ts
    ├── seasons.spec.ts
    └── gregorianDefault.spec.ts
```

### 4.2 Typy (`types.ts`)

```ts
export interface FantasyDate {
  year: number;          // může být záporný (před referenceDate)
  monthIndex: number;    // 0-based, < config.months.length
  day: number;           // 1-based, ≤ config.months[monthIndex].daysCount
  hour?: number;         // 0-based, < config.hoursPerDay (default omit = celý den)
  minute?: number;       // 0–59 (vždy 60 min/h pro jednoduchost — fantasy minutes out of scope)
}

export interface MonthDef {
  name: string;
  daysCount: number;     // ≥ 1
}

export interface CelestialBody {
  id: string;            // stable identifier
  name: string;
  orbitalPeriodDays: number;  // > 0, floating allowed (29.5306 pro reálný Měsíc)
  color: string;         // hex #rrggbb
  epochOffset: number;   // kolik absDay od epoch 0 = "nov" tohoto tělesa
  icon?: string;         // optional emoji override (default 8 phase glyphs)
}

export interface Season {
  id: string;
  name: string;
  startMonthIndex: number;  // 0-based
  startDay: number;          // 1-based
  color: string;
  icon?: string;
}

export interface CalendarConfig {
  id: string;                // BE _id, FE-only může být ""
  slug: string;              // 'gregorian', 'elfi', ...
  name: string;
  hoursPerDay: number;       // ≥ 1, default 24
  daysOfWeek: string[];      // ≥ 1 položek, např. ['Po','Út',...]
  months: MonthDef[];        // ≥ 1 položek
  celestialBodies: CelestialBody[];
  seasons: Season[];         // může být prázdné
  epochOffset: number;       // kolik absDay od World.timelineEpoch = (year:0, month:0, day:1) tohoto kalendáře; pro Gregorian default 0
}

export type LunarPhase =
  | 'new'              // 🌑
  | 'waxing-crescent'  // 🌒
  | 'first-quarter'    // 🌓
  | 'waxing-gibbous'   // 🌔
  | 'full'             // 🌕
  | 'waning-gibbous'   // 🌖
  | 'last-quarter'     // 🌗
  | 'waning-crescent'; // 🌘

export interface LunarPhaseInfo {
  body: CelestialBody;
  phase: LunarPhase;
  icon: string;     // emoji
  cyclePosition: number; // 0..1 (fáze cyklu, pro animace v 9.2c+)
}

export interface GridCell {
  date: FantasyDate;
  inCurrentMonth: boolean;   // prev/next overflow = false
  weekdayIndex: number;      // 0..daysOfWeek.length-1
  absDay: number;            // pro lunar/sezona lookup
}
```

### 4.3 `absDay.ts` — kanonický epoch

```ts
// Year 0, monthIndex 0, day 1 = absDay 0 (před započtením config.epochOffset).
// Pro porovnávání eventů napříč kalendáři: globalAbsDay = toAbsDay(date, config) + config.epochOffset.

export function toAbsDay(date: FantasyDate, config: CalendarConfig): number;
export function fromAbsDay(absDay: number, config: CalendarConfig): FantasyDate;
export function daysInYear(config: CalendarConfig): number;
export function daysInMonth(monthIndex: number, year: number, config: CalendarConfig): number;
// Gregorian special-case: leap year v daysInMonth (Únor 28/29) když isGregorianLike(config).
export function isGregorianLike(config: CalendarConfig): boolean;
```

💡 **Proč gregorian special-case:** Pure modulo by ignorovalo leap years; reálný Měsíc + reálná data v Ikaros novinkách musí respektovat 4/100/400 pravidlo. Detekce přes shape match (12 měsíců, 7 dní, daysCount[1]==28).

### 4.4 `monthGrid.ts`

```ts
export function generateMonthGrid(
  year: number,
  monthIndex: number,
  config: CalendarConfig,
): GridCell[];
// Vrátí buňky pro celé „okno" měsíce: prev-month overflow + current + next-month padding.
// Délka = ceil((firstDayOffset + daysInMonth) / daysOfWeek.length) * daysOfWeek.length.
// firstDayOffset = toAbsDay({year, monthIndex, day:1}, config) % daysOfWeek.length.
```

### 4.5 `lunar.ts` — 8 fází

```ts
const PHASE_ICONS: Record<LunarPhase, string> = {
  'new': '🌑', 'waxing-crescent': '🌒', 'first-quarter': '🌓', 'waxing-gibbous': '🌔',
  'full': '🌕', 'waning-gibbous': '🌖', 'last-quarter': '🌗', 'waning-crescent': '🌘',
};
const PHASES_ORDERED: LunarPhase[] = [...]; // 8 v pořadí

export function getLunarPhase(globalAbsDay: number, body: CelestialBody): LunarPhase {
  const cyclePos = mod(globalAbsDay - body.epochOffset, body.orbitalPeriodDays);
  const segment = Math.floor((cyclePos / body.orbitalPeriodDays) * 8);
  return PHASES_ORDERED[segment];
}

export function getLunarPhasesForDay(
  globalAbsDay: number,
  bodies: CelestialBody[],
): LunarPhaseInfo[];
```

💡 **Segmentace:** kruh dělen na 8 stejných oblouků. Pro reálný Měsíc (29.5306d) má každý ~3.69 dne. Astronomická přesnost je dostatečná pro game purposes (ne pro NASA).

### 4.6 `seasons.ts` — wraparound-safe

```ts
export function getSeasonForDay(
  date: FantasyDate,
  config: CalendarConfig,
): Season | null {
  // 1. Spočítej dayOfYear pro daný date (suma daysInMonth do monthIndex-1 + day).
  // 2. Pro každou sezónu spočítej její dayOfYear-start.
  // 3. Sortuj sezóny podle startDayOfYear vzestupně.
  // 4. Najdi tu, jejíž startDayOfYear ≤ currentDayOfYear; pokud žádná, vezmi poslední (wraparound — Zima začíná v prosinci a pokračuje do března).
}
```

### 4.7 `gregorianDefault.ts`

```ts
// Astronomický nov 6. 1. 2000 00:00 UTC → absDay v Gregorian configu (year:2000, month:0, day:6).
// Konstanta vypočítaná jednou (toAbsDay({2000,0,6})) — uložená jako MOON_EPOCH_REFERENCE_ABSDAY.
export const MOON_EPOCH_REFERENCE_ABSDAY: number;

export const GREGORIAN_DEFAULT_CONFIG: CalendarConfig = {
  id: '', slug: 'gregorian', name: 'Gregoriánský kalendář',
  hoursPerDay: 24,
  daysOfWeek: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  months: [
    { name: 'Leden', daysCount: 31 }, { name: 'Únor', daysCount: 28 }, ...
  ],
  celestialBodies: [{
    id: 'moon', name: 'Měsíc',
    orbitalPeriodDays: 29.5306,  // synodický měsíc
    color: '#c0c8d0',
    epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
  }],
  seasons: [
    { id: 'jaro', name: 'Jaro', startMonthIndex: 2, startDay: 21, color: '#7cb342', icon: '🌸' },
    { id: 'leto', name: 'Léto', startMonthIndex: 5, startDay: 21, color: '#fbc02d', icon: '☀️' },
    { id: 'podzim', name: 'Podzim', startMonthIndex: 8, startDay: 23, color: '#e65100', icon: '🍂' },
    { id: 'zima', name: 'Zima', startMonthIndex: 11, startDay: 21, color: '#42a5f5', icon: '❄️' },
  ],
  epochOffset: 0, // Gregorian = referenční kalendář
};
```

### 4.8 Public API (`index.ts`)

```ts
export * from './types';
export { toAbsDay, fromAbsDay, daysInYear, daysInMonth, isGregorianLike } from './absDay';
export { generateMonthGrid } from './monthGrid';
export { getLunarPhase, getLunarPhasesForDay } from './lunar';
export { getSeasonForDay } from './seasons';
export { GREGORIAN_DEFAULT_CONFIG, MOON_EPOCH_REFERENCE_ABSDAY } from './gregorianDefault';
```

### 4.9 Stávající `calendarGrid.ts` — co s ním

**Nechat beze změny.** Stávající `buildMonthGrid` používá [CalendarPage.tsx](../../../src/features/world/pages/CalendarPage.tsx) a tento spec se ho nedotýká. Refactor [CalendarPage.tsx](../../../src/features/world/pages/CalendarPage.tsx) na nový engine přijde v **9.2d** (PJ aggregate view). [CalendarTab.tsx](../../../src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx) → refactor v **9.2c**.

Žádný hard cut, žádná deprecation poznámka — engine žije v izolovaném modulu, konzumenti se přepojí inkrementálně. Per [[feedback_no_debt]] = každý sub-krok dotáhne svou část kompletně, ne polovičně.

---

## 5. Out of scope

- ❌ Žádné UI komponenty (picker, mřížka render, lunar overlay) — 9.2c/d.
- ❌ Žádné BE schema změny — kolekce `world-calendar-configs`, `World.timelineEpoch`, `World.defaultCalendarConfigId`, `CalendarEvent.calendarConfigId/calendarDate` přijdou v 9.2b.
- ❌ Žádný refactor stávajících konzumentů ([CalendarPage.tsx](../../../src/features/world/pages/CalendarPage.tsx), [CalendarTab.tsx](../../../src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx)) — 9.2c/d.
- ❌ Žádný `FantasyDateRange` (multi-day event spans) — pokud bude potřeba, vyrobí se v 9.2c jako rozšíření.
- ❌ Žádný `getMoonPhaseDescription(phase) → 'Dnes je úplněk...'` text helper — UI vrstva.
- ❌ Roční období jako astronomické přechody (equinox/solstice výpočet) — sezóny jsou čistě konfigurační (PJ definuje startMonthIndex+startDay).
- ❌ Časová pásma, kalendářové reformy (Julian→Gregorian 1582), historické anomálie.

---

## 6. Acceptance kritéria

1. ✅ Soubor [src/shared/lib/calendarEngine/index.ts](../../../src/shared/lib/calendarEngine/index.ts) exportuje 14 symbolů (5 typů + 9 funkcí/konstant).
2. ✅ `toAbsDay(fromAbsDay(n, cfg), cfg) === n` pro Gregorian default i fantasy config (property test 1000 náhodných n ∈ [-100000, 100000]).
3. ✅ `fromAbsDay(toAbsDay(d, cfg), cfg)` strukturně rovno `d` pro Gregorian + 3 fantasy configy (12m/7d, 13m/5d, 10m/8d).
4. ✅ `getLunarPhase` vrací očekávané fáze pro **5 reference reálných datumů** Měsíce (např. 6. 1. 2000 = 'new'; 21. 1. 2000 = 'first-quarter'; 14. 4. 2025 = 'full' — ověřit dle NASA tabulek a hardcodovat jako test fixtures).
5. ✅ `getSeasonForDay` respektuje wraparound — 31. 12. → 'Zima', 1. 1. → 'Zima', 20. 3. → 'Zima', 21. 3. → 'Jaro'.
6. ✅ `generateMonthGrid` produkuje multiple of `daysOfWeek.length`; `inCurrentMonth=false` pro overflow buňky.
7. ✅ `isGregorianLike(GREGORIAN_DEFAULT_CONFIG) === true`; pro fantasy config s 12m + 7d ale jinými názvy → také `true` (tolerantní shape match — leap day check je primárně defenzivní). *Pokud detekce false-positives v testech, zpřísnit na exact match `daysOfWeek === ['Po','Út',...]`.*
8. ✅ Vitest coverage `src/shared/lib/calendarEngine/**` ≥ 90 % lines.
9. ✅ Žádný import z `@/features/*` ani `@/shared/ui/*` — engine je čistá knihovna.
10. ✅ TypeScript strict mode, žádné `any`, žádné `@ts-ignore`.

---

## 7. Test plán

### Automated (vitest)

| Soubor | Co testuje |
|---|---|
| `absDay.spec.ts` | Round-trip Gregorian + 3 fantasy configy; leap year boundary (29. 2. 2000 vs 28. 2. 1900); záporné roky |
| `monthGrid.spec.ts` | Délka multiple of weekLength; overflow flags; první buňka = pondělí pro Gregorian |
| `lunar.spec.ts` | 5 reference NASA datumů Měsíce; fantasy body s 16d cyklem dává všech 8 fází; segmentace na boundaries (cyclePos = period/8 exactly) |
| `seasons.spec.ts` | 4 reference dat (Jaro/Léto/Podzim/Zima starts); wraparound test (31. 12. = Zima); prázdné `seasons[]` → `null` |
| `gregorianDefault.spec.ts` | Konstanta `MOON_EPOCH_REFERENCE_ABSDAY` vrátí 'new' fázi; všech 12 měsíců valid; 4 sezóny valid |

### Manuální smoke

- `pnpm test src/shared/lib/calendarEngine` zelené.
- `pnpm typecheck` zelené.
- Žádné regrese v `calendarGrid.spec.ts` (nedotčeno).

---

## 8. Riziko & rollback

| ID | Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|---|
| R1 | Off-by-one v `toAbsDay/fromAbsDay` | střední | vysoký (špatná data v 9.2b+) | Property-based round-trip testy 1000× |
| R2 | Floating-point drift lunar cycle (29.5306) | nízká | nízký | `Math.floor((cyclePos / period) * 8)` deterministická; epsilon test |
| R3 | Sezóna wraparound bug | střední | střední | Explicit test pro hraniční dny |
| R4 | Gregorian leap year detection false-positive na fantasy 12m/7d/28d config | nízká | nízký (pouze daysInMonth(Únor) ovlivnění) | Pokud problém, zpřísnit detekci na exact daysOfWeek match |
| R5 | Performance — `getLunarPhasesForDay` × 42 buněk × N těles na render | nízká | nízký | Pure functions, lze memoize per (absDay, bodyId) v 9.2c/d |

**Rollback:** Modul je čistě additive, izolovaný, žádné touche existujícího kódu. Smazat `src/shared/lib/calendarEngine/` adresář = full revert.

---

## 9. Otázky k autorovi

**Žádné, autor delegoval, volby:**

- Auto-seed Gregorian config při novém světě = **ano** (řešeno v 9.2b, tento spec jen exportuje `GREGORIAN_DEFAULT_CONFIG`).
- `epochOffset` Měsíce = **zapečen** jako `MOON_EPOCH_REFERENCE_ABSDAY` konstanta.
- Sezóny součást engine = **ano**, řešeny zde + UI editor v 9.2b.
- 8-fázový lunar cycle = **ano** (Matrix měl jen 2 fáze, rozšíření).
- Stávající `calendarGrid.ts` nechat beze změny = **ano**, refactor konzumentů přijde v 9.2c/d.
- Multi-day event spans = **out of scope**, případné rozšíření v 9.2c.

---

**Po schválení specu napíšu implementační plán** (přesné soubory + obsah + testy).
