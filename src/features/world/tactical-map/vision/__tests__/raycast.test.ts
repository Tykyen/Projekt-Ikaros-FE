/**
 * 17.1 — testy LoS raycastingu.
 */
import { describe, it, expect } from 'vitest';
import {
  wallsToSegments,
  computeVisibilityPolygon,
  pointInPolygon,
  computeVisionReveal,
} from '../raycast';
import type { HexConfig, MapToken, MapWall } from '../../types';

const BOUNDS = { x: 0, y: 0, width: 1000, height: 1000 };
const CONFIG: HexConfig = {
  gridType: 'square',
  size: 100,
  originX: 0,
  originY: 0,
  showGrid: true,
};

/** PC token na (q,r). */
function pc(q: number, r: number): MapToken {
  return { q, r, isNpc: false } as MapToken;
}

/** Svislá zeď na x=400 (rozdělí mapu na levou/pravou). */
const VWALL: MapWall = {
  id: 'w',
  type: 'wall',
  blocksSight: true,
  points: [400, 0, 400, 1000],
};

describe('wallsToSegments', () => {
  it('lomená čára → úsečky mezi po sobě jdoucími body', () => {
    const segs = wallsToSegments([
      { id: 'w', type: 'wall', blocksSight: true, points: [0, 0, 100, 0, 100, 100] },
    ]);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toEqual({ ax: 0, ay: 0, bx: 100, by: 0 });
  });

  it('otevřené dveře segment nepřidají', () => {
    const segs = wallsToSegments([
      { id: 'd', type: 'door', blocksSight: true, door: { open: true }, points: [0, 0, 100, 0] },
    ]);
    expect(segs).toHaveLength(0);
  });

  it('zavřené dveře blokují', () => {
    const segs = wallsToSegments([
      { id: 'd', type: 'door', blocksSight: true, door: { open: false }, points: [0, 0, 100, 0] },
    ]);
    expect(segs).toHaveLength(1);
  });

  it('blocksSight=false se ignoruje', () => {
    const segs = wallsToSegments([
      { id: 'w', type: 'wall', blocksSight: false, points: [0, 0, 100, 0] },
    ]);
    expect(segs).toHaveLength(0);
  });
});

describe('computeVisibilityPolygon', () => {
  it('bez zdí → polygon pokrývá bod u kraje mapy', () => {
    const poly = computeVisibilityPolygon({ x: 500, y: 500 }, [], BOUNDS);
    expect(poly.length).toBeGreaterThanOrEqual(4);
    // Bod poblíž libovolného rohu je vidět (mapa bez překážek).
    expect(pointInPolygon(950, 500, poly)).toBe(true);
  });

  it('zeď skryje bod za sebou, ne bod před sebou', () => {
    const origin = { x: 200, y: 200 };
    const poly = computeVisibilityPolygon(origin, wallsToSegments([VWALL]), BOUNDS);
    expect(pointInPolygon(100, 200, poly)).toBe(true); // před zdí
    expect(pointInPolygon(600, 200, poly)).toBe(false); // za zdí
  });
});

describe('pointInPolygon', () => {
  it('základní čtverec', () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon(5, 5, sq)).toBe(true);
    expect(pointInPolygon(15, 5, sq)).toBe(false);
  });
});

describe('computeVisionReveal', () => {
  it('token vidí vlastní buňku a před zeď, ne za zeď', () => {
    const reveal = computeVisionReveal([pc(2, 2)], [VWALL], [], CONFIG, BOUNDS);
    expect(reveal.has('2,2')).toBe(true); // token
    expect(reveal.has('1,2')).toBe(true); // vlevo od zdi
    expect(reveal.has('6,2')).toBe(false); // vpravo za zdí
  });

  it('otevřené dveře propustí výhled', () => {
    const door: MapWall = {
      id: 'd',
      type: 'door',
      blocksSight: true,
      door: { open: true },
      points: [400, 0, 400, 1000],
    };
    const reveal = computeVisionReveal([pc(2, 2)], [door], [], CONFIG, BOUNDS);
    expect(reveal.has('6,2')).toBe(true); // dveře otevřené → vidím dál
  });

  it('NPC token nevidí (jen PC generují LoS)', () => {
    const npc = { q: 2, r: 2, isNpc: true } as MapToken;
    const reveal = computeVisionReveal([npc], [], [], CONFIG, BOUNDS);
    expect(reveal.size).toBe(0);
  });

  it('temný režim ořízne vzdálené buňky bez světla', () => {
    const dark: HexConfig = { ...CONFIG, darkness: true, visionRange: 2 };
    const reveal = computeVisionReveal([pc(2, 2)], [], [], dark, BOUNDS);
    expect(reveal.has('3,2')).toBe(true); // do dosvitu
    expect(reveal.has('9,2')).toBe(false); // za dosvitem, bez světla
  });

  it('světlo osvětlí vzdálenou buňku i v temném režimu', () => {
    const dark: HexConfig = { ...CONFIG, darkness: true, visionRange: 2 };
    // světlo u buňky (9,2) = (900,200), dosah 150 px
    const reveal = computeVisionReveal(
      [pc(2, 2)],
      [],
      [{ id: 'l', x: 900, y: 200, range: 150, intensity: 1, color: '#ffffff' }],
      dark,
      BOUNDS,
    );
    expect(reveal.has('9,2')).toBe(true);
  });
});
