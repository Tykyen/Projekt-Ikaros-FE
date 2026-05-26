import { toAbsDay } from '../absDay';
import { GREGORIAN_DEFAULT_CONFIG } from '../gregorianDefault';
import type { CalendarConfig } from '../types';
import type { CalendarPreset, CalendarPresetDefinition } from './types';

/**
 * 9.3-F-I — Anchor pro calibraci všech presetů: 25. 5. 2026 Gregorian.
 *
 * `ANCHOR_ABSDAY` = `toAbsDay({year: 2026, monthIndex: 4, day: 25}, GREGORIAN_DEFAULT_CONFIG)`.
 *
 * Spočítané z PRESETS-DATASET.md: pondělí 25. května 2026. Každý preset
 * deklaruje `anchor: { year, monthIndex, day }` = co by `fromAbsDay(ANCHOR_ABSDAY, preset)`
 * mělo vrátit. Calibration utility odsud spočítá `epochOffset`.
 */
export const ANCHOR_DATE_GREGORIAN = {
  year: 2026,
  monthIndex: 4, // květen
  day: 25,
} as const;

export const ANCHOR_ABSDAY: number = toAbsDay(
  ANCHOR_DATE_GREGORIAN,
  GREGORIAN_DEFAULT_CONFIG,
);

/**
 * 9.3-F-I — Spočítá `epochOffset` pro preset tak, aby
 * `fromAbsDay(ANCHOR_ABSDAY, presetConfig)` vrátilo `def.anchor`.
 *
 * Deterministický výpočet bez trial-and-error:
 *   epochOffset = ANCHOR_ABSDAY − toAbsDay(def.anchor, presetWithZeroOffset)
 */
export function calibrateEpochOffset(
  def: CalendarPresetDefinition,
): number {
  const tempConfig: CalendarConfig = {
    id: '',
    slug: def.slug,
    name: def.name,
    hoursPerDay: def.hoursPerDay,
    daysOfWeek: def.daysOfWeek,
    months: def.months,
    celestialBodies: def.celestialBodies,
    seasons: def.seasons,
    leapYearRule: def.leapYearRule,
    lunisolar: def.lunisolar,
    epochOffset: 0,
  };
  const anchorAbsInPreset = toAbsDay(def.anchor, tempConfig);
  return ANCHOR_ABSDAY - anchorAbsInPreset;
}

/**
 * 9.3-F-I — Build hotový preset z definice (auto-calibrate epochOffset).
 */
export function buildPreset(def: CalendarPresetDefinition): CalendarPreset {
  const epochOffset = calibrateEpochOffset(def);
  return {
    slug: def.slug,
    name: def.name,
    description: def.description,
    category: def.category,
    template: {
      slug: def.slug,
      name: def.name,
      hoursPerDay: def.hoursPerDay,
      daysOfWeek: def.daysOfWeek,
      months: def.months,
      celestialBodies: def.celestialBodies,
      seasons: def.seasons,
      ...(def.leapYearRule ? { leapYearRule: def.leapYearRule } : {}),
      ...(def.lunisolar ? { lunisolar: def.lunisolar } : {}),
      epochOffset,
    },
    anchor: def.anchor,
    anchorToleranceDays: def.anchorToleranceDays ?? 0,
    note: def.note,
  };
}
