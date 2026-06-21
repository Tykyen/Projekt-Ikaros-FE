/**
 * 15.3 — testy geometrie šablon (pixel-space → buňky, čtvercová mřížka).
 */
import { describe, it, expect } from 'vitest';
import { templateCells } from '../templateGeometry';
import type { HexConfig } from '../../types';

const config: HexConfig = {
  gridType: 'square',
  size: 40,
  originX: 0,
  originY: 0,
  showGrid: true,
};

const origin = { x: 0, y: 0 };

describe('templateCells (square grid)', () => {
  it('degenerovaný (origin==target) → 1 buňka', () => {
    expect(templateCells('circle', origin, origin, config)).toHaveLength(1);
  });

  it('circle obsahuje střed a je symetrický kolem origin', () => {
    const cells = templateCells('circle', origin, { x: 120, y: 0 }, config);
    expect(cells).toContainEqual({ q: 0, r: 0 });
    // poloměr 3 buňky → ±3 v ose
    expect(cells).toContainEqual({ q: 3, r: 0 });
    expect(cells).toContainEqual({ q: -3, r: 0 });
    expect(cells).toContainEqual({ q: 0, r: 3 });
  });

  it('cone míří jen do směru tažení (+x), ne dozadu', () => {
    const cells = templateCells('cone', origin, { x: 160, y: 0 }, config);
    expect(cells).toContainEqual({ q: 1, r: 0 });
    expect(cells).toContainEqual({ q: 3, r: 0 });
    // za zády (−x) nic
    expect(cells.some((c) => c.q < 0)).toBe(false);
  });

  it('line drží úzký pruh podél směru (+x)', () => {
    const cells = templateCells('line', origin, { x: 200, y: 0 }, config);
    expect(cells).toContainEqual({ q: 0, r: 0 });
    expect(cells).toContainEqual({ q: 5, r: 0 });
    // mimo osu (r=2) ne
    expect(cells.some((c) => Math.abs(c.r) >= 2)).toBe(false);
  });

  it('square je blok ±n v obou osách', () => {
    const cells = templateCells('square', origin, { x: 80, y: 0 }, config);
    expect(cells).toContainEqual({ q: 2, r: 2 });
    expect(cells).toContainEqual({ q: -2, r: -2 });
  });
});
