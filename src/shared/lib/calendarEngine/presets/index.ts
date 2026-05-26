/**
 * 9.3-F-I — Databáze 10 stable historických / současných kalendářů.
 *
 * Consumer:
 *  - `CalendarConfigsPage` wizard „+ Přidat kalendář" — picker step 1.
 *  - `CreateWorldPage` calendar selector — multi-select při tvorbě světa.
 *  - `DateConversionPopup` — converze datumu mezi kalendáři světa.
 *
 * Iterace F-II přidá 4 lunisolární (Hebrew, Chinese, Babylonian, Greek Attic).
 * Iterace F-III přidá 6 speciálních (Mayan, Aztec, Roman, French Rev,
 *   Cotsworth, World Calendar) přes `CalendarKind` enum.
 *
 * @see docs/arch/phase-9/spec-9.3-followup-historical-calendars.md
 * @see docs/arch/phase-9/PRESETS-DATASET.md
 */

import { GREGORIAN_PRESET } from './gregorian';
import { JULIAN_PRESET } from './julian';
import { SOLAR_HIJRI_PRESET } from './solar-hijri';
import { SAKA_PRESET } from './saka';
import { ETHIOPIAN_PRESET } from './ethiopian';
import { COPTIC_PRESET } from './coptic';
import { BUDDHIST_THAI_PRESET } from './buddhist-thai';
import { EGYPTIAN_CIVIL_PRESET } from './egyptian-civil';
import { HOLOCENE_PRESET } from './holocene';
import { ISLAMIC_HIJRI_PRESET } from './islamic-hijri';
// 9.3-F-II — 4 lunisolární (Metonic 19-letý cyklus)
import { HEBREW_PRESET } from './hebrew';
import { CHINESE_SIMPLE_PRESET } from './chinese-simple';
import { BABYLONIAN_PRESET } from './babylonian';
import { GREEK_ATTIC_PRESET } from './greek-attic';

import type { CalendarPreset } from './types';

export const CALENDAR_PRESETS: readonly CalendarPreset[] = [
  // Současné civilní
  GREGORIAN_PRESET,
  JULIAN_PRESET,
  SOLAR_HIJRI_PRESET,
  SAKA_PRESET,
  ETHIOPIAN_PRESET,
  BUDDHIST_THAI_PRESET,
  // Současné náboženské
  COPTIC_PRESET,
  HEBREW_PRESET,
  ISLAMIC_HIJRI_PRESET,
  CHINESE_SIMPLE_PRESET,
  // Historické
  EGYPTIAN_CIVIL_PRESET,
  BABYLONIAN_PRESET,
  GREEK_ATTIC_PRESET,
  // Alternativní
  HOLOCENE_PRESET,
];

export function getPresetBySlug(slug: string): CalendarPreset | undefined {
  return CALENDAR_PRESETS.find((p) => p.slug === slug);
}

export type {
  CalendarPreset,
  CalendarPresetDefinition,
  PresetCategory,
} from './types';
export {
  PRESET_CATEGORY_LABELS,
  PRESET_CATEGORY_ORDER,
} from './types';
export {
  ANCHOR_DATE_GREGORIAN,
  ANCHOR_ABSDAY,
  buildPreset,
  calibrateEpochOffset,
} from './calibration';
