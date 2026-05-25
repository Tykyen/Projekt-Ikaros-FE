import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Buddhistický thajský civilní — identická struktura jako Gregorian
 * (12 měsíců, 7 dní v týdnu, leap 4/100/400), jen letopočet posunut +543 let.
 * Detekováno engine jako `isGregorianLike` → automaticky správné leap years.
 */
export const BUDDHIST_THAI_PRESET: CalendarPreset = buildPreset({
  slug: 'buddhist-thai',
  name: 'Buddhistický (thajský)',
  description:
    'Thajský civilní = Gregorian + buddhistický letopočet (+543 let). 2026 CE = 2569 BE.',
  category: 'soucasne-nabozenske',
  hoursPerDay: 24,
  daysOfWeek: [
    'wan chan',     // pondělí
    'wan angkhan',  // úterý
    'wan phut',     // středa
    'wan pharuhat', // čtvrtek
    'wan suk',      // pátek
    'wan sao',      // sobota
    'wan athit',    // neděle
  ],
  months: [
    { name: 'makarakhom',      daysCount: 31 },
    { name: 'kumphaphan',      daysCount: 28 },
    { name: 'minakhom',        daysCount: 31 },
    { name: 'mesayon',         daysCount: 30 },
    { name: 'phruetsaphakhom', daysCount: 31 },
    { name: 'mithunayon',      daysCount: 30 },
    { name: 'karakadakhom',    daysCount: 31 },
    { name: 'singhakhom',      daysCount: 31 },
    { name: 'kanyayon',        daysCount: 30 },
    { name: 'tulakhom',        daysCount: 31 },
    { name: 'phruetsachikayon',daysCount: 30 },
    { name: 'thanwakhom',      daysCount: 31 },
  ],
  // Bez leapYearRule — isGregorianLike() detekuje shape a applikuje Gregorian leap.
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
    { id: 'hot',   name: 'Horké období', startMonthIndex: 1, startDay: 15, color: '#e65100', icon: '☀️' },
    { id: 'rain',  name: 'Období dešťů', startMonthIndex: 4, startDay: 15, color: '#0288d1', icon: '🌧️' },
    { id: 'cool',  name: 'Chladné období', startMonthIndex: 9, startDay: 15, color: '#42a5f5', icon: '🍃' },
  ],
  anchor: { year: 2569, monthIndex: 4, day: 25 },
});
