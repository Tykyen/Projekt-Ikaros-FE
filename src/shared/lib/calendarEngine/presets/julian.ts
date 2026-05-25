import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Juliánský — předchůdce Gregoriánu. Každý 4. rok přestupný bez gregoriánských
 * výjimek pro století. V období 1900–2099 je vůči Gregorianu posunutý o 13 dní.
 */
export const JULIAN_PRESET: CalendarPreset = buildPreset({
  slug: 'julian',
  name: 'Juliánský',
  description:
    'Solární předchůdce gregoriánského kalendáře (každý 4. rok přestupný). Používá pravoslavná církev.',
  category: 'soucasne-civilni',
  hoursPerDay: 24,
  daysOfWeek: ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'],
  months: [
    { name: 'leden', daysCount: 31 },
    { name: 'únor', daysCount: 28 },
    { name: 'březen', daysCount: 31 },
    { name: 'duben', daysCount: 30 },
    { name: 'květen', daysCount: 31 },
    { name: 'červen', daysCount: 30 },
    { name: 'červenec', daysCount: 31 },
    { name: 'srpen', daysCount: 31 },
    { name: 'září', daysCount: 30 },
    { name: 'říjen', daysCount: 31 },
    { name: 'listopad', daysCount: 30 },
    { name: 'prosinec', daysCount: 31 },
  ],
  leapYearRule: { type: 'every-4', leapMonthIndex: 1 }, // únor +1 každý 4. rok
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
  anchor: { year: 2026, monthIndex: 4, day: 12 },
});
