import { describe, it, expect } from 'vitest';
import { findFirstFreeHex } from '../findFirstFreeHex';
import type { MapToken } from '../../types';

function t(q: number, r: number, id = `${q},${r}`): MapToken {
  return {
    id,
    characterId: 'x',
    characterSlug: 'x',
    q,
    r,
    isNpc: false,
    currentHp: 0,
    maxHp: 0,
    baseHp: 0,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 0,
    abilities: [],
    customData: {},
  };
}

describe('findFirstFreeHex', () => {
  it('empty tokens → returns start', () => {
    expect(findFirstFreeHex([], { q: 0, r: 0 })).toEqual({ q: 0, r: 0 });
  });

  it('start hex occupied → returns first neighbor', () => {
    const result = findFirstFreeHex([t(0, 0)], { q: 0, r: 0 });
    expect(result).not.toEqual({ q: 0, r: 0 });
    // Some neighbor — distance 1 from origin.
    expect(Math.abs(result.q) + Math.abs(result.r)).toBeLessThanOrEqual(1);
  });

  it('cluster of occupied hexes → finds free further away', () => {
    const occupied = [
      t(0, 0),
      t(1, 0),
      t(-1, 0),
      t(0, 1),
      t(0, -1),
      t(1, -1),
      t(-1, 1),
    ];
    const result = findFirstFreeHex(occupied, { q: 0, r: 0 });
    const isOccupied = occupied.some((tk) => tk.q === result.q && tk.r === result.r);
    expect(isOccupied).toBe(false);
  });
});
