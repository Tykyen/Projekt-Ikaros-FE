/**
 * 9.4 — Globální sety validation.
 *
 * Klíčový invariant: každý preset ID v každém setu MUSÍ být resolvable přes
 * `buildAllPresetItems`. Test selhává, pokud někdo přeřkne město / archetyp /
 * naznačí non-existující kontinent.
 */
import { describe, it, expect } from 'vitest';
import { GLOBAL_SETS } from './index';
import { resolveSetItems } from './resolveSetItems';

describe('GLOBAL_SETS', () => {
  it('má 14 setů (kanonický počet)', () => {
    expect(GLOBAL_SETS).toHaveLength(14);
  });

  it('všechny sety mají unikátní id', () => {
    const ids = GLOBAL_SETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('všechny sety mají >= 3 items', () => {
    for (const set of GLOBAL_SETS) {
      expect(
        set.items.length,
        `set ${set.id} má jen ${set.items.length} items`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(GLOBAL_SETS.map((s) => [s.id, s]))(
    'set %s — všechny presetIds jsou resolvable (0 unresolved)',
    (_id, set) => {
      const { resolved, unresolved } = resolveSetItems(set.items);
      expect(
        unresolved,
        `unresolved presetIds: ${JSON.stringify(unresolved)}`,
      ).toEqual([]);
      expect(resolved).toHaveLength(set.items.length);
    },
  );

  it('každý resolved item má valid WeatherGeneratorConfig', () => {
    for (const set of GLOBAL_SETS) {
      const { resolved } = resolveSetItems(set.items);
      for (const item of resolved) {
        expect(item.name).toBeTruthy();
        expect(item.config.tempMin).toBeTypeOf('number');
        expect(item.config.tempMax).toBeTypeOf('number');
        expect(item.config.weatherTypes).toBeInstanceOf(Array);
      }
    }
  });
});
