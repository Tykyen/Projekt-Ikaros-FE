import type { CalendarConfig } from '@/shared/lib/calendarEngine';

/**
 * 9.3 — strukturovaná složka datumu pro timeline event.
 * `month` 1-based (mirror BE shape), `hour` 0–23 optional.
 */
export interface FantasyDateParts {
  year: number;
  month: number;
  day: number;
  hour?: number | null;
}

/**
 * 9.3 — formátuje rok do popisku „Rok X" / „Rok X př. n. l." / „Rok 0".
 *
 * BC formátování pro PJ vize: timeline pokrývá rozsah −10 000 až +2039 a dál.
 * Záporný rok = před naším letopočtem (př. n. l.), kladný = našeho letopočtu.
 * Rok 0 v reálných kalendářích neexistuje, ale ve fantasy ho PJ může mít.
 */
export function formatYearLabel(year: number): string {
  if (year > 0) return `Rok ${year}`;
  if (year < 0) return `Rok ${Math.abs(year)} př. n. l.`;
  return 'Rok 0';
}

/**
 * 9.3 — formátuje celé fantasy datum „Rok 1453, 14. Vědurnu, 12:00".
 *
 * Bez aktivního configu fallback na raw čísla.
 */
export function formatFantasyDate(
  parts: FantasyDateParts,
  config: CalendarConfig | null,
): string {
  const yearLabel = formatYearLabel(parts.year);
  const monthName =
    config?.months[parts.month - 1]?.name ?? `měsíc ${parts.month}`;
  const time =
    parts.hour != null
      ? `, ${String(parts.hour).padStart(2, '0')}:00`
      : '';
  return `${yearLabel}, ${parts.day}. ${monthName}${time}`;
}
