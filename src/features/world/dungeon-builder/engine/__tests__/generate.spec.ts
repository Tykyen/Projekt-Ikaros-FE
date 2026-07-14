import { describe, it, expect } from 'vitest';
import {
  generateDungeon,
  SIZE_PRESETS,
  mulberry32,
  type GeneratorParams,
} from '../generate';
import { countWalkableRegions } from '../model';
import { isDoorType, isWalkable } from '../../types';

const baseParams: GeneratorParams = {
  width: SIZE_PRESETS.M.width,
  height: SIZE_PRESETS.M.height,
  roomDensity: 0.5,
  windiness: 0.5,
  specialDoorRatio: 0.3,
  seed: 12345,
};

describe('mulberry32', () => {
  it('stejný seed dává stejnou sekvenci, jiný jinou', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    const seqC = [c(), c(), c()];
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

describe('generateDungeon', () => {
  it('je deterministický: stejný seed ⇒ identický výstup', () => {
    const a = generateDungeon(baseParams);
    const b = generateDungeon(baseParams);
    expect(a.cells).toEqual(b.cells);
    expect(a.decorations).toEqual(b.decorations);
    expect(a.rooms).toEqual(b.rooms);
  });

  it('jiný seed ⇒ jiná mapa', () => {
    const a = generateDungeon(baseParams);
    const b = generateDungeon({ ...baseParams, seed: 99999 });
    expect(a.cells).not.toEqual(b.cells);
  });

  it('celé podzemí je propojené (1 region) — napříč seedy a parametry', () => {
    for (const seed of [1, 7, 12345, 555555, 2 ** 31 - 1]) {
      for (const [roomDensity, windiness, deadEndTrim] of [
        [0, 0, 0],
        [1, 1, 1],
        [0.5, 0.5, 0.8],
        [1, 0, 0.3],
      ]) {
        const d = generateDungeon({
          ...baseParams,
          seed,
          roomDensity,
          windiness,
          deadEndTrim,
        });
        expect(countWalkableRegions(d.cells)).toBe(1);
      }
    }
  });

  it('okraj gridu zůstává skála (masiv)', () => {
    const d = generateDungeon(baseParams);
    const h = d.cells.length;
    const w = d.cells[0].length;
    for (let x = 0; x < w; x++) {
      expect(d.cells[0][x].type).toBe('empty');
      expect(d.cells[h - 1][x].type).toBe('empty');
    }
    for (let y = 0; y < h; y++) {
      expect(d.cells[y][0].type).toBe('empty');
      expect(d.cells[y][w - 1].type).toBe('empty');
    }
  });

  it('rozměry: liché, ořezané do 11–99', () => {
    const d = generateDungeon({ ...baseParams, width: 40, height: 120 });
    expect(d.cells[0].length).toBe(39);
    expect(d.cells.length).toBe(99);
  });

  it('každá místnost má číselný popisek v decorations', () => {
    const d = generateDungeon(baseParams);
    expect(d.rooms.length).toBeGreaterThan(0);
    const labels = d.decorations.filter((dec) => dec.type === 'label');
    expect(labels.length).toBe(d.rooms.length);
    // Popisek leží uvnitř své místnosti (na podlaze).
    for (const l of labels) {
      expect(isWalkable(d.cells[l.cellY][l.cellX].type)).toBe(true);
    }
    expect(labels.map((l) => l.label)).toEqual(
      d.rooms.map((r) => String(r.number)),
    );
  });

  it('hustota místností má vliv (density 1 ≥ density 0)', () => {
    const low = generateDungeon({ ...baseParams, roomDensity: 0 });
    const high = generateDungeon({ ...baseParams, roomDensity: 1 });
    expect(high.rooms.length).toBeGreaterThanOrEqual(low.rooms.length);
    expect(high.rooms.length).toBeGreaterThan(1);
  });

  it('dveře existují a sedí na průchozích místech mezi dvěma stranami', () => {
    const d = generateDungeon(baseParams);
    let doors = 0;
    const h = d.cells.length;
    const w = d.cells[0].length;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isDoorType(d.cells[y][x].type)) continue;
        doors++;
        const horiz =
          x > 0 &&
          x < w - 1 &&
          isWalkable(d.cells[y][x - 1].type) &&
          isWalkable(d.cells[y][x + 1].type);
        const vert =
          y > 0 &&
          y < h - 1 &&
          isWalkable(d.cells[y - 1][x].type) &&
          isWalkable(d.cells[y + 1][x].type);
        expect(horiz || vert).toBe(true);
      }
    }
    expect(doors).toBeGreaterThan(0);
  });

  it('specialDoorRatio 0 ⇒ dveře u místností jen obyčejné', () => {
    const d = generateDungeon({ ...baseParams, specialDoorRatio: 0 });
    const special = d.cells
      .flat()
      .filter((c) =>
        ['door-locked', 'door-secret', 'door-trapped'].includes(c.type),
      );
    // portcullis/archway můžou vzniknout na spojích chodba–chodba,
    // zamčené/tajné/past jen z ratia — to je tady 0.
    expect(special.length).toBe(0);
  });

  it('L velikost se vygeneruje rychle (< 1 s)', () => {
    const t0 = performance.now();
    generateDungeon({
      ...baseParams,
      width: SIZE_PRESETS.L.width,
      height: SIZE_PRESETS.L.height,
      seed: 777,
    });
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
