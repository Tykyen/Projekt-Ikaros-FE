import type { CalendarConfig, FantasyDate } from './types';

/**
 * 9.2e — Formátuje fantasy datum lidsky čitelně pro daný kalendář.
 *
 * Příklady (Gregorian):
 *   formatFantasyDate({year:2025, monthIndex:5, day:21}, gregorian) → "21. Června 2025"
 *   formatFantasyDate({year:2025, monthIndex:5, day:21, hour:14, minute:30}, gregorian, {includeHour:true})
 *     → "21. Června 2025, 14:30"
 *
 * Fantasy:
 *   formatFantasyDate({year:8742, monthIndex:1, day:2}, elfi) → "2. Stříbra 8742"
 */
export function formatFantasyDate(
  date: FantasyDate,
  config: CalendarConfig,
  opts: { includeHour?: boolean } = {},
): string {
  const monthName =
    config.months[date.monthIndex]?.name ?? `M${date.monthIndex + 1}`;
  let result = `${date.day}. ${monthName} ${date.year}`;
  if (opts.includeHour && date.hour !== undefined) {
    const h = String(date.hour).padStart(2, '0');
    const m = String(date.minute ?? 0).padStart(2, '0');
    result += `, ${h}:${m}`;
  }
  return result;
}

/** Stringová klíč pro mapování events per den. `YYYY-MM-DD` formát (rok může být záporný). */
export function fantasyDayKey(date: FantasyDate): string {
  const sign = date.year < 0 ? '-' : '';
  const year = Math.abs(date.year).toString().padStart(4, '0');
  const month = String(date.monthIndex + 1).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${sign}${year}-${month}-${day}`;
}

/** True pokud jsou data strukturně shodná (year/monthIndex/day). */
export function isSameFantasyDay(a: FantasyDate, b: FantasyDate): boolean {
  return (
    a.year === b.year && a.monthIndex === b.monthIndex && a.day === b.day
  );
}
