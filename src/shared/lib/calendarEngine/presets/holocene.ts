import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Holocénní (HE) — Gregorian + 10000 let k letopočtu. Začátek rokem
 * vzniku zemědělství (~10000 BCE). Identická struktura jako Gregorian
 * → `isGregorianLike` detekce + Gregorian leap.
 */
export const HOLOCENE_PRESET: CalendarPreset = buildPreset({
  slug: 'holocene',
  name: 'Holocénní (HE)',
  description:
    'Gregorian + 10000 let. Letopočet od vzniku lidské civilizace. 2026 CE = 12026 HE.',
  category: 'alternativni',
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
  // Bez leapYearRule — isGregorianLike() přidá Gregorian leap.
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
  anchor: { year: 12026, monthIndex: 4, day: 25 },
});
