import { fromAbsDay, toAbsDay } from './absDay';
import type { CalendarConfig, FantasyDate } from './types';

/**
 * 9.2-FIX2 — Pro multi-day eventy vrátí pole všech dnů mezi `start` a `end`
 * (inclusive). Pokud `end` chybí, vrátí jen `[start]`. Pokud `end < start`,
 * defaultně vrátí `[start]`.
 *
 * Limit `maxDays` (default 366) chrání proti corrupt datům — event s 1000+
 * dny by zacyklil grid render.
 */
export function expandEventDays(
  start: FantasyDate,
  end: FantasyDate | undefined,
  config: CalendarConfig,
  maxDays = 366,
): FantasyDate[] {
  if (!end) return [start];
  const startAbs = toAbsDay(start, config);
  const endAbs = toAbsDay(end, config);
  if (endAbs <= startAbs) return [start];
  const span = Math.min(endAbs - startAbs + 1, maxDays);
  const days: FantasyDate[] = [];
  for (let i = 0; i < span; i++) {
    days.push(fromAbsDay(startAbs + i, config));
  }
  return days;
}
