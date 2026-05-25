import { describe, it, expect } from 'vitest';
import { getActiveCalendarConfig } from './getActiveCalendarConfig';
import type { CalendarConfig } from '@/shared/lib/calendarEngine';

const mk = (slug: string): CalendarConfig => ({
  id: slug,
  slug,
  name: slug,
  hoursPerDay: 24,
  daysOfWeek: [],
  months: [],
  celestialBodies: [],
  seasons: [],
  epochOffset: 0,
});

describe('getActiveCalendarConfig', () => {
  const A = mk('gregorian');
  const B = mk('elf-cal');
  const C = mk('dwarf-cal');

  it('1) timelineSlug match → vrátí ten config', () => {
    expect(getActiveCalendarConfig([A, B, C], 'elf-cal', 'gregorian')).toBe(B);
  });

  it('2) timelineSlug null → fallback world default', () => {
    expect(getActiveCalendarConfig([A, B, C], null, 'dwarf-cal')).toBe(C);
  });

  it('2) timelineSlug undefined → fallback world default', () => {
    expect(getActiveCalendarConfig([A, B], undefined, 'gregorian')).toBe(A);
  });

  it('2) timelineSlug neexistující → fallback world default', () => {
    expect(getActiveCalendarConfig([A, B], 'deleted', 'elf-cal')).toBe(B);
  });

  it('3) timelineSlug null + world default chybí → fallback configs[0]', () => {
    expect(getActiveCalendarConfig([A, B], null, 'phantom-cal')).toBe(A);
  });

  it('3) timelineSlug null + worldDefault undefined → fallback configs[0]', () => {
    expect(getActiveCalendarConfig([A, B], null)).toBe(A);
  });

  it('4) configs undefined → null', () => {
    expect(getActiveCalendarConfig(undefined, 'whatever', 'gregorian')).toBeNull();
  });

  it('4) configs prázdné → null', () => {
    expect(getActiveCalendarConfig([], 'whatever', 'gregorian')).toBeNull();
  });
});
