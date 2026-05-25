import { daysInMonth, fromAbsDay, toAbsDay } from './absDay';
import type { CalendarConfig, GridCell } from './types';

/**
 * 9.2a — Generování měsíční mřížky pro libovolný kalendář.
 *
 * Vrací buňky pokrývající celé „okno" měsíce: prev-month overflow
 * + current + next-month padding. Délka je vždy násobek
 * `config.daysOfWeek.length`, aby grid byl pravidelný.
 *
 * `weekdayIndex = mod(absDay, weekLen)` — sloupec v mřížce (0 = první den
 * podle config.daysOfWeek).
 */

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

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
