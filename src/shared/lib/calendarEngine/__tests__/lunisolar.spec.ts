import { describe, expect, it } from 'vitest';
import { daysInMonth, daysInYear, fromAbsDay, toAbsDay } from '../absDay';
import type { CalendarConfig } from '../types';

/**
 * 9.3-F-II — Lunisolar (Metonic 19-letý cyklus) + intercalary měsíce.
 *
 * Test pravidla:
 *  - Intercalary měsíc v non-leap roce má `daysInMonth = 0` (skipne se).
 *  - V leap roce má svoji `daysCount`.
 *  - daysInYear iteruje per-month (intercalary respect).
 *  - Round-trip toAbsDay → fromAbsDay přes cyklus.
 *  - BC: bez `lunisolar` rule intercalary měsíc dostane 0 (nemá leap → vždy 0).
 */

const HEBREW_LEAP_POSITIONS = [3, 6, 8, 11, 14, 17, 19];

const baseHebrewLike = (
  overrides: Partial<CalendarConfig> = {},
): CalendarConfig => ({
  id: '',
  slug: 'hebrew-test',
  name: 'Hebrew test',
  hoursPerDay: 24,
  daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'],
  // 13 měsíců: 12 standardních + 1 intercalary (adar I) před adar II.
  months: [
    { name: 'nisan', daysCount: 30 },
    { name: 'ijar', daysCount: 29 },
    { name: 'sivan', daysCount: 30 },
    { name: 'tamuz', daysCount: 29 },
    { name: 'av', daysCount: 30 },
    { name: 'elul', daysCount: 29 },
    { name: 'tišri', daysCount: 30 },
    { name: 'chešvan', daysCount: 29 },
    { name: 'kislev', daysCount: 30 },
    { name: 'tevet', daysCount: 29 },
    { name: 'ševat', daysCount: 30 },
    { name: 'adar I', daysCount: 30, isIntercalary: true },
    { name: 'adar', daysCount: 29 },
  ],
  celestialBodies: [],
  seasons: [],
  lunisolar: {
    type: 'metonic-19',
    leapYearsInCycle: HEBREW_LEAP_POSITIONS,
  },
  epochOffset: 0,
  ...overrides,
});

describe('LunisolarRule — Metonic 19 (Hebrew-like)', () => {
  const config = baseHebrewLike();

  it('intercalary měsíc má 30 dní v leap roce (pozice 3)', () => {
    expect(daysInMonth(11, 3, config)).toBe(30); // adar I in year 3 (leap)
  });

  it('intercalary měsíc má 0 dní v non-leap roce (pozice 1)', () => {
    expect(daysInMonth(11, 1, config)).toBe(0);
    expect(daysInMonth(11, 2, config)).toBe(0);
    expect(daysInMonth(11, 4, config)).toBe(0);
  });

  it('standardní měsíce nedotčené leap statusem', () => {
    expect(daysInMonth(0, 3, config)).toBe(30); // nisan
    expect(daysInMonth(0, 1, config)).toBe(30);
    expect(daysInMonth(12, 3, config)).toBe(29); // adar
    expect(daysInMonth(12, 1, config)).toBe(29);
  });

  it('daysInYear: standard year = sum bez intercalary, leap year = +intercalary days', () => {
    // Standard sum: 30+29+30+29+30+29+30+29+30+29+30+0+29 = 354
    expect(daysInYear(config, 1)).toBe(354);
    // Leap: 30+29+30+29+30+29+30+29+30+29+30+30+29 = 384
    expect(daysInYear(config, 3)).toBe(384);
  });

  it('Metonic cyklus: 7 leap z 19 let na správných pozicích', () => {
    let leapCount = 0;
    for (let y = 1; y <= 19; y++) {
      if (daysInYear(config, y) === 384) leapCount++;
    }
    expect(leapCount).toBe(7);
  });

  it('roky 1-19 — správné leap pozice', () => {
    const leapYears: number[] = [];
    for (let y = 1; y <= 19; y++) {
      if (daysInYear(config, y) === 384) leapYears.push(y);
    }
    expect(leapYears).toEqual([3, 6, 8, 11, 14, 17, 19]);
  });

  it('round-trip přes intercalary měsíc', () => {
    // Date in adar I leap year (year 3, adar I, day 15)
    const date = { year: 3, monthIndex: 11, day: 15 };
    const abs = toAbsDay(date, config);
    const back = fromAbsDay(abs, config);
    expect(back).toEqual(date);
  });

  it('round-trip přes neutrální datum (mimo intercalary)', () => {
    const date = { year: 5786, monthIndex: 2, day: 9 }; // sivan 9
    const abs = toAbsDay(date, config);
    const back = fromAbsDay(abs, config);
    expect(back).toEqual(date);
  });

  it('round-trip přes záporný rok', () => {
    const date = { year: -100, monthIndex: 6, day: 1 }; // tišri 1
    const abs = toAbsDay(date, config);
    const back = fromAbsDay(abs, config);
    expect(back).toEqual(date);
  });

  it('19-letý cyklus má 7×384 + 12×354 dní = 6936', () => {
    // Suma daysInYear pro roky 1..19
    let total = 0;
    for (let y = 1; y <= 19; y++) total += daysInYear(config, y);
    expect(total).toBe(7 * 384 + 12 * 354);
    expect(total).toBe(6936);
  });
});

describe('Backward compat — config s isIntercalary ale bez lunisolar', () => {
  const config = baseHebrewLike({ lunisolar: undefined });

  it('intercalary měsíc má 0 dní v každém roce (žádný leap rule)', () => {
    expect(daysInMonth(11, 1, config)).toBe(0);
    expect(daysInMonth(11, 3, config)).toBe(0);
    expect(daysInMonth(11, 100, config)).toBe(0);
  });

  it('daysInYear stále iteruje per-month → intercalary skipnut', () => {
    expect(daysInYear(config, 1)).toBe(354); // standard sum bez intercalary
  });

  it('round-trip stále funkční (intercalary se chová jako pomocný 0 měsíc)', () => {
    const date = { year: 10, monthIndex: 5, day: 14 };
    const abs = toAbsDay(date, config);
    const back = fromAbsDay(abs, config);
    expect(back).toEqual(date);
  });
});
