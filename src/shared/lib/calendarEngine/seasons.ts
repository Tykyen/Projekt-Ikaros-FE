import { daysInMonth } from './absDay';
import type { CalendarConfig, FantasyDate, Season } from './types';

/**
 * 9.2a — Určení aktivní sezóny pro daný den.
 *
 * Sezóny jsou definované **počátkem** (`startMonthIndex` + `startDay`).
 * Aktivní = poslední sezóna, jejíž start už proběhl v aktuálním roce.
 *
 * Wraparound: pokud nejdřívější sezóna začíná až po `currentDayOfYear`,
 * vrátí se poslední sezóna roku (Zima přechází přes Silvestra).
 */

function dayOfYear(date: FantasyDate, config: CalendarConfig): number {
  let doy = date.day;
  for (let i = 0; i < date.monthIndex; i++) {
    doy += daysInMonth(i, date.year, config);
  }
  return doy;
}

function seasonStartDayOfYear(
  season: Season,
  year: number,
  config: CalendarConfig,
): number {
  return dayOfYear(
    { year, monthIndex: season.startMonthIndex, day: season.startDay },
    config,
  );
}

export function getSeasonForDay(
  date: FantasyDate,
  config: CalendarConfig,
): Season | null {
  if (config.seasons.length === 0) return null;
  const currentDoy = dayOfYear(date, config);
  const sorted = [...config.seasons]
    .map((s) => ({ s, startDoy: seasonStartDayOfYear(s, date.year, config) }))
    .sort((a, b) => a.startDoy - b.startDoy);
  let active: Season = sorted[sorted.length - 1].s;
  for (const { s, startDoy } of sorted) {
    if (startDoy <= currentDoy) active = s;
    else break;
  }
  return active;
}
