import { describe, it, expect } from 'vitest';
import { tokenViewMode } from '../tokenViewMode';
import type { MapToken } from '../../types';

function pcToken(slug: string, isNpc = false): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: slug,
    q: 0,
    r: 0,
    isNpc,
    currentHp: 5,
    maxHp: 5,
    baseHp: 5,
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

function bestieToken(): MapToken {
  return {
    ...pcToken('skret1'),
    isNpc: true,
    templateId: 'b1',
    characterId: 'bestie:b1',
    characterSlug: 'b1',
  };
}

describe('tokenViewMode', () => {
  it('PJ libovolný token → "pj"', () => {
    expect(tokenViewMode(pcToken('jan'), 'u1', true, [])).toBe('pj');
    expect(tokenViewMode(bestieToken(), 'u1', true, [])).toBe('pj');
  });

  it('hráč vlastní PC (slug match) → "owner"', () => {
    expect(tokenViewMode(pcToken('jan'), 'u1', false, ['jan', 'lara'])).toBe(
      'owner',
    );
  });

  it('hráč cizí PC → "limited"', () => {
    expect(tokenViewMode(pcToken('cizi'), 'u1', false, ['jan'])).toBe(
      'limited',
    );
  });

  it('hráč NPC (i pokud by slug náhodou matchoval) → "limited" (isNpc=true blokuje)', () => {
    expect(
      tokenViewMode(pcToken('jan', true), 'u1', false, ['jan']),
    ).toBe('limited');
  });

  it('hráč bestie → "limited"', () => {
    expect(tokenViewMode(bestieToken(), 'u1', false, [])).toBe('limited');
  });

  it('nepřihlášený (currentUserId = null) → "limited"', () => {
    expect(tokenViewMode(pcToken('jan'), null, false, ['jan'])).toBe(
      'limited',
    );
  });

  it('hráč bez postav (prázdný mySlugs) na vlastní PC → "limited" (postavy ještě neloaded)', () => {
    expect(tokenViewMode(pcToken('jan'), 'u1', false, [])).toBe('limited');
  });
});
