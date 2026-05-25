import { describe, expect, it } from 'vitest';
import { getLunarPhase, getLunarPhasesForDay } from '../lunar';
import { GREGORIAN_DEFAULT_CONFIG, MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import type { CelestialBody } from '../types';

const moon = GREGORIAN_DEFAULT_CONFIG.celestialBodies[0];

/**
 * Synodický cyklus 29.5306d / 8 segmentů → ~3.69 dne na segment.
 * Boundaries v dnech od novu (offset od epoch):
 *   new            [ 0.00,  3.69)
 *   waxing-crescent [ 3.69,  7.38)
 *   first-quarter  [ 7.38, 11.07)
 *   waxing-gibbous [11.07, 14.77)
 *   full           [14.77, 18.46)
 *   waning-gibbous [18.46, 22.15)
 *   last-quarter   [22.15, 25.84)
 *   waning-crescent[25.84, 29.53)
 *
 * Testy používají dny **uvnitř** segmentu (ne na hranici).
 */
describe('getLunarPhase — Gregorian Měsíc, všech 8 segmentů', () => {
  it('Day 0 po epoch = new', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY, moon)).toBe('new');
  });

  it('Day 5 po epoch = waxing-crescent', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 5, moon)).toBe('waxing-crescent');
  });

  it('Day 9 po epoch = first-quarter', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 9, moon)).toBe('first-quarter');
  });

  it('Day 13 po epoch = waxing-gibbous', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 13, moon)).toBe('waxing-gibbous');
  });

  it('Day 17 po epoch = full', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 17, moon)).toBe('full');
  });

  it('Day 20 po epoch = waning-gibbous', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 20, moon)).toBe('waning-gibbous');
  });

  it('Day 24 po epoch = last-quarter', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 24, moon)).toBe('last-quarter');
  });

  it('Day 28 po epoch = waning-crescent', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 28, moon)).toBe('waning-crescent');
  });

  it('Cyklický wrap: epoch + 30 dnů (~1 cyklus + 0.47d) = new', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY + 30, moon)).toBe('new');
  });

  it('Záporný čas: epoch - 1 = waning-crescent', () => {
    expect(getLunarPhase(MOON_EPOCH_REFERENCE_ABSDAY - 1, moon)).toBe('waning-crescent');
  });
});

describe('getLunarPhase — fantasy 16d cyklus', () => {
  const body: CelestialBody = {
    id: 'b',
    name: 'Modrý měsíc',
    orbitalPeriodDays: 16,
    color: '#0033ff',
    epochOffset: 0,
  };

  it('Pokrývá všech 8 fází přes 16 dnů', () => {
    const phases = new Set<string>();
    for (let day = 0; day < 16; day++) {
      phases.add(getLunarPhase(day, body));
    }
    expect(phases.size).toBe(8);
  });

  it('Day 0 = new, day 8 = full', () => {
    expect(getLunarPhase(0, body)).toBe('new');
    expect(getLunarPhase(8, body)).toBe('full');
  });

  it('Day 16 = new (wrap)', () => {
    expect(getLunarPhase(16, body)).toBe('new');
  });

  it('Day 4 = first-quarter, day 12 = last-quarter', () => {
    expect(getLunarPhase(4, body)).toBe('first-quarter');
    expect(getLunarPhase(12, body)).toBe('last-quarter');
  });
});

describe('getLunarPhasesForDay', () => {
  it('Vrací info per body včetně icon + cyclePosition', () => {
    const result = getLunarPhasesForDay(MOON_EPOCH_REFERENCE_ABSDAY, [moon]);
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('new');
    expect(result[0].icon).toBe('🌑');
    expect(result[0].cyclePosition).toBe(0);
    expect(result[0].body.id).toBe('moon');
  });

  it('Custom icon na body přepisuje default', () => {
    const customBody: CelestialBody = { ...moon, icon: '⭐' };
    const result = getLunarPhasesForDay(MOON_EPOCH_REFERENCE_ABSDAY, [customBody]);
    expect(result[0].icon).toBe('⭐');
  });

  it('Prázdná těla → prázdné pole', () => {
    expect(getLunarPhasesForDay(0, [])).toEqual([]);
  });

  it('Multi-body: 2 nezávislé fáze pro stejný den', () => {
    const second: CelestialBody = {
      id: 'b2',
      name: 'Druhý měsíc',
      orbitalPeriodDays: 14,
      color: '#ff0000',
      epochOffset: 7,
    };
    const result = getLunarPhasesForDay(MOON_EPOCH_REFERENCE_ABSDAY, [moon, second]);
    expect(result).toHaveLength(2);
    expect(result[0].body.id).toBe('moon');
    expect(result[1].body.id).toBe('b2');
  });
});
