import { describe, it, expect } from 'vitest';
import { generateDungeon, SIZE_PRESETS, type DungeonTheme } from '../generate';
import { generateWilderness } from '../generateWilderness';
import { countWalkableRegions } from '../model';
import { DUNGEON_LIMITS, isWalkable } from '../../types';

const base = {
  width: SIZE_PRESETS.M.width,
  height: SIZE_PRESETS.M.height,
  roomDensity: 0.6,
  windiness: 0.4,
  specialDoorRatio: 0.5,
  furnishing: 0.6,
  seed: 987654,
};

describe('témata podzemí (21.3f)', () => {
  it('všechna témata generují propojené podzemí (deterministicky)', () => {
    const themes: DungeonTheme[] = [
      'klasika',
      'hrobka',
      'doly',
      'kanaly',
      'pevnost',
      'jeskyne',
    ];
    for (const theme of themes) {
      const a = generateDungeon({ ...base, theme });
      const b = generateDungeon({ ...base, theme });
      expect(a.cells).toEqual(b.cells);
      expect(countWalkableRegions(a.cells)).toBe(1);
    }
  });

  it('hrobka nemá padací mříže a má dlažbu v místnostech', () => {
    const d = generateDungeon({ ...base, theme: 'hrobka' });
    const flat = d.cells.flat();
    expect(flat.some((c) => c.type === 'portcullis')).toBe(false);
    expect(
      flat.some((c) => c.type === 'floor' && c.floorVariant === 'dlazba'),
    ).toBe(true);
  });

  it('doly mají hliněné štoly, pevnost nemá tajné dveře', () => {
    const doly = generateDungeon({ ...base, theme: 'doly' });
    expect(
      doly.cells
        .flat()
        .every((c) => c.type !== 'floor' || c.floorVariant === 'hlina'),
    ).toBe(true);
    const pevnost = generateDungeon({ ...base, theme: 'pevnost' });
    expect(pevnost.cells.flat().some((c) => c.type === 'door-secret')).toBe(
      false,
    );
  });

  it('témata mění výstup (hrobka ≠ klasika při stejném seedu)', () => {
    const a = generateDungeon({ ...base, theme: 'klasika' });
    const b = generateDungeon({ ...base, theme: 'hrobka' });
    expect(a.decorations).not.toEqual(b.decorations);
  });
});

describe('jeskyně CA (21.3f)', () => {
  it('propojené, deterministické, bez místností, s hlínou', () => {
    for (const seed of [7, 4242, 999999]) {
      const cave = generateDungeon({ ...base, theme: 'jeskyne', seed });
      expect(countWalkableRegions(cave.cells)).toBe(1);
      expect(cave.rooms).toHaveLength(0);
      const floors = cave.cells.flat().filter((c) => c.type === 'floor');
      expect(floors.length).toBeGreaterThan(50);
      expect(floors.every((c) => c.floorVariant === 'hlina')).toBe(true);
    }
  });

  it('jeskynní dekorace leží na podlaze a drží limit', () => {
    const cave = generateDungeon({
      ...base,
      theme: 'jeskyne',
      furnishing: 1,
    });
    expect(cave.decorations.length).toBeLessThanOrEqual(
      DUNGEON_LIMITS.maxDecorations,
    );
    for (const dec of cave.decorations) {
      expect(isWalkable(cave.cells[dec.cellY][dec.cellX].type)).toBe(true);
    }
  });

  it('okraj zůstává skála', () => {
    const cave = generateDungeon({ ...base, theme: 'jeskyne' });
    const h = cave.cells.length;
    const w = cave.cells[0].length;
    for (let x = 0; x < w; x++) {
      expect(cave.cells[0][x].type).toBe('empty');
      expect(cave.cells[h - 1][x].type).toBe('empty');
    }
  });
});

const wildBase = {
  width: 41,
  height: 29,
  forestness: 0.6,
  mountainness: 0.5,
  water: 'yes' as const,
  settlement: 'yes' as const,
  furnishing: 0.6,
  seed: 13579,
};

describe('krajina (21.3g)', () => {
  it('deterministická; jiný seed = jiná krajina', () => {
    const a = generateWilderness(wildBase);
    const b = generateWilderness(wildBase);
    const c = generateWilderness({ ...wildBase, seed: 2 });
    expect(a.cells).toEqual(b.cells);
    expect(a.decorations).toEqual(b.decorations);
    expect(a.cells).not.toEqual(c.cells);
  });

  it('cesta vede přes celou šířku a je souvislá (mosty přes vodu)', () => {
    for (const seed of [1, 555, 90210]) {
      const wildD = generateWilderness({ ...wildBase, seed });
      const passable = (t: string): boolean => t === 'street' || t === 'bridge';
      const h = wildD.cells.length;
      const w = wildD.cells[0].length;
      // V každém sloupci je aspoň jedna buňka cesty/mostu.
      for (let x = 0; x < w; x++) {
        let found = false;
        for (let y = 0; y < h; y++)
          if (passable(wildD.cells[y][x].type)) found = true;
        expect(found).toBe(true);
      }
    }
  });

  it('hornatost 0 ⇒ žádné hory/kopce; lesnatost 0 ⇒ žádný les', () => {
    const flat = generateWilderness({
      ...wildBase,
      mountainness: 0,
      forestness: 0,
      water: 'no',
      settlement: 'no',
    });
    const types = new Set(flat.cells.flat().map((c) => c.type));
    expect(types.has('mountain')).toBe(false);
    expect(types.has('hill')).toBe(false);
    expect(types.has('forest')).toBe(false);
  });

  it('water:yes ⇒ voda; settlement:yes ⇒ budovy s čísly a pole', () => {
    const wildD = generateWilderness(wildBase);
    const flat = wildD.cells.flat().map((c) => c.type);
    expect(flat).toContain('water');
    expect(flat).toContain('building');
    expect(flat).toContain('field');
    const labels = wildD.decorations.filter((d) => d.type === 'label');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('dekorace nekolidují a drží limit; 100×100 pod 1 s', () => {
    const t0 = performance.now();
    const big = generateWilderness({
      ...wildBase,
      width: 100,
      height: 100,
      furnishing: 1,
    });
    expect(performance.now() - t0).toBeLessThan(1000);
    expect(big.decorations.length).toBeLessThanOrEqual(
      DUNGEON_LIMITS.maxDecorations,
    );
    const seen = new Set<string>();
    for (const d of big.decorations) {
      const key = `${d.cellX},${d.cellY}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
