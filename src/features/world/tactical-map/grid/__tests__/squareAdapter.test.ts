/**
 * 15.2 — testy čtvercového adaptéru (square + none sdílí geometrii).
 */
import { describe, it, expect } from 'vitest';
import { squareAdapter, noneAdapter } from '../squareAdapter';

const SIZE = 40;

describe('squareAdapter.toPixel / toCell', () => {
  it('(0,0) → (0,0)', () => {
    expect(squareAdapter.toPixel(0, 0, SIZE)).toEqual({ x: 0, y: 0 });
  });

  it('(2,3) → (2·size, 3·size)', () => {
    expect(squareAdapter.toPixel(2, 3, SIZE)).toEqual({ x: 80, y: 120 });
  });

  it('round-trip toPixel → toCell', () => {
    const p = squareAdapter.toPixel(-5, 7, SIZE);
    expect(squareAdapter.toCell(p.x, p.y, SIZE)).toEqual({ q: -5, r: 7 });
  });

  it('toCell snapuje k nejbližší buňce (offset < půl buňky)', () => {
    expect(squareAdapter.toCell(SIZE * 1 + 5, SIZE * 2 - 5, SIZE)).toEqual({
      q: 1,
      r: 2,
    });
  });
});

describe('squareAdapter.distance (Chebyshev)', () => {
  it('identita = 0', () => {
    expect(squareAdapter.distance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });

  it('rovně = delta', () => {
    expect(squareAdapter.distance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
  });

  it('diagonála stojí jako rovně (max z delt)', () => {
    expect(squareAdapter.distance({ q: 0, r: 0 }, { q: 3, r: 3 })).toBe(3);
    expect(squareAdapter.distance({ q: 0, r: 0 }, { q: 2, r: 4 })).toBe(4);
  });

  it('symetrie', () => {
    const a = { q: -2, r: 5 };
    const b = { q: 4, r: -1 };
    expect(squareAdapter.distance(a, b)).toBe(squareAdapter.distance(b, a));
  });
});

describe('squareAdapter.cellsInRadius / cellsInRing', () => {
  it('radius 0 = 1 buňka', () => {
    expect(squareAdapter.cellsInRadius(0, 0, 0)).toHaveLength(1);
  });

  it('radius 1 = 9 buněk (3×3 blok)', () => {
    expect(squareAdapter.cellsInRadius(0, 0, 1)).toHaveLength(9);
  });

  it('radius 2 = 25 buněk (5×5 blok)', () => {
    expect(squareAdapter.cellsInRadius(0, 0, 2)).toHaveLength(25);
  });

  it('ring radius 0 = 1 buňka (střed)', () => {
    expect(squareAdapter.cellsInRing(0, 0, 0)).toEqual([{ q: 0, r: 0 }]);
  });

  it('ring radius 1 = 8 buněk (obvod 3×3)', () => {
    expect(squareAdapter.cellsInRing(0, 0, 1)).toHaveLength(8);
  });

  it('ring radius 2 = 16 buněk (obvod 5×5)', () => {
    expect(squareAdapter.cellsInRing(0, 0, 2)).toHaveLength(16);
  });

  it('všechny buňky v ringu mají distance = radius', () => {
    const ring = squareAdapter.cellsInRing(0, 0, 3);
    for (const c of ring) {
      expect(squareAdapter.distance({ q: 0, r: 0 }, c)).toBe(3);
    }
  });
});

describe('squareAdapter.cellPoly / tokenRadius', () => {
  it('cellPoly = 4 rohy (8 čísel) centrovaný čtverec', () => {
    const poly = squareAdapter.cellPoly({ x: 0, y: 0 }, SIZE);
    expect(poly).toHaveLength(8);
    // strana = SIZE → půl = 20, rohy v ±20
    expect(poly).toEqual([-20, -20, 20, -20, 20, 20, -20, 20]);
  });

  it('tokenRadius = size/2', () => {
    expect(squareAdapter.tokenRadius(SIZE)).toBe(20);
  });
});

describe('noneAdapter', () => {
  it('sdílí geometrii se square, ale nekreslí grid', () => {
    expect(noneAdapter.drawsGrid).toBe(false);
    expect(noneAdapter.type).toBe('none');
    expect(noneAdapter.toPixel(2, 3, SIZE)).toEqual(
      squareAdapter.toPixel(2, 3, SIZE),
    );
    expect(noneAdapter.distance({ q: 0, r: 0 }, { q: 3, r: 3 })).toBe(3);
  });
});
