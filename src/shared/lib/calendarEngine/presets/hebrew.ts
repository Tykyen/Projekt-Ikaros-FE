import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Židovský — lunisolární kalendář. Měsíce sledují Měsíc, rok udržován
 * v souladu se sluncem 19-letým Metonickým cyklem (7 přestupných roků
 * na pozicích {3, 6, 8, 11, 14, 17, 19}). V přestupném roce se vkládá
 * adar I (30 dní) před adar (29 dní → de facto adar II).
 *
 * ⚠️ Zjednodušení F-II: chešvan/kislev mají pevné délky (29/30) — historicky
 * varianty „deficient/regular/abundant" (řešeno až ve F-V astro engine).
 * Anchor data může být ±1 den (lunar drift + pozorování).
 */
export const HEBREW_PRESET: CalendarPreset = buildPreset({
  slug: 'hebrew',
  name: 'Židovský',
  description:
    'Lunisolární kalendář (12 měsíců + adar I v přestupném roce). Metonic 19-letý cyklus. Den začíná západem slunce.',
  category: 'soucasne-nabozenske',
  hoursPerDay: 24,
  daysOfWeek: [
    'jom šeni',    // pondělí (jom rišon = neděle, takže pondělí = 2. den)
    'jom šliši',   // úterý
    'jom revi`i',  // středa
    'jom chamiši', // čtvrtek
    'jom šiši',    // pátek
    'šabat',       // sobota
    'jom rišon',   // neděle
  ],
  // 13 měsíců: 12 standardních + adar I (intercalary) před adar.
  months: [
    { name: 'nisan',   daysCount: 30 },
    { name: 'ijar',    daysCount: 29 },
    { name: 'sivan',   daysCount: 30 },
    { name: 'tamuz',   daysCount: 29 },
    { name: 'av',      daysCount: 30 },
    { name: 'elul',    daysCount: 29 },
    { name: 'tišri',   daysCount: 30 },
    { name: 'chešvan', daysCount: 29 },
    { name: 'kislev',  daysCount: 30 },
    { name: 'tevet',   daysCount: 29 },
    { name: 'ševat',   daysCount: 30 },
    { name: 'adar I',  daysCount: 30, isIntercalary: true },
    { name: 'adar',    daysCount: 29 },
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
  anchor: { year: 5786, monthIndex: 2, day: 9 }, // 9. sivan 5786
  anchorToleranceDays: 1,
  note:
    'Lunisolární zjednodušení F-II — chešvan/kislev pevné délky 29/30 (historicky variant „deficient/regular/abundant"). Den začíná západem slunce; po západu 25.5.2026 už 10. sivan.',
});
