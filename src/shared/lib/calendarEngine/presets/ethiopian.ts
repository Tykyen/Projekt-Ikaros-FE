import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Etiopský — solární kalendář se **13 měsíci** (12 × 30 dní + pagume 5/6).
 * Letopočet posunut ~7–8 let za Gregorianem. Nový rok 11. září gregoriánsky.
 * Pagume +1 v každém 4. roce.
 */
export const ETHIOPIAN_PRESET: CalendarPreset = buildPreset({
  slug: 'ethiopian',
  name: 'Etiopský',
  description:
    '13 měsíců (12×30 + pagume 5/6). Letopočet posun ~7–8 let za Gregorianem.',
  category: 'soucasne-civilni',
  hoursPerDay: 24,
  daysOfWeek: [
    'segno',     // pondělí
    'maksegno',  // úterý
    'erob',      // středa
    'hamus',     // čtvrtek
    'arb',       // pátek
    'kidame',    // sobota
    'ehud',      // neděle
  ],
  months: [
    { name: 'meskerem',  daysCount: 30 },
    { name: 'tikimt',    daysCount: 30 },
    { name: 'hidar',     daysCount: 30 },
    { name: 'tahsas',    daysCount: 30 },
    { name: 'tir',       daysCount: 30 },
    { name: 'jakatit',   daysCount: 30 },
    { name: 'megabit',   daysCount: 30 },
    { name: 'miazia',    daysCount: 30 },
    { name: 'ginbot',    daysCount: 30 },
    { name: 'sene',      daysCount: 30 },
    { name: 'hamle',     daysCount: 30 },
    { name: 'nehase',    daysCount: 30 },
    { name: 'pagume',    daysCount: 5 }, // +1 v každém 4. roce (every-4)
  ],
  leapYearRule: { type: 'every-4', leapMonthIndex: 12 },
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
    { id: 'bega',   name: 'Bega (Suché)',   startMonthIndex: 2, startDay: 1, color: '#c47a3b', icon: '☀️' },
    { id: 'belg',   name: 'Belg (Krátké deště)', startMonthIndex: 6, startDay: 1, color: '#7cb342', icon: '🌧️' },
    { id: 'kiremt', name: 'Kiremt (Velké deště)', startMonthIndex: 9, startDay: 1, color: '#0288d1', icon: '⛈️' },
  ],
  anchor: { year: 2018, monthIndex: 8, day: 17 }, // 17. ginbot 2018
});
