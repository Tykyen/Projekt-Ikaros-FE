import { describe, expect, it } from 'vitest';
import { toAbsDay, fromAbsDay, daysInMonth, daysInYear } from '../absDay';
import type { CalendarConfig } from '../types';

/**
 * 9.3-F-I — Leap year rules: every-4 / solar-hijri-33 / islamic-30.
 * Backward-compat: bez leapYearRule fast-path zachován (testováno v absDay.spec).
 */

const baseConfig = (
  overrides: Partial<CalendarConfig> = {},
): CalendarConfig => ({
  id: '',
  slug: 'test',
  name: 'Test',
  hoursPerDay: 24,
  daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'],
  months: Array.from({ length: 12 }, (_, i) => ({
    name: `M${i + 1}`,
    daysCount: 30,
  })),
  celestialBodies: [],
  seasons: [],
  epochOffset: 0,
  ...overrides,
});

describe('LeapYearRule — every-4 (Julian-like)', () => {
  const config = baseConfig({
    leapYearRule: { type: 'every-4', leapMonthIndex: 1 },
  });

  it('rok dělitelný 4 = přestupný, leapMonthIndex +1 den', () => {
    expect(daysInMonth(1, 4, config)).toBe(31); // leap
    expect(daysInMonth(1, 8, config)).toBe(31);
    expect(daysInMonth(1, 100, config)).toBe(31); // bez gregorian výjimky
  });

  it('rok nedělitelný 4 = normální', () => {
    expect(daysInMonth(1, 5, config)).toBe(30);
    expect(daysInMonth(1, 7, config)).toBe(30);
    expect(daysInMonth(1, 99, config)).toBe(30);
  });

  it('jiné měsíce nedotčené', () => {
    expect(daysInMonth(0, 4, config)).toBe(30); // M1 leap rok
    expect(daysInMonth(2, 4, config)).toBe(30); // M3 leap rok
  });

  it('daysInYear: 360 normální, 361 přestupný', () => {
    expect(daysInYear(config, 5)).toBe(360);
    expect(daysInYear(config, 4)).toBe(361);
  });

  it('toAbsDay → fromAbsDay round-trip přes leap year', () => {
    const date = { year: 100, monthIndex: 5, day: 15 };
    const abs = toAbsDay(date, config);
    const back = fromAbsDay(abs, config);
    expect(back).toEqual(date);
  });

  it('toAbsDay accumulates leap days correctly', () => {
    // 0 leap years before year 0 (year 0 sám není před)
    // Year 4 je leap → +1 den za rok 4 (mezi 0..3 byl rok 0 leap, takže +1)
    // Roky 0,1,2,3 mají: year 0=leap (+1), 1=normal, 2=normal, 3=normal → 4*360+1 = 1441
    const startOf4 = toAbsDay({ year: 4, monthIndex: 0, day: 1 }, config);
    expect(startOf4).toBe(1441);
  });
});

describe('LeapYearRule — solar-hijri-33 (Perský)', () => {
  const config = baseConfig({
    leapYearRule: { type: 'solar-hijri-33', leapMonthIndex: 11 },
  });

  it('cyklus 33: pozice {1, 5, 9, 13, 17, 22, 26, 30} přestupné', () => {
    // 8 leap years v 33 cyklu
    let count = 0;
    for (let y = 1; y <= 33; y++) {
      if (daysInMonth(11, y, config) === 31) count++;
    }
    expect(count).toBe(8);
  });

  it('rok 1, 5, 9 přestupné (M12 = 31 dní)', () => {
    expect(daysInMonth(11, 1, config)).toBe(31);
    expect(daysInMonth(11, 5, config)).toBe(31);
    expect(daysInMonth(11, 9, config)).toBe(31);
  });

  it('rok 2, 3, 4 ne (M12 = 30 dní)', () => {
    expect(daysInMonth(11, 2, config)).toBe(30);
    expect(daysInMonth(11, 3, config)).toBe(30);
    expect(daysInMonth(11, 4, config)).toBe(30);
  });

  it('round-trip přes 33-letý cyklus', () => {
    const date = { year: 1405, monthIndex: 11, day: 30 };
    const abs = toAbsDay(date, config);
    const back = fromAbsDay(abs, config);
    expect(back).toEqual(date);
  });
});

describe('LeapYearRule — islamic-30 (Hidžra tabular)', () => {
  const config = baseConfig({
    leapYearRule: { type: 'islamic-30', leapMonthIndex: 11 },
  });

  it('cyklus 30: 11 přestupných roků', () => {
    let count = 0;
    for (let y = 1; y <= 30; y++) {
      if (daysInMonth(11, y, config) === 31) count++;
    }
    expect(count).toBe(11);
  });

  it('rok 2, 5, 7 přestupné', () => {
    expect(daysInMonth(11, 2, config)).toBe(31);
    expect(daysInMonth(11, 5, config)).toBe(31);
    expect(daysInMonth(11, 7, config)).toBe(31);
  });

  it('round-trip', () => {
    const date = { year: 1447, monthIndex: 5, day: 10 };
    const abs = toAbsDay(date, config);
    const back = fromAbsDay(abs, config);
    expect(back).toEqual(date);
  });
});

describe('Backward compat — config bez leapYearRule', () => {
  const config = baseConfig(); // žádný leapYearRule

  it('daysInMonth konstantní napříč roky', () => {
    expect(daysInMonth(0, 100, config)).toBe(30);
    expect(daysInMonth(0, 5000, config)).toBe(30);
  });

  it('daysInYear konstantní', () => {
    expect(daysInYear(config, 100)).toBe(360);
    expect(daysInYear(config, 5000)).toBe(360);
  });

  it('toAbsDay → fromAbsDay round-trip', () => {
    const date = { year: 1000, monthIndex: 5, day: 15 };
    expect(fromAbsDay(toAbsDay(date, config), config)).toEqual(date);
  });
});
