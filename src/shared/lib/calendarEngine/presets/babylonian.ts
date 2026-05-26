import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Babylonský — lunisolární kalendář starověké Mezopotámie. Měsíce začínaly
 * pozorováním srpku Měsíce. Metonic 19-letý cyklus (pozdější forma).
 * V přestupném roce se vkládal druhý addaru (addaru II).
 *
 * Letopočet: PJ řekl „historicky podle panovníka", pro engine použijeme
 * **Seleukovskou éru** (Seleucid = 312/311 BCE), v níž 2026 CE = ~2337 SE.
 * PJ může v editoru přepnout na regnal years.
 */
export const BABYLONIAN_PRESET: CalendarPreset = buildPreset({
  slug: 'babylonian',
  name: 'Babylonský',
  description:
    'Lunisolární kalendář starověké Mezopotámie. Měsíce 30/29 střídavě, druhý addaru v přestupném roce. Seleukovská éra.',
  category: 'historicky',
  hoursPerDay: 24,
  daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'], // sedmidenní rytmus historicky spojován
  // 12 standardních + addaru II (intercalary).
  months: [
    { name: 'nisannu',    daysCount: 30 },
    { name: 'ajjaru',     daysCount: 29 },
    { name: 'simanu',     daysCount: 30 },
    { name: 'du`uzu',     daysCount: 29 },
    { name: 'abu',        daysCount: 30 },
    { name: 'ululu',      daysCount: 29 },
    { name: 'tašrítu',    daysCount: 30 },
    { name: 'arahsamnu',  daysCount: 29 },
    { name: 'kislimu',    daysCount: 30 },
    { name: 'tebétu',     daysCount: 29 },
    { name: 'šabátu',     daysCount: 30 },
    { name: 'addaru',     daysCount: 29 },
    { name: 'addaru II',  daysCount: 30, isIntercalary: true },
  ],
  lunisolar: {
    type: 'metonic-19',
    leapYearsInCycle: [3, 6, 8, 11, 14, 17, 19],
  },
  celestialBodies: [
    {
      id: 'moon',
      name: 'Měsíc',
      orbitalPeriodDays: 29.5306,
      color: '#c0c8d0',
      epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
    },
  ],
  seasons: [],
  anchor: { year: 2337, monthIndex: 2, day: 9 }, // 9. simanu (Seleucid 2337)
  anchorToleranceDays: 2,
  note:
    'Letopočet = Seleukovská éra (Seleucid 312/311 BCE). PJ může v editoru přepnout na regnal years (rok panovníka). Měsíce historicky začínaly pozorováním srpku — engine používá Metonic aproximaci.',
});
