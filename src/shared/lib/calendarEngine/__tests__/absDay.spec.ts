import { describe, expect, it } from 'vitest';
import { daysInMonth, fromAbsDay, isGregorianLike, toAbsDay } from '../absDay';
import { GREGORIAN_DEFAULT_CONFIG } from '../gregorianDefault';
import type { CalendarConfig } from '../types';

const fantasyConfig: CalendarConfig = {
  id: '',
  slug: 'f1',
  name: 'Test fantasy',
  hoursPerDay: 26,
  daysOfWeek: ['A', 'B', 'C', 'D', 'E'],
  months: [
    { name: 'M1', daysCount: 30 },
    { name: 'M2', daysCount: 32 },
    { name: 'M3', daysCount: 28 },
    { name: 'M4', daysCount: 35 },
    { name: 'M5', daysCount: 30 },
    { name: 'M6', daysCount: 33 },
    { name: 'M7', daysCount: 30 },
    { name: 'M8', daysCount: 32 },
    { name: 'M9', daysCount: 28 },
    { name: 'M10', daysCount: 35 },
  ],
  celestialBodies: [],
  seasons: [],
  epochOffset: 0,
};

describe('isGregorianLike', () => {
  it('detekuje default Gregorian', () => {
    expect(isGregorianLike(GREGORIAN_DEFAULT_CONFIG)).toBe(true);
  });

  it('odmítne fantasy config (jiný počet měsíců)', () => {
    expect(isGregorianLike(fantasyConfig)).toBe(false);
  });

  it('odmítne 12-měsíční config s jinými daysCount', () => {
    const altered: CalendarConfig = {
      ...GREGORIAN_DEFAULT_CONFIG,
      months: GREGORIAN_DEFAULT_CONFIG.months.map((m, i) =>
        i === 0 ? { ...m, daysCount: 30 } : m,
      ),
    };
    expect(isGregorianLike(altered)).toBe(false);
  });
});

describe('daysInMonth', () => {
  // N-SHG-01 (plný audit 2026-06-20) — regrese: prázdné months nesmí způsobit
  // mod(n,0)=NaN → undefined.isIntercalary TypeError (crash FantasyDatePicker).
  it('nespadne na prázdném months (degraduje na 0)', () => {
    const emptyConfig: CalendarConfig = { ...fantasyConfig, months: [] };
    expect(() => daysInMonth(0, 1, emptyConfig)).not.toThrow();
    expect(daysInMonth(0, 1, emptyConfig)).toBe(0);
  });

  it('Únor 28 pro non-leap rok', () => {
    expect(daysInMonth(1, 2023, GREGORIAN_DEFAULT_CONFIG)).toBe(28);
  });

  it('Únor 29 pro leap rok 2000', () => {
    expect(daysInMonth(1, 2000, GREGORIAN_DEFAULT_CONFIG)).toBe(29);
  });

  it('Únor 28 pro 1900 (sto-leté pravidlo)', () => {
    expect(daysInMonth(1, 1900, GREGORIAN_DEFAULT_CONFIG)).toBe(28);
  });

  it('Únor 29 pro 2400 (čtyřsto-leté pravidlo)', () => {
    expect(daysInMonth(1, 2400, GREGORIAN_DEFAULT_CONFIG)).toBe(29);
  });

  it('Leden 31', () => {
    expect(daysInMonth(0, 2025, GREGORIAN_DEFAULT_CONFIG)).toBe(31);
  });

  it('Fantasy M4 = 35 dnů', () => {
    expect(daysInMonth(3, 2025, fantasyConfig)).toBe(35);
  });
});

describe('toAbsDay/fromAbsDay round-trip', () => {
  it('Gregorian round-trip 1000 náhodných absDay', () => {
    for (let i = 0; i < 1000; i++) {
      const n = Math.floor(Math.random() * 200000) - 100000;
      const date = fromAbsDay(n, GREGORIAN_DEFAULT_CONFIG);
      expect(toAbsDay(date, GREGORIAN_DEFAULT_CONFIG)).toBe(n);
    }
  });

  it('Fantasy round-trip 1000 náhodných absDay', () => {
    for (let i = 0; i < 1000; i++) {
      const n = Math.floor(Math.random() * 200000) - 100000;
      const date = fromAbsDay(n, fantasyConfig);
      expect(toAbsDay(date, fantasyConfig)).toBe(n);
    }
  });

  it('Gregorian boundaries: (year:0, m:0, d:1) → absDay 0', () => {
    expect(toAbsDay({ year: 0, monthIndex: 0, day: 1 }, GREGORIAN_DEFAULT_CONFIG)).toBe(0);
  });

  it('Gregorian boundaries: round-trip rok 1, m 0, d 1', () => {
    const d = { year: 1, monthIndex: 0, day: 1 };
    expect(fromAbsDay(toAbsDay(d, GREGORIAN_DEFAULT_CONFIG), GREGORIAN_DEFAULT_CONFIG)).toEqual(d);
  });

  it('Gregorian boundaries: round-trip 29. 2. 2000 (leap day)', () => {
    const d = { year: 2000, monthIndex: 1, day: 29 };
    expect(fromAbsDay(toAbsDay(d, GREGORIAN_DEFAULT_CONFIG), GREGORIAN_DEFAULT_CONFIG)).toEqual(d);
  });

  it('Gregorian záporné roky round-trip', () => {
    const d = { year: -500, monthIndex: 6, day: 15 };
    expect(fromAbsDay(toAbsDay(d, GREGORIAN_DEFAULT_CONFIG), GREGORIAN_DEFAULT_CONFIG)).toEqual(d);
  });

  it('Fantasy boundaries: poslední den posledního měsíce', () => {
    const d = { year: 5, monthIndex: 9, day: 35 };
    expect(fromAbsDay(toAbsDay(d, fantasyConfig), fantasyConfig)).toEqual(d);
  });
});
