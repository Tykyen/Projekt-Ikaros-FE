import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Gregoriánský — nejpoužívanější občanský kalendář.
 * Detekován engine jako `isGregorianLike` → použije Gregorian leap (4/100/400).
 */
export const GREGORIAN_PRESET: CalendarPreset = buildPreset({
  slug: 'gregorian',
  name: 'Gregoriánský',
  description: 'Dnes celosvětově nejpoužívanější občanský kalendář.',
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
  anchor: { year: 2026, monthIndex: 4, day: 25 },
});
