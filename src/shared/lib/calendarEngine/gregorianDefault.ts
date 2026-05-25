import type { CalendarConfig } from './types';

/**
 * 9.2a — Gregoriánský default config + epoch konstanta pro reálný Měsíc.
 *
 * Auto-seed při vytvoření nového světa (řešeno v 9.2b). PJ může config
 * smazat / přejmenovat / přidat fantasy varianty.
 */

/**
 * Astronomický nov 6. ledna 2000, 00:00 UTC. Hodnota = výsledek
 * `toAbsDay({ year: 2000, monthIndex: 0, day: 6 }, GREGORIAN_DEFAULT_CONFIG)`.
 *
 * Validuje se v `gregorianDefault.spec.ts` výpočtem (ne magic číslem).
 * Pokud hodnota nesedí, oprav podle hodnoty z testu.
 */
export const MOON_EPOCH_REFERENCE_ABSDAY = 730490;

export const GREGORIAN_DEFAULT_CONFIG: CalendarConfig = {
  id: '',
  slug: 'gregorian',
  name: 'Gregoriánský kalendář',
  hoursPerDay: 24,
  daysOfWeek: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  months: [
    { name: 'Leden', daysCount: 31 },
    { name: 'Únor', daysCount: 28 },
    { name: 'Březen', daysCount: 31 },
    { name: 'Duben', daysCount: 30 },
    { name: 'Květen', daysCount: 31 },
    { name: 'Červen', daysCount: 30 },
    { name: 'Červenec', daysCount: 31 },
    { name: 'Srpen', daysCount: 31 },
    { name: 'Září', daysCount: 30 },
    { name: 'Říjen', daysCount: 31 },
    { name: 'Listopad', daysCount: 30 },
    { name: 'Prosinec', daysCount: 31 },
  ],
  celestialBodies: [
    {
      id: 'moon',
      name: 'Měsíc',
      orbitalPeriodDays: 29.5306,
      color: '#c0c8d0',
      epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
    },
  ],
  seasons: [
    { id: 'jaro', name: 'Jaro', startMonthIndex: 2, startDay: 21, color: '#7cb342', icon: '🌸' },
    { id: 'leto', name: 'Léto', startMonthIndex: 5, startDay: 21, color: '#fbc02d', icon: '☀️' },
    { id: 'podzim', name: 'Podzim', startMonthIndex: 8, startDay: 23, color: '#e65100', icon: '🍂' },
    { id: 'zima', name: 'Zima', startMonthIndex: 11, startDay: 21, color: '#42a5f5', icon: '❄️' },
  ],
  epochOffset: 0,
};
