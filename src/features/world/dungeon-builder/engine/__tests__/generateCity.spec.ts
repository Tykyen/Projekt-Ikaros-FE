import { describe, it, expect } from 'vitest';
import { generateCity, type CityGeneratorParams } from '../generateCity';
import { DUNGEON_LIMITS } from '../../types';

const base: CityGeneratorParams = {
  width: 41,
  height: 29,
  buildingDensity: 0.6,
  windiness: 0.4,
  walls: 'yes',
  river: 'yes',
  greenery: 0.5,
  furnishing: 0.6,
  seed: 20260714,
};

/** Souvislost uliční sítě: flood fill přes street/bridge/gate. */
const streetRegions = (cells: ReturnType<typeof generateCity>['cells']): number => {
  const h = cells.length;
  const w = cells[0].length;
  const passable = (t: string): boolean =>
    t === 'street' || t === 'bridge' || t === 'gate';
  const seen = new Set<string>();
  let regions = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!passable(cells[y][x].type) || seen.has(`${x},${y}`)) continue;
      regions++;
      const stack: [number, number][] = [[x, y]];
      seen.add(`${x},${y}`);
      while (stack.length) {
        const [cx, cy] = stack.pop() as [number, number];
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          if (seen.has(`${nx},${ny}`) || !passable(cells[ny][nx].type))
            continue;
          seen.add(`${nx},${ny}`);
          stack.push([nx, ny]);
        }
      }
    }
  }
  return regions;
};

describe('generateCity (21.3e)', () => {
  it('deterministické: stejný seed ⇒ identické město', () => {
    const a = generateCity(base);
    const b = generateCity(base);
    expect(a.cells).toEqual(b.cells);
    expect(a.decorations).toEqual(b.decorations);
    expect(a.buildings).toEqual(b.buildings);
  });

  it('jiný seed ⇒ jiné město', () => {
    const a = generateCity(base);
    const b = generateCity({ ...base, seed: 999 });
    expect(a.cells).not.toEqual(b.cells);
  });

  it('uliční síť je souvislá (vč. mostů a bran) napříč seedy', () => {
    for (const seed of [1, 42, 777, 123456]) {
      for (const walls of ['yes', 'no'] as const) {
        for (const river of ['yes', 'no'] as const) {
          const city = generateCity({ ...base, seed, walls, river });
          expect(streetRegions(city.cells)).toBe(1);
        }
      }
    }
  });

  it('budovy existují, nepřekrývají ulice/vodu a sedí u ulic', () => {
    const city = generateCity(base);
    expect(city.buildings.length).toBeGreaterThan(3);
    for (const b of city.buildings) {
      for (let dy = 0; dy < b.height; dy++)
        for (let dx = 0; dx < b.width; dx++)
          expect(city.cells[b.y + dy][b.x + dx].type).toBe('building');
    }
  });

  it('walls:yes ⇒ hradby s branami; walls:no ⇒ žádné hradby', () => {
    const walled = generateCity({ ...base, walls: 'yes', river: 'no' });
    const flatW = walled.cells.flat().map((c) => c.type);
    expect(flatW).toContain('city-wall');
    expect(flatW).toContain('gate');
    const open = generateCity({ ...base, walls: 'no' });
    const flatO = open.cells.flat().map((c) => c.type);
    expect(flatO).not.toContain('city-wall');
    expect(flatO).not.toContain('gate');
  });

  it('river:yes ⇒ voda + most na hlavní ulici; river:no ⇒ bez vody', () => {
    const riverCity = generateCity({ ...base, river: 'yes' });
    const flat = riverCity.cells.flat().map((c) => c.type);
    expect(flat).toContain('water');
    expect(flat).toContain('bridge');
    const dry = generateCity({ ...base, river: 'no' });
    expect(dry.cells.flat().map((c) => c.type)).not.toContain('water');
  });

  it('hustota 1 ⇒ víc budov než hustota 0.15', () => {
    const low = generateCity({ ...base, buildingDensity: 0.15, seed: 5 });
    const high = generateCity({ ...base, buildingDensity: 1, seed: 5 });
    expect(high.buildings.length).toBeGreaterThan(low.buildings.length);
  });

  it('číslované budovy mají label na svém půdorysu', () => {
    const city = generateCity(base);
    const labels = city.decorations.filter((d) => d.type === 'label');
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) {
      expect(city.cells[l.cellY][l.cellX].type).toBe('building');
    }
  });

  it('zeleň a zabydlení respektují limit dekorací a nekolidují na buňce', () => {
    const city = generateCity({
      ...base,
      greenery: 1,
      furnishing: 1,
      width: 100,
      height: 100,
    });
    expect(city.decorations.length).toBeLessThanOrEqual(
      DUNGEON_LIMITS.maxDecorations,
    );
    const seen = new Set<string>();
    for (const d of city.decorations) {
      const key = `${d.cellX},${d.cellY}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('velké město (100×100) se vygeneruje rychle (< 1 s)', () => {
    const t0 = performance.now();
    generateCity({ ...base, width: 100, height: 100, seed: 31337 });
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
