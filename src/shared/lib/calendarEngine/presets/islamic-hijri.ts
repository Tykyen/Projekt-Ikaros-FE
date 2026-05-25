import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Islámský / Hidžra — **čistě lunární** kalendář. 12 lunárních měsíců
 * střídavě 30/29 dní = ~354 dní/rok. Dhu al-Hijjah (12.) má v přestupném
 * roce 30 dní místo 29 (tabular Kuwaiti variant, 30-letý cyklus).
 *
 * Měsíce se posouvají vůči ročním obdobím ~10–11 dní/rok.
 * Letopočet AH (622 CE = 1 AH, hidžra).
 *
 * ⚠️ Skutečné náboženské datum se může lišit ±1 den (regionální pozorování srpku).
 */
export const ISLAMIC_HIJRI_PRESET: CalendarPreset = buildPreset({
  slug: 'islamic-hijri',
  name: 'Islámský / Hidžra',
  description:
    'Čistě lunární kalendář (~354 dní/rok). Měsíce se posouvají vůči ročním obdobím.',
  category: 'soucasne-nabozenske',
  hoursPerDay: 24,
  daysOfWeek: [
    'al-ithnajn',     // pondělí
    'ath-thuláthá',   // úterý
    'al-arbiʽá', // středa
    'al-chamís',      // čtvrtek
    'al-džumʽa', // pátek (svátek)
    'as-sabt',        // sobota
    'al-ahad',        // neděle
  ],
  months: [
    { name: 'muharram',        daysCount: 30 },
    { name: 'safar',           daysCount: 29 },
    { name: 'rabí al-awwal',   daysCount: 30 },
    { name: 'rabí al-thání',   daysCount: 29 },
    { name: 'džumádá al-úlá',  daysCount: 30 },
    { name: 'džumádá al-áchira', daysCount: 29 },
    { name: 'radžab',          daysCount: 30 },
    { name: 'šaʽbán',     daysCount: 29 },
    { name: 'ramadán',         daysCount: 30 },
    { name: 'šawwál',          daysCount: 29 },
    { name: 'dhu al-qaʽa', daysCount: 30 },
    { name: 'dhu al-hidždža',  daysCount: 29 }, // 30 v přestupném (11/30 cyklus)
  ],
  leapYearRule: { type: 'islamic-30', leapMonthIndex: 11 },
  celestialBodies: [
    {
      id: 'moon',
      name: 'Měsíc',
      orbitalPeriodDays: 29.5306,
      color: '#c0c8d0',
      epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
    },
  ],
  // Sezóny nejsou v islámském kalendáři striktně definovány (lunar drift)
  // — necháme prázdné, PJ může přidat fantasy sezóny pokud chce.
  seasons: [],
  anchor: { year: 1447, monthIndex: 11, day: 8 }, // 8. dhu al-hidždža 1447 AH
  anchorToleranceDays: 1,
  note:
    'Tabular varianta (Kuwaiti/Microsoft, 30-letý cyklus). Skutečné náboženské datum se může lišit ±1 den podle regionálního pozorování srpku Měsíce.',
});
