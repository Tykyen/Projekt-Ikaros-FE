/**
 * 17.2 — testy parseru UVTT / .dd2vtt.
 */
import { describe, it, expect } from 'vitest';
import { parseUvtt, UvttParseError } from '../parseUvtt';

/** Minimální validní UVTT (10×8 buněk, 100 px/buňka). */
function makeUvtt(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: 0.3,
    resolution: {
      map_origin: { x: 0, y: 0 },
      map_size: { x: 10, y: 8 },
      pixels_per_grid: 100,
    },
    line_of_sight: [
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 8 },
      ],
    ],
    portals: [
      {
        position: { x: 5, y: 4 },
        bounds: [
          { x: 5, y: 3 },
          { x: 5, y: 5 },
        ],
        closed: true,
        freestanding: false,
      },
    ],
    lights: [
      {
        position: { x: 3, y: 3 },
        range: 2,
        intensity: 0.8,
        color: 'ffcc00ff',
        shadows: true,
      },
    ],
    image: 'aGVsbG8=', // "hello" base64 (obsah nezáleží)
    ...overrides,
  });
}

describe('parseUvtt — kalibrace mřížky', () => {
  it('size = pixels_per_grid, scale = 1, gridType square', () => {
    const r = parseUvtt(makeUvtt());
    expect(r.config.size).toBe(100);
    expect(r.config.gridType).toBe('square');
    expect(r.config.backgroundScale).toBe(1);
    expect(r.pixelsPerGrid).toBe(100);
  });

  it('origin přepočítaný na px (map_origin × ppg)', () => {
    const r = parseUvtt(
      makeUvtt({
        resolution: {
          map_origin: { x: 1, y: 2 },
          map_size: { x: 10, y: 8 },
          pixels_per_grid: 100,
        },
      }),
    );
    expect(r.config.originX).toBe(100);
    expect(r.config.originY).toBe(200);
  });
});

describe('parseUvtt — zdi a dveře', () => {
  it('line_of_sight polygon → wall v px', () => {
    const r = parseUvtt(makeUvtt());
    const wall = r.walls.find((w) => w.type === 'wall');
    expect(wall).toBeDefined();
    // grid body × 100
    expect(wall!.points).toEqual([0, 0, 1000, 0, 1000, 800]);
    expect(wall!.blocksSight).toBe(true);
  });

  it('objects_line_of_sight se přidá ke zdím', () => {
    const r = parseUvtt(
      makeUvtt({
        objects_line_of_sight: [
          [
            { x: 2, y: 2 },
            { x: 3, y: 2 },
          ],
        ],
      }),
    );
    expect(r.walls.filter((w) => w.type === 'wall')).toHaveLength(2);
  });

  it('portal closed → dveře, blocksSight true, open false', () => {
    const r = parseUvtt(makeUvtt());
    const door = r.walls.find((w) => w.type === 'door');
    expect(door).toBeDefined();
    expect(door!.points).toEqual([500, 300, 500, 500]);
    expect(door!.door?.open).toBe(false);
    expect(door!.blocksSight).toBe(true);
  });

  it('portal closed=false → otevřené dveře neblokují', () => {
    const r = parseUvtt(
      makeUvtt({
        portals: [
          {
            position: { x: 5, y: 4 },
            bounds: [
              { x: 5, y: 3 },
              { x: 5, y: 5 },
            ],
            closed: false,
          },
        ],
      }),
    );
    const door = r.walls.find((w) => w.type === 'door');
    expect(door!.door?.open).toBe(true);
    expect(door!.blocksSight).toBe(false);
  });
});

describe('parseUvtt — světla', () => {
  it('range × ppg, barva normalizovaná na #rrggbb', () => {
    const r = parseUvtt(makeUvtt());
    expect(r.lights).toHaveLength(1);
    const l = r.lights[0];
    expect(l.x).toBe(300);
    expect(l.y).toBe(300);
    expect(l.range).toBe(200); // 2 × 100
    expect(l.intensity).toBe(0.8);
    expect(l.color).toBe('#ffcc00'); // 8hex RGBA → prvních 6
  });
});

describe('parseUvtt — obrázek', () => {
  it('vrátí base64 bez data: prefixu', () => {
    const r = parseUvtt(makeUvtt({ image: 'data:image/png;base64,aGVsbG8=' }));
    expect(r.imageBase64).toBe('aGVsbG8=');
  });
});

describe('parseUvtt — chybové stavy', () => {
  it('nevalidní JSON → UvttParseError', () => {
    expect(() => parseUvtt('{not json')).toThrow(UvttParseError);
  });

  it('chybí pixels_per_grid → UvttParseError', () => {
    expect(() =>
      parseUvtt(
        JSON.stringify({ resolution: {}, image: 'aGVsbG8=' }),
      ),
    ).toThrow(/mřížky/);
  });

  it('chybí image → UvttParseError', () => {
    expect(() =>
      parseUvtt(
        JSON.stringify({ resolution: { pixels_per_grid: 100 } }),
      ),
    ).toThrow(/obrázek/);
  });

  it('prázdné volitelné sekce → prázdná pole, ne pád', () => {
    const r = parseUvtt(
      JSON.stringify({
        resolution: { pixels_per_grid: 70 },
        image: 'aGVsbG8=',
      }),
    );
    expect(r.walls).toEqual([]);
    expect(r.lights).toEqual([]);
    expect(r.config.size).toBe(70);
  });
});
