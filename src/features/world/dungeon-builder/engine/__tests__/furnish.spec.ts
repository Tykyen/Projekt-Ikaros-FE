import { describe, it, expect } from 'vitest';
import { generateDungeon, SIZE_PRESETS } from '../generate';
import { isDoorType, isWalkable, DUNGEON_LIMITS } from '../../types';

const params = {
  width: SIZE_PRESETS.M.width,
  height: SIZE_PRESETS.M.height,
  roomDensity: 0.7,
  windiness: 0.4,
  specialDoorRatio: 0.3,
  furnishing: 0.8,
  seed: 424242,
};

describe('auto-zabydlení (21.3d)', () => {
  it('deterministické: stejný seed ⇒ stejný nábytek', () => {
    const a = generateDungeon(params);
    const b = generateDungeon(params);
    expect(a.decorations).toEqual(b.decorations);
  });

  it('furnishing 0 ⇒ jen popisky místností', () => {
    const d = generateDungeon({ ...params, furnishing: 0 });
    expect(d.decorations.every((dec) => dec.type === 'label')).toBe(true);
  });

  it('furnishing > 0 ⇒ nábytek existuje a leží na podlaze', () => {
    const d = generateDungeon(params);
    const furniture = d.decorations.filter((dec) => dec.type !== 'label');
    expect(furniture.length).toBeGreaterThan(0);
    for (const f of furniture) {
      expect(isWalkable(d.cells[f.cellY][f.cellX].type)).toBe(true);
      expect(d.cells[f.cellY][f.cellX].type).toBe('floor');
    }
  });

  it('nábytek neblokuje dveře ani buňky u dveří', () => {
    const d = generateDungeon(params);
    const doorAdjacent = new Set<string>();
    for (let y = 0; y < d.cells.length; y++) {
      for (let x = 0; x < d.cells[0].length; x++) {
        if (!isDoorType(d.cells[y][x].type)) continue;
        doorAdjacent.add(`${x},${y}`);
        doorAdjacent.add(`${x + 1},${y}`);
        doorAdjacent.add(`${x - 1},${y}`);
        doorAdjacent.add(`${x},${y + 1}`);
        doorAdjacent.add(`${x},${y - 1}`);
      }
    }
    const furniture = d.decorations.filter((dec) => dec.type !== 'label');
    for (const f of furniture) {
      expect(doorAdjacent.has(`${f.cellX},${f.cellY}`)).toBe(false);
    }
  });

  it('max 1 kus nábytku na buňku a limit dekorací drží', () => {
    const d = generateDungeon({ ...params, furnishing: 1 });
    const seen = new Set<string>();
    for (const dec of d.decorations.filter((x) => x.type !== 'label')) {
      const key = `${dec.cellX},${dec.cellY}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(d.decorations.length).toBeLessThanOrEqual(
      DUNGEON_LIMITS.maxDecorations,
    );
  });

  it('víc zabydlenosti ⇒ víc (nebo stejně) nábytku', () => {
    const low = generateDungeon({ ...params, furnishing: 0.2 });
    const high = generateDungeon({ ...params, furnishing: 1 });
    const count = (d: typeof low) =>
      d.decorations.filter((dec) => dec.type !== 'label').length;
    expect(count(high)).toBeGreaterThanOrEqual(count(low));
  });
});
