import { describe, it, expect } from 'vitest';
import { computeStaggerOffsets } from '../tokenStaggerOffset';
import type { MapToken } from '../../types';

function token(id: string, q: number, r: number): MapToken {
  return {
    id,
    characterId: 'char',
    characterSlug: 'slug',
    q,
    r,
    isNpc: false,
    currentHp: 10,
    maxHp: 10,
    baseHp: 10,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 5,
    abilities: [],
    customData: {},
  };
}

describe('computeStaggerOffsets', () => {
  it('single token → no offset', () => {
    const offsets = computeStaggerOffsets([token('a', 0, 0)]);
    expect(offsets.a).toEqual({ x: 0, y: 0 });
  });

  it('two tokens same hex → opposite offsets', () => {
    const offsets = computeStaggerOffsets([
      token('a', 0, 0),
      token('b', 0, 0),
    ]);
    expect(offsets.a.x).not.toBe(0);
    expect(offsets.b.x).not.toBe(0);
    expect(offsets.a.x).toBeCloseTo(-offsets.b.x, 5);
  });

  it('different hexes → separate offsets per cell', () => {
    const offsets = computeStaggerOffsets([
      token('a', 0, 0),
      token('b', 1, 0),
    ]);
    expect(offsets.a).toEqual({ x: 0, y: 0 });
    expect(offsets.b).toEqual({ x: 0, y: 0 });
  });

  it('three tokens same hex → 120° rozdělení', () => {
    const offsets = computeStaggerOffsets([
      token('a', 0, 0),
      token('b', 0, 0),
      token('c', 0, 0),
    ]);
    expect(offsets.a).toBeDefined();
    expect(offsets.b).toBeDefined();
    expect(offsets.c).toBeDefined();
    // Vzdálenosti od středu by měly být shodné (= RADIUS).
    const radius = Math.hypot(offsets.a.x, offsets.a.y);
    expect(Math.hypot(offsets.b.x, offsets.b.y)).toBeCloseTo(radius, 5);
    expect(Math.hypot(offsets.c.x, offsets.c.y)).toBeCloseTo(radius, 5);
  });
});
