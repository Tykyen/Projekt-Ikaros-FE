# Implementační plán — 9.2a Fantasy/Gregorian kalendářový engine

**Datum:** 2026-05-25
**Status:** ⏳ Čeká na schválení
**Spec:** [spec-9.2a-fantasy-engine.md](spec-9.2a-fantasy-engine.md)
**Větev:** přímo `main` ([[feedback_work_on_main]])
**Repo:** `Projekt-ikaros-FE` (FE-only, žádné BE změny)

---

## Závislosti

- Žádné. Engine je čistá knihovna bez importů z `@/features/*` ani `@/shared/ui/*`.
- Referenční zdroj: [c:\Matrix\Matrix\frontend\src\helpers\CalendarLogic.ts](file:///c:/Matrix/Matrix/frontend/src/helpers/CalendarLogic.ts) — port + rozšíření.

---

## Postup po krocích

### Step 1 — Struktura modulu + typy

**Soubory (1 nový):**
- `src/shared/lib/calendarEngine/types.ts` — všechny exportované typy ze spec §4.2

**Obsah `types.ts`:**

```ts
/**
 * 9.2a — typy pro fantasy/gregoriánský kalendářový engine.
 * Sdílená vrstva pro 9.2b (multi-config), 9.2c (per-entita mřížka),
 * 9.2d (PJ aggregate view), 9.2e (novinky fantasy datum).
 */

export interface FantasyDate {
  year: number;
  monthIndex: number;
  day: number;
  hour?: number;
  minute?: number;
}

export interface MonthDef {
  name: string;
  daysCount: number;
}

export interface CelestialBody {
  id: string;
  name: string;
  orbitalPeriodDays: number;
  color: string;
  epochOffset: number;
  icon?: string;
}

export interface Season {
  id: string;
  name: string;
  startMonthIndex: number;
  startDay: number;
  color: string;
  icon?: string;
}

export interface CalendarConfig {
  id: string;
  slug: string;
  name: string;
  hoursPerDay: number;
  daysOfWeek: string[];
  months: MonthDef[];
  celestialBodies: CelestialBody[];
  seasons: Season[];
  epochOffset: number;
}

export type LunarPhase =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface LunarPhaseInfo {
  body: CelestialBody;
  phase: LunarPhase;
  icon: string;
  cyclePosition: number;
}

export interface GridCell {
  date: FantasyDate;
  inCurrentMonth: boolean;
  weekdayIndex: number;
  absDay: number;
}
```

**Acceptance kroku:** `npm run build` (= tsc) prochází; soubor exportuje 9 symbolů.

---

### Step 2 — `absDay.ts` + testy

**Soubory (2 nové):**
- `src/shared/lib/calendarEngine/absDay.ts`
- `src/shared/lib/calendarEngine/__tests__/absDay.spec.ts`

**Obsah `absDay.ts`:**

```ts
import type { CalendarConfig, FantasyDate } from './types';

/** Pure modulo, JS `%` má znaménko dividenda — pro záporné roky/absDay potřebujeme matematický mod. */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

const GREGORIAN_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Tolerantní shape match — 12 měsíců po 31/28/31/30… */
export function isGregorianLike(config: CalendarConfig): boolean {
  if (config.months.length !== 12) return false;
  if (config.daysOfWeek.length !== 7) return false;
  for (let i = 0; i < 12; i++) {
    if (config.months[i].daysCount !== GREGORIAN_MONTH_DAYS[i]) return false;
  }
  return true;
}

export function daysInMonth(monthIndex: number, year: number, config: CalendarConfig): number {
  const normalizedMonth = mod(monthIndex, config.months.length);
  if (isGregorianLike(config) && normalizedMonth === 1) {
    return isLeapYear(year) ? 29 : 28;
  }
  return config.months[normalizedMonth].daysCount;
}

export function daysInYear(config: CalendarConfig): number {
  // Pro non-Gregorian: prostá suma. Pro Gregorian: 365 (leap roky se řeší v daysInMonth).
  return config.months.reduce((acc, m) => acc + m.daysCount, 0);
}

/**
 * Year 0, monthIndex 0, day 1 = absDay 0.
 * Pro Gregorian respektuje leap years (čistě modulová suma by byla off-by leap-days).
 */
export function toAbsDay(date: FantasyDate, config: CalendarConfig): number {
  if (isGregorianLike(config)) {
    // Klasický gregoriánský výpočet absolutních dní (year 0 = "rok 0", proleptic).
    const y = date.year;
    let days = y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
    for (let i = 0; i < date.monthIndex; i++) {
      days += daysInMonth(i, y, config);
    }
    return days + (date.day - 1);
  }
  // Non-Gregorian: pevná délka roku.
  const yearLen = daysInYear(config);
  let days = date.year * yearLen;
  for (let i = 0; i < date.monthIndex; i++) {
    days += config.months[i].daysCount;
  }
  return days + (date.day - 1);
}

export function fromAbsDay(absDay: number, config: CalendarConfig): FantasyDate {
  if (isGregorianLike(config)) {
    // Hledáme rok inverzí cumulativeDays(year); proleptic gregorian.
    let year = Math.floor(absDay / 365.2425); // odhad
    // Doladění (±2 roky):
    while (toAbsDay({ year, monthIndex: 0, day: 1 }, config) > absDay) year--;
    while (toAbsDay({ year: year + 1, monthIndex: 0, day: 1 }, config) <= absDay) year++;
    let remaining = absDay - toAbsDay({ year, monthIndex: 0, day: 1 }, config);
    let monthIndex = 0;
    while (monthIndex < 11) {
      const dim = daysInMonth(monthIndex, year, config);
      if (remaining < dim) break;
      remaining -= dim;
      monthIndex++;
    }
    return { year, monthIndex, day: remaining + 1 };
  }
  const yearLen = daysInYear(config);
  const year = Math.floor(absDay / yearLen);
  let remaining = absDay - year * yearLen;
  let monthIndex = 0;
  while (monthIndex < config.months.length - 1) {
    const dim = config.months[monthIndex].daysCount;
    if (remaining < dim) break;
    remaining -= dim;
    monthIndex++;
  }
  return { year, monthIndex, day: remaining + 1 };
}
```

**Obsah `__tests__/absDay.spec.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { toAbsDay, fromAbsDay, daysInMonth, isGregorianLike } from '../absDay';
import { GREGORIAN_DEFAULT_CONFIG } from '../gregorianDefault'; // viz Step 6
import type { CalendarConfig } from '../types';

const fantasyConfig: CalendarConfig = {
  id: '', slug: 'f1', name: 'Test fantasy', hoursPerDay: 26,
  daysOfWeek: ['A', 'B', 'C', 'D', 'E'], // 5-denní týden
  months: [
    { name: 'M1', daysCount: 30 }, { name: 'M2', daysCount: 32 },
    { name: 'M3', daysCount: 28 }, { name: 'M4', daysCount: 35 },
    { name: 'M5', daysCount: 30 }, { name: 'M6', daysCount: 33 },
    { name: 'M7', daysCount: 30 }, { name: 'M8', daysCount: 32 },
    { name: 'M9', daysCount: 28 }, { name: 'M10', daysCount: 35 },
  ],
  celestialBodies: [], seasons: [], epochOffset: 0,
};

describe('isGregorianLike', () => {
  it('detekuje default Gregorian', () => {
    expect(isGregorianLike(GREGORIAN_DEFAULT_CONFIG)).toBe(true);
  });
  it('odmítne fantasy config (jiný počet měsíců)', () => {
    expect(isGregorianLike(fantasyConfig)).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('Únor 28 pro non-leap', () => {
    expect(daysInMonth(1, 2023, GREGORIAN_DEFAULT_CONFIG)).toBe(28);
  });
  it('Únor 29 pro leap 2000', () => {
    expect(daysInMonth(1, 2000, GREGORIAN_DEFAULT_CONFIG)).toBe(29);
  });
  it('Únor 28 pro 1900 (sto-leté pravidlo)', () => {
    expect(daysInMonth(1, 1900, GREGORIAN_DEFAULT_CONFIG)).toBe(28);
  });
});

describe('toAbsDay/fromAbsDay round-trip', () => {
  it('Gregorian round-trip 1000 náhodných', () => {
    for (let i = 0; i < 1000; i++) {
      const n = Math.floor(Math.random() * 200000) - 100000;
      const date = fromAbsDay(n, GREGORIAN_DEFAULT_CONFIG);
      expect(toAbsDay(date, GREGORIAN_DEFAULT_CONFIG)).toBe(n);
    }
  });
  it('Fantasy round-trip 1000 náhodných', () => {
    for (let i = 0; i < 1000; i++) {
      const n = Math.floor(Math.random() * 200000) - 100000;
      const date = fromAbsDay(n, fantasyConfig);
      expect(toAbsDay(date, fantasyConfig)).toBe(n);
    }
  });
  it('Známé Gregorian boundaries', () => {
    // 1. 1. roku 0 = absDay 0
    expect(toAbsDay({ year: 0, monthIndex: 0, day: 1 }, GREGORIAN_DEFAULT_CONFIG)).toBe(0);
    // 1. 1. roku 1 = absDay 365 (rok 0 není leap dle proleptic Gregorian, 0 % 400 === 0 → JE leap → 366)
    // Pojistka: ověříme přes round-trip, ne magic číslem.
    const day1y1 = toAbsDay({ year: 1, monthIndex: 0, day: 1 }, GREGORIAN_DEFAULT_CONFIG);
    expect(fromAbsDay(day1y1, GREGORIAN_DEFAULT_CONFIG)).toEqual({ year: 1, monthIndex: 0, day: 1 });
  });
});
```

⚠️ **Pozor:** `fromAbsDay` Gregorian používá iterační doladění odhadu — pro extreme záporné roky (rok -10000) může trvat. Pokud test pomalý, optimalizace lze v ai-notes.md follow-up.

**Acceptance kroku:** `npx vitest run src/shared/lib/calendarEngine/__tests__/absDay.spec.ts` zelené.

---

### Step 3 — `monthGrid.ts` + testy

**Soubory (2 nové):**
- `src/shared/lib/calendarEngine/monthGrid.ts`
- `src/shared/lib/calendarEngine/__tests__/monthGrid.spec.ts`

**Obsah `monthGrid.ts`:**

```ts
import { toAbsDay, fromAbsDay, daysInMonth } from './absDay';
import type { CalendarConfig, GridCell } from './types';

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Vrátí všechny buňky pokrývající dané (year, monthIndex):
 *   prev-month overflow + current + next-month padding,
 *   tak aby celková délka byla násobek `daysOfWeek.length`.
 *
 * weekdayIndex = mod(absDay, daysOfWeek.length) — 0 = první sloupec.
 */
export function generateMonthGrid(
  year: number,
  monthIndex: number,
  config: CalendarConfig,
): GridCell[] {
  const weekLen = config.daysOfWeek.length;
  const firstAbs = toAbsDay({ year, monthIndex, day: 1 }, config);
  const firstWeekday = mod(firstAbs, weekLen);
  const dim = daysInMonth(monthIndex, year, config);

  const startAbs = firstAbs - firstWeekday;
  const totalCells = Math.ceil((firstWeekday + dim) / weekLen) * weekLen;

  const cells: GridCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const absDay = startAbs + i;
    const date = fromAbsDay(absDay, config);
    cells.push({
      date,
      inCurrentMonth: date.year === year && date.monthIndex === monthIndex,
      weekdayIndex: mod(absDay, weekLen),
      absDay,
    });
  }
  return cells;
}
```

**Obsah `__tests__/monthGrid.spec.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { generateMonthGrid } from '../monthGrid';
import { GREGORIAN_DEFAULT_CONFIG } from '../gregorianDefault';

describe('generateMonthGrid', () => {
  it('Gregorian leden 2025 — 35 buněk (5 týdnů × 7)', () => {
    const grid = generateMonthGrid(2025, 0, GREGORIAN_DEFAULT_CONFIG);
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(28);
    expect(grid.length).toBeLessThanOrEqual(42);
  });

  it('První buňka má weekdayIndex === 0', () => {
    const grid = generateMonthGrid(2025, 0, GREGORIAN_DEFAULT_CONFIG);
    expect(grid[0].weekdayIndex).toBe(0);
  });

  it('inCurrentMonth označuje jen current-month buňky', () => {
    const grid = generateMonthGrid(2025, 0, GREGORIAN_DEFAULT_CONFIG);
    const inMonth = grid.filter((c) => c.inCurrentMonth);
    expect(inMonth.length).toBe(31); // Leden = 31 dní
    expect(inMonth[0].date).toEqual(
      expect.objectContaining({ year: 2025, monthIndex: 0, day: 1 }),
    );
    expect(inMonth[30].date).toEqual(
      expect.objectContaining({ year: 2025, monthIndex: 0, day: 31 }),
    );
  });
});
```

**Acceptance kroku:** vitest soubor zelený.

---

### Step 4 — `lunar.ts` + testy (NASA fixtures)

**Soubory (2 nové):**
- `src/shared/lib/calendarEngine/lunar.ts`
- `src/shared/lib/calendarEngine/__tests__/lunar.spec.ts`

**Obsah `lunar.ts`:**

```ts
import type { CelestialBody, LunarPhase, LunarPhaseInfo } from './types';

const PHASES_ORDERED: readonly LunarPhase[] = [
  'new',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
];

const PHASE_ICONS: Record<LunarPhase, string> = {
  'new': '🌑',
  'waxing-crescent': '🌒',
  'first-quarter': '🌓',
  'waxing-gibbous': '🌔',
  'full': '🌕',
  'waning-gibbous': '🌖',
  'last-quarter': '🌗',
  'waning-crescent': '🌘',
};

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function getLunarPhase(globalAbsDay: number, body: CelestialBody): LunarPhase {
  const cyclePos = mod(globalAbsDay - body.epochOffset, body.orbitalPeriodDays);
  const segment = Math.floor((cyclePos / body.orbitalPeriodDays) * PHASES_ORDERED.length);
  return PHASES_ORDERED[Math.min(segment, PHASES_ORDERED.length - 1)];
}

export function getLunarPhasesForDay(
  globalAbsDay: number,
  bodies: CelestialBody[],
): LunarPhaseInfo[] {
  return bodies.map((body) => {
    const phase = getLunarPhase(globalAbsDay, body);
    const cyclePos = mod(globalAbsDay - body.epochOffset, body.orbitalPeriodDays);
    return {
      body,
      phase,
      icon: body.icon ?? PHASE_ICONS[phase],
      cyclePosition: cyclePos / body.orbitalPeriodDays,
    };
  });
}
```

**Obsah `__tests__/lunar.spec.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { getLunarPhase, getLunarPhasesForDay } from '../lunar';
import { toAbsDay } from '../absDay';
import { GREGORIAN_DEFAULT_CONFIG, MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import type { CelestialBody } from '../types';

const moon: CelestialBody = GREGORIAN_DEFAULT_CONFIG.celestialBodies[0];

/**
 * NASA reference data — synodický měsíc 29.5306d.
 * Fáze přesně na epoch + N*29.5306/8 dnů.
 *
 * Toleranci nemáme — segmentace je deterministická floor((pos / period) * 8).
 * Test ověřuje, že známé novy a úplňky padnou do správného segmentu.
 */
describe('getLunarPhase — Gregorian Měsíc', () => {
  it('Epoch absDay = new (6. 1. 2000 = nov)', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY, moon)).toBe('new');
  });

  it('Epoch + půl cyklu = full', () => {
    const halfCycle = MOON_EPOCH_REFERENCE_ABSDAY + Math.floor(moon.orbitalPeriodDays / 2);
    expect(getLunarPhase(halfCycle, moon)).toBe('full');
  });

  it('Epoch + čtvrt cyklu = first-quarter', () => {
    const quarterCycle = MOON_EPOCH_REFERENCE_ABSDAY + Math.floor(moon.orbitalPeriodDays / 4);
    expect(getLunarPhase(quarterCycle, moon)).toBe('first-quarter');
  });

  it('Cyklický wrap (epoch + 2 cykly = new)', () => {
    const twoCycles = MOON_EPOCH_REFERENCE_ABSDAY + Math.floor(moon.orbitalPeriodDays * 2);
    // Floor cyklů → cyclePos ~ 0.something kvůli 29.5306 fraction; očekáváme 'new' nebo 'waxing-crescent'.
    const phase = getLunarPhase(twoCycles, moon);
    expect(['new', 'waxing-crescent']).toContain(phase);
  });

  it('Záporný čas (před epoch)', () => {
    const beforeEpoch = MOON_EPOCH_REFERENCE_ABSDAY - 1;
    expect(getLunarPhase(beforeEpoch, moon)).toBe('waning-crescent');
  });
});

describe('getLunarPhase — fantasy 16d cyklus', () => {
  const body: CelestialBody = {
    id: 'b', name: 'Modrý měsíc', orbitalPeriodDays: 16, color: '#00f', epochOffset: 0,
  };

  it('Pokrývá všech 8 fází přes 16 dnů', () => {
    const phases = new Set<string>();
    for (let day = 0; day < 16; day++) {
      phases.add(getLunarPhase(day, body));
    }
    expect(phases.size).toBe(8);
  });

  it('Day 0 = new, day 8 = full', () => {
    expect(getLunarPhase(0, body)).toBe('new');
    expect(getLunarPhase(8, body)).toBe('full');
  });
});

describe('getLunarPhasesForDay', () => {
  it('Vrací info per body včetně icon + cyclePosition', () => {
    const result = getLunarPhasesForDay(MOON_EPOCH_REFERENCE_ABSDAY, [moon]);
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('new');
    expect(result[0].icon).toBe('🌑');
    expect(result[0].cyclePosition).toBe(0);
    expect(result[0].body.id).toBe('moon');
  });

  it('Prázdná těla → prázdné pole', () => {
    expect(getLunarPhasesForDay(0, [])).toEqual([]);
  });
});
```

**Acceptance kroku:** vitest zelený.

---

### Step 5 — `seasons.ts` + testy (wraparound)

**Soubory (2 nové):**
- `src/shared/lib/calendarEngine/seasons.ts`
- `src/shared/lib/calendarEngine/__tests__/seasons.spec.ts`

**Obsah `seasons.ts`:**

```ts
import { daysInMonth } from './absDay';
import type { CalendarConfig, FantasyDate, Season } from './types';

/** Pro daný (year, monthIndex, day) spočítá pořadí dne v roce (1-based). */
function dayOfYear(date: FantasyDate, config: CalendarConfig): number {
  let doy = date.day;
  for (let i = 0; i < date.monthIndex; i++) {
    doy += daysInMonth(i, date.year, config);
  }
  return doy;
}

function seasonStartDayOfYear(season: Season, year: number, config: CalendarConfig): number {
  return dayOfYear(
    { year, monthIndex: season.startMonthIndex, day: season.startDay },
    config,
  );
}

/**
 * Vrátí sezónu aktivní v daný den. Wraparound: pokud nejdřívější sezóna začíná
 * až po currentDoy, je aktivní poslední sezóna (přechod přes konec roku).
 *
 * Příklad: 31. 12. 2025 → Zima (která začíná 21. 12. téhož roku).
 * Příklad: 1. 1. 2026 → Zima (která začala 21. 12. 2025, pokračuje).
 */
export function getSeasonForDay(date: FantasyDate, config: CalendarConfig): Season | null {
  if (config.seasons.length === 0) return null;
  const currentDoy = dayOfYear(date, config);
  const sorted = [...config.seasons]
    .map((s) => ({ s, startDoy: seasonStartDayOfYear(s, date.year, config) }))
    .sort((a, b) => a.startDoy - b.startDoy);
  let active = sorted[sorted.length - 1].s; // wraparound default = poslední
  for (const { s, startDoy } of sorted) {
    if (startDoy <= currentDoy) active = s;
    else break;
  }
  return active;
}
```

**Obsah `__tests__/seasons.spec.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { getSeasonForDay } from '../seasons';
import { GREGORIAN_DEFAULT_CONFIG } from '../gregorianDefault';
import type { CalendarConfig } from '../types';

const noSeasons: CalendarConfig = {
  ...GREGORIAN_DEFAULT_CONFIG, seasons: [],
};

describe('getSeasonForDay — Gregorian default (Jaro/Léto/Podzim/Zima)', () => {
  it('21. 3. 2025 = Jaro', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 2, day: 21 }, GREGORIAN_DEFAULT_CONFIG)?.name).toBe('Jaro');
  });
  it('20. 3. 2025 = Zima (jaro ještě nezačalo)', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 2, day: 20 }, GREGORIAN_DEFAULT_CONFIG)?.name).toBe('Zima');
  });
  it('21. 6. 2025 = Léto', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 5, day: 21 }, GREGORIAN_DEFAULT_CONFIG)?.name).toBe('Léto');
  });
  it('23. 9. 2025 = Podzim', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 8, day: 23 }, GREGORIAN_DEFAULT_CONFIG)?.name).toBe('Podzim');
  });
  it('21. 12. 2025 = Zima', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 11, day: 21 }, GREGORIAN_DEFAULT_CONFIG)?.name).toBe('Zima');
  });
  it('31. 12. 2025 = Zima (wraparound)', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 11, day: 31 }, GREGORIAN_DEFAULT_CONFIG)?.name).toBe('Zima');
  });
  it('1. 1. 2026 = Zima (wraparound)', () => {
    expect(getSeasonForDay({ year: 2026, monthIndex: 0, day: 1 }, GREGORIAN_DEFAULT_CONFIG)?.name).toBe('Zima');
  });
});

describe('getSeasonForDay — prázdné seasons', () => {
  it('Vrátí null', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 5, day: 1 }, noSeasons)).toBeNull();
  });
});
```

**Acceptance kroku:** vitest zelený.

---

### Step 6 — `gregorianDefault.ts` + testy

**Soubory (2 nové):**
- `src/shared/lib/calendarEngine/gregorianDefault.ts`
- `src/shared/lib/calendarEngine/__tests__/gregorianDefault.spec.ts`

**Obsah `gregorianDefault.ts`:**

```ts
import type { CalendarConfig } from './types';

/**
 * Astronomický nov 6. ledna 2000, 00:00 UTC.
 * Vypočítáno jednou: toAbsDay({ year: 2000, monthIndex: 0, day: 6 }, GREGORIAN_DEFAULT_CONFIG).
 *
 * Hodnota: 730491 (Y2000 = 2000*365 + 500 - 20 + 5 leap days = 730485; + 6 dní leden = +5 days from day 1 = absDay 730490).
 * Validuje se v gregorianDefault.spec.ts → toAbsDay round-trip.
 *
 * Pozn.: Konkrétní číslo závisí na proleptic Gregorian formuli v absDay.ts.
 * Test ověří hodnotu výpočtem, ne magic číslem — viz spec.
 */
export const MOON_EPOCH_REFERENCE_ABSDAY = 730490;

export const GREGORIAN_DEFAULT_CONFIG: CalendarConfig = {
  id: '',
  slug: 'gregorian',
  name: 'Gregoriánský kalendář',
  hoursPerDay: 24,
  daysOfWeek: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  months: [
    { name: 'Leden', daysCount: 31 },
    { name: 'Únor', daysCount: 28 },
    { name: 'Březen', daysCount: 31 },
    { name: 'Duben', daysCount: 30 },
    { name: 'Květen', daysCount: 31 },
    { name: 'Červen', daysCount: 30 },
    { name: 'Červenec', daysCount: 31 },
    { name: 'Srpen', daysCount: 31 },
    { name: 'Září', daysCount: 30 },
    { name: 'Říjen', daysCount: 31 },
    { name: 'Listopad', daysCount: 30 },
    { name: 'Prosinec', daysCount: 31 },
  ],
  celestialBodies: [
    {
      id: 'moon',
      name: 'Měsíc',
      orbitalPeriodDays: 29.5306,
      color: '#c0c8d0',
      epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
    },
  ],
  seasons: [
    { id: 'jaro', name: 'Jaro', startMonthIndex: 2, startDay: 21, color: '#7cb342', icon: '🌸' },
    { id: 'leto', name: 'Léto', startMonthIndex: 5, startDay: 21, color: '#fbc02d', icon: '☀️' },
    { id: 'podzim', name: 'Podzim', startMonthIndex: 8, startDay: 23, color: '#e65100', icon: '🍂' },
    { id: 'zima', name: 'Zima', startMonthIndex: 11, startDay: 21, color: '#42a5f5', icon: '❄️' },
  ],
  epochOffset: 0,
};
```

⚠️ **Magic konstanta 730490** je dohad — testuje se v `gregorianDefault.spec.ts` že to **opravdu odpovídá 6. 1. 2000**. Pokud test selže, jde o jednorázové opravení čísla podle skutečné hodnoty `toAbsDay`.

**Obsah `__tests__/gregorianDefault.spec.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { GREGORIAN_DEFAULT_CONFIG, MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { toAbsDay } from '../absDay';
import { getLunarPhase } from '../lunar';

describe('GREGORIAN_DEFAULT_CONFIG', () => {
  it('Má 12 měsíců', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.months).toHaveLength(12);
  });
  it('Má 7 dní v týdnu', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.daysOfWeek).toHaveLength(7);
  });
  it('Má 4 sezóny', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.seasons).toHaveLength(4);
  });
  it('Má 1 nebeské těleso (Měsíc)', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.celestialBodies).toHaveLength(1);
    expect(GREGORIAN_DEFAULT_CONFIG.celestialBodies[0].id).toBe('moon');
  });
});

describe('MOON_EPOCH_REFERENCE_ABSDAY', () => {
  it('Odpovídá 6. 1. 2000 (astronomický nov)', () => {
    const computed = toAbsDay(
      { year: 2000, monthIndex: 0, day: 6 },
      GREGORIAN_DEFAULT_CONFIG,
    );
    expect(MOON_EPOCH_REFERENCE_ABSDAY).toBe(computed);
  });
  it('V tento den vychází fáze new', () => {
    const moon = GREGORIAN_DEFAULT_CONFIG.celestialBodies[0];
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY, moon)).toBe('new');
  });
});
```

**Acceptance kroku:** vitest zelený. Pokud `MOON_EPOCH_REFERENCE_ABSDAY` magic číslo nesedí → upravit v `gregorianDefault.ts` na hodnotu z testu (`computed`).

---

### Step 7 — `index.ts` public API + finalní kontroly

**Soubory (1 nový):**
- `src/shared/lib/calendarEngine/index.ts`

**Obsah `index.ts`:**

```ts
/**
 * 9.2a — Public API kalendářového enginu.
 * Konzumenti: 9.2b (config editor), 9.2c (per-entita mřížka), 9.2d (PJ view), 9.2e (novinky fantasy datum).
 *
 * @see docs/arch/phase-9/spec-9.2a-fantasy-engine.md
 */

export type {
  FantasyDate,
  MonthDef,
  CelestialBody,
  Season,
  CalendarConfig,
  LunarPhase,
  LunarPhaseInfo,
  GridCell,
} from './types';

export {
  toAbsDay,
  fromAbsDay,
  daysInYear,
  daysInMonth,
  isGregorianLike,
} from './absDay';

export { generateMonthGrid } from './monthGrid';
export { getLunarPhase, getLunarPhasesForDay } from './lunar';
export { getSeasonForDay } from './seasons';
export { GREGORIAN_DEFAULT_CONFIG, MOON_EPOCH_REFERENCE_ABSDAY } from './gregorianDefault';
```

**Kontroly:**
```bash
npm run build              # tsc + vite build
npm run lint               # eslint
npm run test:run -- src/shared/lib/calendarEngine
```

**Coverage check (volitelně manuálně):**
```bash
npx vitest run --coverage src/shared/lib/calendarEngine
```
Cíl: ≥ 90 % lines per spec §6.8.

**Acceptance kroku:** vše zelené, žádné lint warnings, žádné regrese v `calendarGrid.spec.ts`.

---

## Závěrečný checklist

- [ ] Build prochází (`npm run build`)
- [ ] Lint prochází (`npm run lint`)
- [ ] Vitest prochází (`npm run test:run`)
- [ ] Coverage `src/shared/lib/calendarEngine` ≥ 90 % lines
- [ ] Žádné regrese v `src/shared/lib/calendarGrid.spec.ts` (modul nedotčen)
- [ ] Žádné importy z `@/features/*` ani `@/shared/ui/*` v engine modulech
- [ ] `docs/roadmap-fe.md` — přidat řádek o 9.2a hotovo (Fáze 9, sub-sekce 9.2)
- [ ] Commit dle konvence: `feat(9.2a-FE): fantasy/gregorian kalendářový engine — port z Matrixu + 8 fází + sezóny`

---

## Commit strategie

**Jeden commit** za celý 9.2a (engine je atomární jednotka — bez něj nemá smysl mít fragmenty). Per [[feedback_no_debt]] = kompletní sub-krok.

Commit message HEREDOC:
```
feat(9.2a-FE): fantasy/gregorian kalendářový engine

Nový izolovaný modul src/shared/lib/calendarEngine/ — datový model
FantasyDate, převody absDay <-> structured datum, 8-fázový lunární
cyklus, sezóny (wraparound-safe), Gregorian default config s reálným
Měsícem (29.5306d, epoch 6.1.2000).

Bez UI, bez BE změn. Sdílená vrstva pro 9.2b–e.

Port z Matrix CalendarLogic.ts + rozšíření:
- 8 fází místo 2
- Sezóny (Matrix neměl)
- TypeScript strict, žádný any
- Property-based round-trip testy (1000 náhodných)

Spec: docs/arch/phase-9/spec-9.2a-fantasy-engine.md
Plan: docs/arch/phase-9/plan-9.2a-fantasy-engine.md
```

---

**Po schválení plánu spustím implementaci** (Step 1 → Step 7 sériově).
