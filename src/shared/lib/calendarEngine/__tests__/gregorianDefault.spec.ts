import { describe, expect, it } from 'vitest';
import {
  GREGORIAN_DEFAULT_CONFIG,
  MOON_EPOCH_REFERENCE_ABSDAY,
} from '../gregorianDefault';
import { toAbsDay } from '../absDay';
import { getLunarPhase } from '../lunar';

describe('GREGORIAN_DEFAULT_CONFIG — shape', () => {
  it('Má 12 měsíců', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.months).toHaveLength(12);
  });

  it('Má 7 dní v týdnu', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.daysOfWeek).toHaveLength(7);
  });

  it('Má 4 sezóny (Jaro/Léto/Podzim/Zima)', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.seasons.map((s) => s.name)).toEqual([
      'Jaro',
      'Léto',
      'Podzim',
      'Zima',
    ]);
  });

  it('Má 1 nebeské těleso (Měsíc 29.5306d)', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.celestialBodies).toHaveLength(1);
    const moon = GREGORIAN_DEFAULT_CONFIG.celestialBodies[0];
    expect(moon.id).toBe('moon');
    expect(moon.orbitalPeriodDays).toBe(29.5306);
  });

  it('Slug = gregorian, hoursPerDay = 24', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.slug).toBe('gregorian');
    expect(GREGORIAN_DEFAULT_CONFIG.hoursPerDay).toBe(24);
  });

  it('epochOffset = 0 (referenční kalendář)', () => {
    expect(GREGORIAN_DEFAULT_CONFIG.epochOffset).toBe(0);
  });
});

describe('MOON_EPOCH_REFERENCE_ABSDAY', () => {
  it('Odpovídá výpočtu toAbsDay({2000, 0, 6}) — astronomický nov 6. 1. 2000', () => {
    const computed = toAbsDay(
      { year: 2000, monthIndex: 0, day: 6 },
      GREGORIAN_DEFAULT_CONFIG,
    );
    expect(MOON_EPOCH_REFERENCE_ABSDAY).toBe(computed);
  });

  it('V tento den vychází fáze new', () => {
    const moon = GREGORIAN_DEFAULT_CONFIG.celestialBodies[0];
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY, moon)).toBe('new');
  });
});
