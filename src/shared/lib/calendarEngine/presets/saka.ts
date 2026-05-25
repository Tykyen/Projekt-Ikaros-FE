import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Indický národní / Saka — oficiální kalendář indické vlády.
 * Rok začíná měsícem čaitra (~22. března gregoriánsky).
 *
 * ⚠️ Přesný Saka je Gregorian-aligned (čaitra má 30/31 dní podle Gregorian leap).
 * F-I implementace = 365 dní pevně bez leap rule → drift ±1 den/4 roky.
 * Pro přesnost čekat na F-II (gregorian-aligned leap rule).
 */
export const SAKA_PRESET: CalendarPreset = buildPreset({
  slug: 'saka',
  name: 'Indický národní (Saka)',
  description:
    'Oficiální kalendář indické vlády. Rok začíná měsícem čaitra (~22. března).',
  category: 'soucasne-civilni',
  hoursPerDay: 24,
  daysOfWeek: [
    'somavára',     // pondělí
    'mangalavára',  // úterý
    'budhavára',    // středa
    'brihaspativára', // čtvrtek
    'šukravára',    // pátek
    'šanivára',     // sobota
    'ravivára',     // neděle
  ],
  months: [
    { name: 'čaitra',     daysCount: 30 }, // 31 v Gregorian leap (F-II)
    { name: 'vaišákha',   daysCount: 31 },
    { name: 'džjéštha',   daysCount: 31 },
    { name: 'ášádha',     daysCount: 31 },
    { name: 'šrávana',    daysCount: 31 },
    { name: 'bhádra',     daysCount: 31 },
    { name: 'ášvin',      daysCount: 30 },
    { name: 'kártika',    daysCount: 30 },
    { name: 'agrahájana', daysCount: 30 },
    { name: 'pauša',      daysCount: 30 },
    { name: 'mágha',      daysCount: 30 },
    { name: 'phálguna',   daysCount: 30 },
  ],
  // Bez leapYearRule: pevně 365 dní/rok. F-II přidá Gregorian-aligned variant.
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
    { id: 'jaro',   name: 'Vasanta (Jaro)', startMonthIndex: 0, startDay: 1, color: '#7cb342', icon: '🌸' },
    { id: 'leto',   name: 'Gríšma (Léto)',  startMonthIndex: 3, startDay: 1, color: '#fbc02d', icon: '☀️' },
    { id: 'monsoon', name: 'Varša (Monzun)', startMonthIndex: 5, startDay: 1, color: '#0288d1', icon: '🌧️' },
    { id: 'podzim', name: 'Šarad (Podzim)', startMonthIndex: 7, startDay: 1, color: '#e65100', icon: '🍂' },
    { id: 'zima',   name: 'Šišira (Zima)',  startMonthIndex: 10, startDay: 1, color: '#42a5f5', icon: '❄️' },
  ],
  anchor: { year: 1948, monthIndex: 2, day: 4 },
  note:
    'Přesný Saka je Gregorian-aligned (čaitra 30/31). F-I používá 365 dní pevně → drift ±1 den/4 roky od anchoru.',
});
