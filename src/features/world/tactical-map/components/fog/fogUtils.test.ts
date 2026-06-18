import { describe, it, expect } from 'vitest';
import {
  fogBrushHexes,
  effectivelyRevealed,
  hexKey,
  parseAlpha,
  isTokenHiddenByFog,
} from './fogUtils';
import type { MapToken } from '../../types';

function tok(partial: Partial<MapToken>): MapToken {
  return {
    id: partial.id ?? 't',
    characterSlug: null,
    q: partial.q ?? 0,
    r: partial.r ?? 0,
    isNpc: partial.isNpc ?? false,
  } as unknown as MapToken;
}

describe('fogBrushHexes', () => {
  it('size 0 → jen středový hex', () => {
    expect(fogBrushHexes(3, -1, 0)).toEqual([{ q: 3, r: -1 }]);
  });

  it('size 1 → 7 hexů (střed + ring 1)', () => {
    expect(fogBrushHexes(0, 0, 1)).toHaveLength(7);
  });

  it('size 2 → 19 hexů', () => {
    expect(fogBrushHexes(0, 0, 2)).toHaveLength(19);
  });
});

describe('effectivelyRevealed', () => {
  it('spojí revealedHexes s hexy PC tokenů', () => {
    const revealed = [{ q: 0, r: 0 }];
    const tokens = [
      tok({ q: 5, r: 5, isNpc: false }), // PC → přidá se
      tok({ q: 9, r: 9, isNpc: true }), // NPC → NEpřidá se
    ];
    const set = effectivelyRevealed(revealed, tokens);
    expect(set.has(hexKey(0, 0))).toBe(true);
    expect(set.has(hexKey(5, 5))).toBe(true);
    expect(set.has(hexKey(9, 9))).toBe(false);
  });

  it('prázdné vstupy → prázdný set', () => {
    expect(effectivelyRevealed([], []).size).toBe(0);
  });

  it('PC token na již-revealed hexu se nezduplikuje', () => {
    const set = effectivelyRevealed(
      [{ q: 2, r: 2 }],
      [tok({ q: 2, r: 2, isNpc: false })],
    );
    expect(set.size).toBe(1);
  });
});

describe('isTokenHiddenByFog', () => {
  const revealedSet = new Set([hexKey(0, 0)]);
  const base = { fogEnabled: true, isPJ: false, revealedSet };

  it('NPC v zamlženém hexu → skrytý pro hráče', () => {
    expect(isTokenHiddenByFog(tok({ q: 5, r: 5, isNpc: true }), base)).toBe(true);
  });
  it('NPC v odhaleném hexu → viditelný', () => {
    expect(isTokenHiddenByFog(tok({ q: 0, r: 0, isNpc: true }), base)).toBe(false);
  });
  it('PC token → vždy viditelný i v zamlženém', () => {
    expect(isTokenHiddenByFog(tok({ q: 5, r: 5, isNpc: false }), base)).toBe(false);
  });
  it('PJ vidí vše', () => {
    expect(
      isTokenHiddenByFog(tok({ q: 5, r: 5, isNpc: true }), { ...base, isPJ: true }),
    ).toBe(false);
  });
  it('mlha vypnutá → nic není skryté', () => {
    expect(
      isTokenHiddenByFog(tok({ q: 5, r: 5, isNpc: true }), { ...base, fogEnabled: false }),
    ).toBe(false);
  });
});

describe('parseAlpha', () => {
  it('vytáhne alpha z rgba', () => {
    expect(parseAlpha('rgba(70, 75, 95, 0.16)')).toBeCloseTo(0.16);
    expect(parseAlpha('rgba(170, 180, 200, 0.94)')).toBeCloseTo(0.94);
  });
  it('rgb / 6místný hex / nevalidní → 1', () => {
    expect(parseAlpha('rgb(70, 75, 95)')).toBe(1);
    expect(parseAlpha('#0a0814')).toBe(1);
    expect(parseAlpha('')).toBe(1);
  });

  it('vytáhne alfu z 8místného #rrggbbaa (cssnano output)', () => {
    // rgba(70,75,95,0.55) → cssnano → #464b5f8c (0x8c = 140/255 ≈ 0.55)
    expect(parseAlpha('#464b5f8c')).toBeCloseTo(140 / 255, 2);
    expect(parseAlpha('#000000ff')).toBe(1);
  });

  it('vytáhne alfu z #rgba shorthandu', () => {
    expect(parseAlpha('#fff8')).toBeCloseTo(0x88 / 255, 2);
  });
});
