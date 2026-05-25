import { describe, expect, it } from 'vitest';
import {
  CALENDAR_PRESETS,
  ANCHOR_ABSDAY,
  ANCHOR_DATE_GREGORIAN,
} from '../index';
import { fromAbsDay, toAbsDay } from '../../absDay';
import { GREGORIAN_DEFAULT_CONFIG } from '../../gregorianDefault';
import type { CalendarConfig } from '../../types';

/**
 * 9.3-F-I — Calibration: pro každý preset musí
 * `fromAbsDay(ANCHOR_ABSDAY, preset.template)` vrátit `preset.anchor`
 * (±anchorToleranceDays pro lunární).
 *
 * Anchor: pondělí 25. 5. 2026 Gregorian. PJ dataset = SSOT.
 */

describe('ANCHOR_ABSDAY sanity', () => {
  it('= toAbsDay(25.5.2026 Gregorian, GREG)', () => {
    expect(ANCHOR_ABSDAY).toBe(
      toAbsDay(ANCHOR_DATE_GREGORIAN, GREGORIAN_DEFAULT_CONFIG),
    );
  });

  it('Gregorian fromAbsDay vrátí ANCHOR_DATE', () => {
    const result = fromAbsDay(ANCHOR_ABSDAY, GREGORIAN_DEFAULT_CONFIG);
    expect(result).toEqual({
      year: 2026,
      monthIndex: 4,
      day: 25,
    });
  });
});

describe('Calibration — anchor 25.5.2026 → preset.anchor', () => {
  for (const preset of CALENDAR_PRESETS) {
    it(`${preset.slug} → year=${preset.anchor.year}, month=${preset.anchor.monthIndex}, day=${preset.anchor.day}`, () => {
      const config: CalendarConfig = { id: '', ...preset.template };
      const result = fromAbsDay(ANCHOR_ABSDAY - preset.template.epochOffset, config);
      expect(result.year).toBe(preset.anchor.year);
      expect(result.monthIndex).toBe(preset.anchor.monthIndex);
      const dayDiff = Math.abs(result.day - preset.anchor.day);
      expect(dayDiff).toBeLessThanOrEqual(preset.anchorToleranceDays);
    });
  }
});

describe('Round-trip přes calibration', () => {
  for (const preset of CALENDAR_PRESETS) {
    it(`${preset.slug}: anchor round-trip přes toAbsDay+epochOffset`, () => {
      const config: CalendarConfig = { id: '', ...preset.template };
      // anchor → absDay relativní k preset epochOffset
      const localAbs = toAbsDay(preset.anchor, config);
      // global = local + epochOffset → musí být ANCHOR_ABSDAY (±tolerance)
      const global = localAbs + preset.template.epochOffset;
      const diff = Math.abs(global - ANCHOR_ABSDAY);
      expect(diff).toBeLessThanOrEqual(preset.anchorToleranceDays);
    });
  }
});

describe('Preset shape validation', () => {
  for (const preset of CALENDAR_PRESETS) {
    describe(preset.slug, () => {
      it('non-empty slug', () => {
        expect(preset.slug).toMatch(/^[a-z0-9-]+$/);
      });

      it('non-empty name + description', () => {
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
      });

      it('non-empty months', () => {
        expect(preset.template.months.length).toBeGreaterThan(0);
        for (const m of preset.template.months) {
          expect(m.daysCount).toBeGreaterThan(0);
          expect(m.name.length).toBeGreaterThan(0);
        }
      });

      it('non-empty daysOfWeek', () => {
        expect(preset.template.daysOfWeek.length).toBeGreaterThan(0);
      });

      it('seasons fit do months range', () => {
        for (const season of preset.template.seasons) {
          expect(season.startMonthIndex).toBeGreaterThanOrEqual(0);
          expect(season.startMonthIndex).toBeLessThan(
            preset.template.months.length,
          );
          const dim =
            preset.template.months[season.startMonthIndex].daysCount;
          expect(season.startDay).toBeGreaterThanOrEqual(1);
          expect(season.startDay).toBeLessThanOrEqual(dim);
        }
      });

      it('leapYearRule.leapMonthIndex je v rozsahu months', () => {
        if (preset.template.leapYearRule) {
          expect(
            preset.template.leapYearRule.leapMonthIndex,
          ).toBeGreaterThanOrEqual(0);
          expect(
            preset.template.leapYearRule.leapMonthIndex,
          ).toBeLessThan(preset.template.months.length);
        }
      });
    });
  }
});

describe('Slug uniqueness', () => {
  it('žádné duplicitní slug', () => {
    const slugs = CALENDAR_PRESETS.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });
});
