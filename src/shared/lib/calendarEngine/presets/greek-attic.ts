import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Řecký / Attický — lunisolární kalendář starověkých Athén. Rok začínal
 * v létě po letním slunovratu (hekatombaión). 12 měsíců + intercalary
 * druhý poseideón po poseideónu v přestupném roce. Metonic 19-letý cyklus.
 *
 * Letopočet: athénský rok 2025/2026 dle datasetu PJ. Engine používá
 * jednoduché rok = aktuální Gregorian (athénský rok startuje v létě,
 * takže přibližně koresponduje).
 */
export const GREEK_ATTIC_PRESET: CalendarPreset = buildPreset({
  slug: 'greek-attic',
  name: 'Řecký (Attický)',
  description:
    'Lunisolární kalendář starověkých Athén. 12 měsíců + druhý poseideón v přestupném roce. Rok začíná po letním slunovratu.',
  category: 'historicky',
  hoursPerDay: 24,
  daysOfWeek: ['1', '2', '3', '4', '5', '6', '7'], // dny dle fáze měsíce, 3 desítky
  // 12 + 1 intercalary (poseideón II) po poseideónu (index 5).
  // Stabilní index: intercalary umístěn na index 6 (mezi poseideón a gamélión).
  months: [
    { name: 'hekatombaión', daysCount: 30 },
    { name: 'metageitnión', daysCount: 29 },
    { name: 'boédromión',   daysCount: 30 },
    { name: 'pyanepsión',   daysCount: 29 },
    { name: 'maimakterión', daysCount: 30 },
    { name: 'poseideón',    daysCount: 29 },
    { name: 'poseideón II', daysCount: 30, isIntercalary: true },
    { name: 'gamélión',     daysCount: 30 },
    { name: 'anthestérión', daysCount: 29 },
    { name: 'elafébolión',  daysCount: 30 },
    { name: 'múnichión',    daysCount: 29 },
    { name: 'thargélión',   daysCount: 30 },
    { name: 'skiroforión',  daysCount: 29 },
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
  anchor: { year: 2026, monthIndex: 11, day: 10 }, // ~10. thargélión 2026
  anchorToleranceDays: 3,
  note:
    'Athénský rok historicky datován dle archonta, ne číslem. Engine používá Gregorian rok jako přibližnou aproximaci (rok začíná v létě). Datum se může lišit ±3 dny — historické zdroje nejsou jednotné.',
});
