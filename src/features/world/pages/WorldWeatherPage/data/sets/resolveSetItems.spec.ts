/**
 * 9.4 — resolveSetItems unit tests.
 */
import { describe, it, expect } from 'vitest';
import { resolveSetItems } from './resolveSetItems';
import type {
  CustomWeatherPreset,
  WeatherGeneratorConfig,
  WeatherGeneratorSetItem,
} from '@/shared/types';

const DEFAULT_CONFIG: WeatherGeneratorConfig = {
  tempMin: 0,
  tempMax: 25,
  tempUnit: 'C',
  weatherTypes: [],
  windMin: 0,
  windMax: 30,
  windGustMultiplier: 1.5,
  pressureMin: 990,
  pressureMax: 1030,
  humidityMin: 30,
  humidityMax: 90,
  customFields: [],
};

function makeCustom(
  id: string,
  overrides: Partial<CustomWeatherPreset> = {},
): CustomWeatherPreset {
  return {
    id,
    worldId: 'w1',
    name: `Custom ${id}`,
    config: DEFAULT_CONFIG,
    createdBy: 'u1',
    usageCount: 0,
    createdAt: '2026-05-26T00:00:00Z',
    updatedAt: '2026-05-26T00:00:00Z',
    ...overrides,
  };
}

describe('resolveSetItems', () => {
  it('rozresolvuje city preset → config + name', () => {
    const items: WeatherGeneratorSetItem[] = [
      {
        presetId: 'city:Evropa:Česká republika:Praha',
        generatorName: 'Praha',
      },
    ];
    const { resolved, unresolved } = resolveSetItems(items);
    expect(unresolved).toEqual([]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].name).toBe('Praha');
    expect(resolved[0].config).toMatchObject({
      tempMin: expect.any(Number),
      tempMax: expect.any(Number),
    });
  });

  it('rozresolvuje archetype preset', () => {
    const items: WeatherGeneratorSetItem[] = [
      { presetId: 'archetype:sea-open-ocean', generatorName: 'Oceán' },
    ];
    const { resolved, unresolved } = resolveSetItems(items);
    expect(unresolved).toEqual([]);
    expect(resolved[0].name).toBe('Oceán');
  });

  it('předá description z item do resolved.description', () => {
    const items: WeatherGeneratorSetItem[] = [
      {
        presetId: 'city:Evropa:Česká republika:Praha',
        generatorName: 'Praha',
        description: 'Hlavní město',
      },
    ];
    const { resolved } = resolveSetItems(items);
    expect(resolved[0].description).toBe('Hlavní město');
  });

  it('neexistující presetId → unresolved (ne throw)', () => {
    const items: WeatherGeneratorSetItem[] = [
      { presetId: 'city:Mars:Olympus:Mons', generatorName: 'Olymp' },
      {
        presetId: 'city:Evropa:Česká republika:Praha',
        generatorName: 'Praha',
      },
    ];
    const { resolved, unresolved } = resolveSetItems(items);
    expect(unresolved).toEqual(['city:Mars:Olympus:Mons']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].name).toBe('Praha');
  });

  it('rozresolvuje custom preset, pokud je předán v customPresets', () => {
    const custom = makeCustom('abc', { name: 'Můj preset' });
    const items: WeatherGeneratorSetItem[] = [
      { presetId: 'custom:abc', generatorName: 'Použito' },
    ];
    const { resolved, unresolved } = resolveSetItems(items, [custom]);
    expect(unresolved).toEqual([]);
    expect(resolved[0].name).toBe('Použito');
  });

  it('custom preset chybí v customPresets → unresolved', () => {
    const items: WeatherGeneratorSetItem[] = [
      { presetId: 'custom:smazaný', generatorName: 'X' },
    ];
    const { resolved, unresolved } = resolveSetItems(items, []);
    expect(unresolved).toEqual(['custom:smazaný']);
    expect(resolved).toEqual([]);
  });

  it('prázdný input → prázdný output', () => {
    const { resolved, unresolved } = resolveSetItems([]);
    expect(resolved).toEqual([]);
    expect(unresolved).toEqual([]);
  });
});
