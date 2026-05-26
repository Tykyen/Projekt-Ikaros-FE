import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Čínský — zjednodušený lunisolární kalendář (F-II Metonic aproximace).
 *
 * Měsíce číslované 1.–12. (zhengyue, ..., layue) + 13. intercalary měsíc
 * v přestupném roce. Letopočet od tradiční Yellow Emperor éry (2697 BCE)
 * → 2026 CE = 4723.
 *
 * ⚠️ Skutečný čínský kalendář používá přesné astronomické výpočty
 * (true sun/moon, 24 solárních termínů). F-II = Metonic aproximace
 * (±1–2 dny per cyklus). F-V dodá `chinese-precise` s VSOP87 ephemerides.
 */
export const CHINESE_SIMPLE_PRESET: CalendarPreset = buildPreset({
  slug: 'chinese-simple',
  name: 'Čínský (zjednodušený)',
  description:
    'Lunisolární kalendář (12 měsíců + intercalary 13. v přestupném roce). Metonic aproximace — pro přesnou variantu viz „chinese-precise" (F-V).',
  category: 'soucasne-nabozenske',
  hoursPerDay: 24,
  daysOfWeek: ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'],
  // 12 + 1 intercalary (na konci, opakuje číslo 12. měsíce).
  months: [
    { name: '1. měsíc (zhengyue)', daysCount: 30 },
    { name: '2. měsíc',            daysCount: 29 },
    { name: '3. měsíc',            daysCount: 30 },
    { name: '4. měsíc',            daysCount: 29 },
    { name: '5. měsíc',            daysCount: 30 },
    { name: '6. měsíc',            daysCount: 29 },
    { name: '7. měsíc',            daysCount: 30 },
    { name: '8. měsíc',            daysCount: 29 },
    { name: '9. měsíc',            daysCount: 30 },
    { name: '10. měsíc',           daysCount: 29 },
    { name: '11. měsíc',           daysCount: 30 },
    { name: '12. měsíc (layue)',   daysCount: 29 },
    { name: 'přestupný měsíc',     daysCount: 30, isIntercalary: true },
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
  anchor: { year: 4723, monthIndex: 3, day: 9 }, // 9. den 4. lun. měsíce
  anchorToleranceDays: 2,
  note:
    'Metonic aproximace. Přesný čínský kalendář vyžaduje astronomické výpočty (F-V `chinese-precise`). Rok Bing-wu / Ohnivý kůň = 4723 dle Yellow Emperor éry.',
});
