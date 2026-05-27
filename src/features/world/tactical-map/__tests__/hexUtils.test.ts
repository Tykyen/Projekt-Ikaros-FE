/**
 * 10.2b — testy pro hex math.
 *
 * Pokrytí per spec §7. Float-point math testuje přes `toBeCloseTo`.
 */
import { describe, it, expect } from 'vitest';
import {
  AXIAL_DIRECTIONS,
  axialToPixel,
  pixelToAxial,
  getHexCorner,
  getHexPoints,
  getHexPolyPoints,
  getHexNeighbor,
  getHexRing,
  getHexesInRadius,
  hexDistance,
} from '../hexUtils';

const SIZE = 40;

describe('axialToPixel', () => {
  it('origin (0, 0) → (0, 0)', () => {
    const p = axialToPixel(0, 0, SIZE);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });

  it('(1, 0) → (size·√3, 0)', () => {
    const p = axialToPixel(1, 0, SIZE);
    expect(p.x).toBeCloseTo(SIZE * Math.sqrt(3), 5);
    expect(p.y).toBe(0);
  });

  it('(0, 1) → (size·√3/2, size·3/2)', () => {
    const p = axialToPixel(0, 1, SIZE);
    expect(p.x).toBeCloseTo((SIZE * Math.sqrt(3)) / 2, 5);
    expect(p.y).toBeCloseTo(SIZE * 1.5, 5);
  });
});

describe('pixelToAxial', () => {
  it('(0, 0) → (q:0, r:0)', () => {
    expect(pixelToAxial(0, 0, SIZE)).toEqual({ q: 0, r: 0 });
  });

  it('round-trip (5, 3) → axialToPixel → pixelToAxial → (5, 3)', () => {
    const p = axialToPixel(5, 3, SIZE);
    expect(pixelToAxial(p.x, p.y, SIZE)).toEqual({ q: 5, r: 3 });
  });

  it('round-trip (-7, 4) → (-7, 4)', () => {
    const p = axialToPixel(-7, 4, SIZE);
    expect(pixelToAxial(p.x, p.y, SIZE)).toEqual({ q: -7, r: 4 });
  });

  it('nepřesný pixel se snap-uje na nejbližší hex (cube-round)', () => {
    // Tiny offset z center hexu (1, 0) → musí vrátit (1, 0)
    const p = axialToPixel(1, 0, SIZE);
    expect(pixelToAxial(p.x + 1, p.y + 1, SIZE)).toEqual({ q: 1, r: 0 });
  });
});

describe('getHexCorner', () => {
  it('corner 0 — úhel −30° (vrchol vpravo)', () => {
    const center = { x: 0, y: 0 };
    const c = getHexCorner(center, SIZE, 0);
    // cos(-30°) ≈ 0.866, sin(-30°) = -0.5
    expect(c.x).toBeCloseTo(SIZE * Math.cos(-Math.PI / 6), 5);
    expect(c.y).toBeCloseTo(SIZE * Math.sin(-Math.PI / 6), 5);
  });

  it('6 corners obkrouží hex (vrátí se na začátek po i+6)', () => {
    const center = { x: 100, y: 100 };
    const c0 = getHexCorner(center, SIZE, 0);
    const c6 = getHexCorner(center, SIZE, 6);
    expect(c0.x).toBeCloseTo(c6.x, 5);
    expect(c0.y).toBeCloseTo(c6.y, 5);
  });
});

describe('getHexPoints (SVG format)', () => {
  it('vrací 6 párů x,y oddělených mezerou', () => {
    const points = getHexPoints({ x: 0, y: 0 }, SIZE);
    const parts = points.split(' ');
    expect(parts).toHaveLength(6);
    expect(parts[0]).toMatch(/^-?\d+\.?\d*,-?\d+\.?\d*$/);
  });
});

describe('getHexPolyPoints (PixiJS format)', () => {
  it('vrací 12 čísel (6 × 2)', () => {
    const pts = getHexPolyPoints({ x: 0, y: 0 }, SIZE);
    expect(pts).toHaveLength(12);
    pts.forEach((n) => expect(typeof n).toBe('number'));
  });

  it('první roh je úhel −30°', () => {
    const pts = getHexPolyPoints({ x: 0, y: 0 }, SIZE);
    expect(pts[0]).toBeCloseTo(SIZE * Math.cos(-Math.PI / 6), 5);
    expect(pts[1]).toBeCloseTo(SIZE * Math.sin(-Math.PI / 6), 5);
  });
});

describe('getHexNeighbor', () => {
  it('AXIAL_DIRECTIONS — 6 vektorů', () => {
    expect(AXIAL_DIRECTIONS).toHaveLength(6);
  });

  it('soused (0,0) dir 0 → (1, 0)', () => {
    expect(getHexNeighbor(0, 0, 0)).toEqual({ q: 1, r: 0 });
  });

  it('soused (0,0) všech 6 dirs', () => {
    expect(getHexNeighbor(0, 0, 1)).toEqual({ q: 1, r: -1 });
    expect(getHexNeighbor(0, 0, 2)).toEqual({ q: 0, r: -1 });
    expect(getHexNeighbor(0, 0, 3)).toEqual({ q: -1, r: 0 });
    expect(getHexNeighbor(0, 0, 4)).toEqual({ q: -1, r: 1 });
    expect(getHexNeighbor(0, 0, 5)).toEqual({ q: 0, r: 1 });
  });

  it('dir wrap modulo 6 (dir=6 = dir=0)', () => {
    expect(getHexNeighbor(0, 0, 6)).toEqual({ q: 1, r: 0 });
  });
});

describe('getHexRing', () => {
  it('radius 0 → 1 hex (střed)', () => {
    expect(getHexRing(0, 0, 0)).toEqual([{ q: 0, r: 0 }]);
  });

  it('radius 1 → 6 hexů', () => {
    const ring = getHexRing(0, 0, 1);
    expect(ring).toHaveLength(6);
  });

  it('radius 2 → 12 hexů (6·N)', () => {
    expect(getHexRing(0, 0, 2)).toHaveLength(12);
  });

  it('radius 3 → 18 hexů', () => {
    expect(getHexRing(0, 0, 3)).toHaveLength(18);
  });

  it('všechny hexy v ringu radius=N mají hexDistance=N od středu', () => {
    const ring = getHexRing(0, 0, 3);
    for (const h of ring) {
      expect(hexDistance({ q: 0, r: 0 }, h)).toBe(3);
    }
  });
});

describe('getHexesInRadius', () => {
  it('radius 0 → 1 hex', () => {
    expect(getHexesInRadius(0, 0, 0)).toHaveLength(1);
  });

  it('radius 1 → 7 hexů (1 + 6)', () => {
    expect(getHexesInRadius(0, 0, 1)).toHaveLength(7);
  });

  it('radius 2 → 19 hexů (1 + 6 + 12)', () => {
    expect(getHexesInRadius(0, 0, 2)).toHaveLength(19);
  });

  it('radius 3 → 37 hexů (1 + 6 + 12 + 18)', () => {
    expect(getHexesInRadius(0, 0, 3)).toHaveLength(37);
  });
});

describe('hexDistance', () => {
  it('stejný hex → 0', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });

  it('soused → 1', () => {
    for (const d of AXIAL_DIRECTIONS) {
      expect(hexDistance({ q: 0, r: 0 }, d)).toBe(1);
    }
  });

  it('(0,0) → (3,0) = 3', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
  });

  it('(0,0) → (2,-1) = 2', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });

  it('symmetric: dist(a, b) = dist(b, a)', () => {
    const a = { q: -3, r: 5 };
    const b = { q: 7, r: -2 };
    expect(hexDistance(a, b)).toBe(hexDistance(b, a));
  });
});
