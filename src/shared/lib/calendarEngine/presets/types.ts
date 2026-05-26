import type { CalendarConfig } from '../types';

/**
 * 9.3-F-I — Kategorie presetu pro grouping v wizardu CalendarConfigsPage.
 */
export type PresetCategory =
  | 'soucasne-civilni'
  | 'soucasne-nabozenske'
  | 'historicky'
  | 'alternativni';

export const PRESET_CATEGORY_LABELS: Record<PresetCategory, string> = {
  'soucasne-civilni': 'Současné civilní',
  'soucasne-nabozenske': 'Současné náboženské',
  historicky: 'Historické',
  alternativni: 'Alternativní',
};

export const PRESET_CATEGORY_ORDER: readonly PresetCategory[] = [
  'soucasne-civilni',
  'soucasne-nabozenske',
  'historicky',
  'alternativni',
];

/**
 * 9.3-F-I — Definice presetu před calibraci.
 *
 * Anchor = jaké datum má vrátit `fromAbsDay(ANCHOR_ABSDAY, preset)` —
 * tj. odpovídá referenčnímu 25. 5. 2026 Gregorian. Calibration utility
 * z toho spočítá `epochOffset` deterministicky.
 *
 * Pro lunární/lunisolární je `anchorToleranceDays` ±1 (regionální variace
 * pozorování srpku Měsíce).
 */
export interface CalendarPresetDefinition {
  slug: string;
  name: string;
  description: string;
  category: PresetCategory;
  /** Fields stejné jako `CalendarConfig` (bez `id` a `epochOffset`). */
  hoursPerDay: number;
  daysOfWeek: string[];
  months: CalendarConfig['months'];
  celestialBodies: CalendarConfig['celestialBodies'];
  seasons: CalendarConfig['seasons'];
  leapYearRule?: CalendarConfig['leapYearRule'];
  /** 9.3-F-II — lunisolární přestupný cyklus (Metonic-19 atd.). */
  lunisolar?: CalendarConfig['lunisolar'];
  /** Datum v tomto kalendáři odpovídající 25. 5. 2026 Gregorian. */
  anchor: { year: number; monthIndex: number; day: number };
  /** Tolerance při calibration testu (default 0). Lunar: 1. */
  anchorToleranceDays?: number;
  /** Volitelná poznámka pro PJ v UI (drift, korelace, omezení). */
  note?: string;
}

/**
 * 9.3-F-I — Hotový preset (po calibraci). Template má spočítaný `epochOffset`.
 */
export interface CalendarPreset {
  slug: string;
  name: string;
  description: string;
  category: PresetCategory;
  /** Template pro `useCreateCalendarConfig` (bez `id`, vytvoří se v BE). */
  template: Omit<CalendarConfig, 'id'>;
  anchor: { year: number; monthIndex: number; day: number };
  anchorToleranceDays: number;
  note?: string;
}
