import { describe, it, expect } from 'vitest';
import { formatFantasyDate, formatYearLabel } from './formatFantasyDate';
import type { CalendarConfig } from '@/shared/lib/calendarEngine';

const config = {
  id: 'c1',
  slug: 'gregorian',
  name: 'Gregorian',
  hoursPerDay: 24,
  daysOfWeek: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  months: [
    { name: 'leden', daysCount: 31 },
    { name: 'únor', daysCount: 28 },
    { name: 'březen', daysCount: 31 },
    { name: 'duben', daysCount: 30 },
    { name: 'květen', daysCount: 31 },
  ],
  celestialBodies: [],
  seasons: [],
  epochOffset: 0,
} satisfies CalendarConfig;

describe('formatYearLabel', () => {
  it('AD rok > 0', () => {
    expect(formatYearLabel(2039)).toBe('Rok 2039');
    expect(formatYearLabel(1)).toBe('Rok 1');
  });

  it('BC rok < 0 přidá „př. n. l."', () => {
    expect(formatYearLabel(-487)).toBe('Rok 487 př. n. l.');
    expect(formatYearLabel(-10000)).toBe('Rok 10000 př. n. l.');
  });

  it('rok 0', () => {
    expect(formatYearLabel(0)).toBe('Rok 0');
  });
});

describe('formatFantasyDate', () => {
  it('AD datum s hodinou', () => {
    expect(
      formatFantasyDate({ year: 2026, month: 5, day: 25, hour: 14 }, config),
    ).toBe('Rok 2026, 25. květen, 14:00');
  });

  it('BC datum bez hodiny', () => {
    expect(
      formatFantasyDate({ year: -753, month: 4, day: 21, hour: null }, config),
    ).toBe('Rok 753 př. n. l., 21. duben');
  });

  it('hour=0 zobrazí 00:00 (ne skryje)', () => {
    expect(
      formatFantasyDate({ year: 1, month: 1, day: 1, hour: 0 }, config),
    ).toBe('Rok 1, 1. leden, 00:00');
  });

  it('hour=undefined skryje čas', () => {
    expect(formatFantasyDate({ year: 1, month: 1, day: 1 }, config)).toBe(
      'Rok 1, 1. leden',
    );
  });

  it('bez configu: fallback raw „měsíc N"', () => {
    expect(
      formatFantasyDate({ year: 1453, month: 5, day: 14, hour: 12 }, null),
    ).toBe('Rok 1453, 14. měsíc 5, 12:00');
  });

  it('month mimo rozsah configu: fallback raw', () => {
    expect(
      formatFantasyDate({ year: 1453, month: 13, day: 1 }, config),
    ).toBe('Rok 1453, 1. měsíc 13');
  });
});
