import { describe, expect, it } from 'vitest';
import { generateMonthGrid } from '../monthGrid';
import { GREGORIAN_DEFAULT_CONFIG } from '../gregorianDefault';
import type { CalendarConfig } from '../types';

const fantasy5dayWeek: CalendarConfig = {
  id: '',
  slug: 'f5',
  name: '5-denní týden',
  hoursPerDay: 24,
  daysOfWeek: ['A', 'B', 'C', 'D', 'E'],
  months: Array.from({ length: 10 }, (_, i) => ({
    name: `M${i + 1}`,
    daysCount: 30,
  })),
  celestialBodies: [],
  seasons: [],
  epochOffset: 0,
};

describe('generateMonthGrid — Gregorian', () => {
  it('Leden 2025 — délka je násobek 7', () => {
    const grid = generateMonthGrid(2025, 0, GREGORIAN_DEFAULT_CONFIG);
    expect(grid.length % 7).toBe(0);
  });

  it('Leden 2025 — délka 28..42', () => {
    const grid = generateMonthGrid(2025, 0, GREGORIAN_DEFAULT_CONFIG);
    expect(grid.length).toBeGreaterThanOrEqual(28);
    expect(grid.length).toBeLessThanOrEqual(42);
  });

  it('První buňka má weekdayIndex 0', () => {
    const grid = generateMonthGrid(2025, 0, GREGORIAN_DEFAULT_CONFIG);
    expect(grid[0].weekdayIndex).toBe(0);
  });

  it('inCurrentMonth označuje právě 31 buněk pro Leden 2025', () => {
    const grid = generateMonthGrid(2025, 0, GREGORIAN_DEFAULT_CONFIG);
    const inMonth = grid.filter((c) => c.inCurrentMonth);
    expect(inMonth).toHaveLength(31);
    expect(inMonth[0].date).toEqual(
      expect.objectContaining({ year: 2025, monthIndex: 0, day: 1 }),
    );
    expect(inMonth[30].date).toEqual(
      expect.objectContaining({ year: 2025, monthIndex: 0, day: 31 }),
    );
  });

  it('Únor 2000 (leap year) má 29 in-month buněk', () => {
    const grid = generateMonthGrid(2000, 1, GREGORIAN_DEFAULT_CONFIG);
    expect(grid.filter((c) => c.inCurrentMonth)).toHaveLength(29);
  });

  it('Únor 2023 (non-leap) má 28 in-month buněk', () => {
    const grid = generateMonthGrid(2023, 1, GREGORIAN_DEFAULT_CONFIG);
    expect(grid.filter((c) => c.inCurrentMonth)).toHaveLength(28);
  });

  it('Konsekutivní absDay napříč buňkami', () => {
    const grid = generateMonthGrid(2025, 5, GREGORIAN_DEFAULT_CONFIG);
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i].absDay).toBe(grid[i - 1].absDay + 1);
    }
  });
});

describe('generateMonthGrid — fantasy 5-denní týden', () => {
  it('Délka je násobek 5', () => {
    const grid = generateMonthGrid(100, 2, fantasy5dayWeek);
    expect(grid.length % 5).toBe(0);
  });

  it('weekdayIndex range 0..4', () => {
    const grid = generateMonthGrid(100, 2, fantasy5dayWeek);
    for (const cell of grid) {
      expect(cell.weekdayIndex).toBeGreaterThanOrEqual(0);
      expect(cell.weekdayIndex).toBeLessThanOrEqual(4);
    }
  });

  it('30 in-month buněk pro 30denní měsíc', () => {
    const grid = generateMonthGrid(100, 2, fantasy5dayWeek);
    expect(grid.filter((c) => c.inCurrentMonth)).toHaveLength(30);
  });
});
