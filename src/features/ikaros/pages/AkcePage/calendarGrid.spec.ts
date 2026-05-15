import { describe, it, expect } from 'vitest';
import { buildMonthGrid, dayKey, isSameDay } from './calendarGrid';

describe('buildMonthGrid', () => {
  it('vrátí přesně 42 dat (6 týdnů)', () => {
    expect(buildMonthGrid(2026, 4)).toHaveLength(42);
  });

  it('první den mřížky je pondělí', () => {
    const grid = buildMonthGrid(2026, 4); // květen 2026
    expect(grid[0].getDay()).toBe(1);
  });

  it('mřížka obsahuje 1. den měsíce', () => {
    const grid = buildMonthGrid(2026, 4);
    expect(grid.some((d) => d.getMonth() === 4 && d.getDate() === 1)).toBe(
      true,
    );
  });

  it('první den měsíce padajícího na pondělí není předsazen', () => {
    // 2026-06-01 je pondělí
    const grid = buildMonthGrid(2026, 5);
    expect(grid[0].getMonth()).toBe(5);
    expect(grid[0].getDate()).toBe(1);
  });
});

describe('dayKey', () => {
  it('formátuje na YYYY-MM-DD s nulami', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('isSameDay', () => {
  it('true pro stejný den, různý čas', () => {
    expect(
      isSameDay(new Date(2026, 4, 15, 8), new Date(2026, 4, 15, 20)),
    ).toBe(true);
  });
  it('false pro různé dny', () => {
    expect(isSameDay(new Date(2026, 4, 15), new Date(2026, 4, 16))).toBe(
      false,
    );
  });
});
