/**
 * 9.4-I — Smoke testy pro buildPresetItems.
 *
 * Cíl: zaručit, že builder funguje pro každou kategorii a `toConfig()`
 * deterministicky produkuje validní `WeatherGeneratorConfig`.
 */
import { describe, it, expect } from 'vitest';
import {
  buildAllPresetItems,
  buildCustomPresetItems,
  buildItemsForCategory,
} from './buildPresetItems';
import type { CustomWeatherPreset, WeatherGeneratorConfig } from '@/shared/types';

describe('buildPresetItems', () => {
  it('buildAllPresetItems → vrátí nonempty array napříč všemi kategoriemi', () => {
    const all = buildAllPresetItems();
    expect(all.length).toBeGreaterThan(50);
    // Reprezentanti všech kategorií
    expect(all.some((i) => i.category === 'countries')).toBe(true);
    expect(all.some((i) => i.category === 'koppen')).toBe(true);
    expect(all.some((i) => i.category === 'sea')).toBe(true);
    expect(all.some((i) => i.category === 'extremes')).toBe(true);
  });

  it('countries → každý item má unique id', () => {
    const items = buildItemsForCategory('countries');
    const ids = new Set(items.map((i) => i.id));
    expect(ids.size).toBe(items.length);
  });

  it('extremes → builder produkuje 7 položek (Naica, Vostok, Death Valley, …)', () => {
    const items = buildItemsForCategory('extremes');
    expect(items).toHaveLength(7);
    expect(items.some((i) => i.id.includes('vostok'))).toBe(true);
    expect(items.some((i) => i.id.includes('death-valley'))).toBe(true);
  });

  it('toConfig() → vrátí valid WeatherGeneratorConfig (mandatory pole)', () => {
    const items = buildItemsForCategory('extremes');
    const config = items[0].toConfig();
    expect(config).toHaveProperty('tempMin');
    expect(config).toHaveProperty('tempMax');
    expect(config).toHaveProperty('tempUnit');
    expect(Array.isArray(config.weatherTypes)).toBe(true);
    expect(config.weatherTypes.length).toBeGreaterThan(0);
    expect(typeof config.windMin).toBe('number');
    expect(typeof config.windMax).toBe('number');
  });

  it('countries item → defaultGeneratorName není prázdný', () => {
    const items = buildItemsForCategory('countries');
    items.forEach((i) => {
      expect(i.defaultGeneratorName.length).toBeGreaterThan(0);
    });
  });

  it('toConfig deterministic — opakované volání = identický shape', () => {
    const items = buildItemsForCategory('koppen');
    const c1 = items[0].toConfig();
    const c2 = items[0].toConfig();
    expect(c1.tempMin).toBe(c2.tempMin);
    expect(c1.tempMax).toBe(c2.tempMax);
    expect(c1.climateZone).toBe(c2.climateZone);
  });

  // ─── 9.4-dluh — Custom presets ──────────────────────────────────────────

  describe('Custom presets (9.4-dluh)', () => {
    const CUSTOM_CONFIG: WeatherGeneratorConfig = {
      tempMin: 5,
      tempMax: 22,
      tempUnit: 'C',
      weatherTypes: [],
      windMin: 0,
      windMax: 40,
      windGustMultiplier: 2,
      pressureMin: 990,
      pressureMax: 1030,
      humidityMin: 40,
      humidityMax: 90,
      customFields: [],
    };

    const mockPreset = (
      overrides: Partial<CustomWeatherPreset> = {},
    ): CustomWeatherPreset => ({
      id: 'cp1',
      worldId: 'w1',
      name: 'Severní lesy',
      description: 'Pro lesní regiony',
      emoji: '🌲',
      config: CUSTOM_CONFIG,
      createdBy: 'u1',
      usageCount: 0,
      createdAt: '2026-05-26T00:00:00Z',
      updatedAt: '2026-05-26T00:00:00Z',
      ...overrides,
    });

    it('buildCustomPresetItems → mapuje na PresetItem s category="custom"', () => {
      const items = buildCustomPresetItems([
        mockPreset({ id: 'a', name: 'A' }),
        mockPreset({ id: 'b', name: 'B', usageCount: 5 }),
      ]);
      expect(items).toHaveLength(2);
      expect(items[0].category).toBe('custom');
      expect(items[0].id).toBe('custom:a');
      expect(items[0].defaultGeneratorName).toBe('A');
    });

    it('toConfig vrací přesnou kopii uloženého configu', () => {
      const [item] = buildCustomPresetItems([mockPreset()]);
      const cfg = item.toConfig();
      expect(cfg.tempMin).toBe(5);
      expect(cfg.tempMax).toBe(22);
      expect(cfg).toBe(CUSTOM_CONFIG); // reference identity (immutable snapshot)
    });

    it('buildItemsForCategory("custom") s daty → vrátí items, bez dat → []', () => {
      expect(buildItemsForCategory('custom')).toEqual([]);
      const items = buildItemsForCategory('custom', [mockPreset()]);
      expect(items).toHaveLength(1);
    });

    it('buildAllPresetItems s custom presety → custom items jsou před static', () => {
      const all = buildAllPresetItems([mockPreset({ id: 'first' })]);
      const customItems = all.filter((i) => i.category === 'custom');
      expect(customItems).toHaveLength(1);
      // První items v array jsou custom (před real-world)
      expect(all[0].category).toBe('custom');
    });

    it('emoji fallback ⭐ pokud preset emoji chybí', () => {
      const [item] = buildCustomPresetItems([
        mockPreset({ emoji: undefined }),
      ]);
      expect(item.glyph).toBe('⭐');
    });
  });
});
