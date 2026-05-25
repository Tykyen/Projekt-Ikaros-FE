import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Perský / Solar Hidžra — vysoce přesný solární kalendář v Íránu a Afghánistánu.
 * Rok začíná svátkem Nourúz (jarní rovnodennost). 33-letý leap cyklus
 * (po reformě Omara Khayyáma ~1079 CE).
 */
export const SOLAR_HIJRI_PRESET: CalendarPreset = buildPreset({
  slug: 'solar-hijri',
  name: 'Perský / Solar Hidžra',
  description:
    'Vysoce přesný solární kalendář (Írán, Afghánistán). Rok začíná Nourúzem.',
  category: 'soucasne-civilni',
  hoursPerDay: 24,
  daysOfWeek: [
    'došanbe',     // pondělí
    'sešanbe',     // úterý
    'čaháršanbe',  // středa
    'pandžšanbe',  // čtvrtek
    'džome',       // pátek (sváteční)
    'šanbe',       // sobota
    'yekšanbe',    // neděle
  ],
  months: [
    { name: 'farvardín',  daysCount: 31 },
    { name: 'ordíbehešt', daysCount: 31 },
    { name: 'chordád',    daysCount: 31 },
    { name: 'tír',        daysCount: 31 },
    { name: 'mordád',     daysCount: 31 },
    { name: 'šahrívar',   daysCount: 31 },
    { name: 'mehr',       daysCount: 30 },
    { name: 'ábán',       daysCount: 30 },
    { name: 'ázar',       daysCount: 30 },
    { name: 'dej',        daysCount: 30 },
    { name: 'bahman',     daysCount: 30 },
    { name: 'esfand',     daysCount: 29 }, // +1 v přestupném roce
  ],
  leapYearRule: { type: 'solar-hijri-33', leapMonthIndex: 11 },
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
    { id: 'bahar',   name: 'Jaro',   startMonthIndex: 0, startDay: 1, color: '#7cb342', icon: '🌸' },
    { id: 'tabestan', name: 'Léto',  startMonthIndex: 3, startDay: 1, color: '#fbc02d', icon: '☀️' },
    { id: 'paeez',   name: 'Podzim', startMonthIndex: 6, startDay: 1, color: '#e65100', icon: '🍂' },
    { id: 'zemestan', name: 'Zima', startMonthIndex: 9, startDay: 1, color: '#42a5f5', icon: '❄️' },
  ],
  anchor: { year: 1405, monthIndex: 2, day: 4 }, // 4. chordád 1405 SH
});
