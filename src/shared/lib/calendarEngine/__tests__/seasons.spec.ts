import { describe, expect, it } from 'vitest';
import { getSeasonForDay } from '../seasons';
import { GREGORIAN_DEFAULT_CONFIG } from '../gregorianDefault';
import type { CalendarConfig } from '../types';

const noSeasons: CalendarConfig = {
  ...GREGORIAN_DEFAULT_CONFIG,
  seasons: [],
};

describe('getSeasonForDay — Gregorian default (4 sezóny)', () => {
  it('21. 3. 2025 = Jaro', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 2, day: 21 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Jaro');
  });

  it('20. 3. 2025 = Zima (jaro ještě nezačalo)', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 2, day: 20 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Zima');
  });

  it('21. 6. 2025 = Léto', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 5, day: 21 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Léto');
  });

  it('23. 9. 2025 = Podzim', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 8, day: 23 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Podzim');
  });

  it('21. 12. 2025 = Zima', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 11, day: 21 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Zima');
  });

  it('31. 12. 2025 = Zima', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 11, day: 31 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Zima');
  });

  it('1. 1. 2026 = Zima (wraparound)', () => {
    expect(
      getSeasonForDay({ year: 2026, monthIndex: 0, day: 1 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Zima');
  });

  it('15. 7. 2025 = Léto (uprostřed)', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 6, day: 15 }, GREGORIAN_DEFAULT_CONFIG)
        ?.name,
    ).toBe('Léto');
  });
});

describe('getSeasonForDay — prázdné seasons', () => {
  it('Vrátí null', () => {
    expect(getSeasonForDay({ year: 2025, monthIndex: 5, day: 1 }, noSeasons)).toBeNull();
  });
});

describe('getSeasonForDay — fantasy s 2 sezónami (Sucho / Mokro)', () => {
  const fantasyTwoSeasons: CalendarConfig = {
    ...GREGORIAN_DEFAULT_CONFIG,
    seasons: [
      { id: 'sucho', name: 'Sucho', startMonthIndex: 3, startDay: 1, color: '#ff0' },
      { id: 'mokro', name: 'Mokro', startMonthIndex: 9, startDay: 1, color: '#00f' },
    ],
  };

  it('1. 4. = Sucho', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 3, day: 1 }, fantasyTwoSeasons)?.name,
    ).toBe('Sucho');
  });

  it('1. 10. = Mokro', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 9, day: 1 }, fantasyTwoSeasons)?.name,
    ).toBe('Mokro');
  });

  it('1. 1. = Mokro (wraparound)', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 0, day: 1 }, fantasyTwoSeasons)?.name,
    ).toBe('Mokro');
  });

  it('15. 8. = Sucho', () => {
    expect(
      getSeasonForDay({ year: 2025, monthIndex: 7, day: 15 }, fantasyTwoSeasons)?.name,
    ).toBe('Sucho');
  });
});
