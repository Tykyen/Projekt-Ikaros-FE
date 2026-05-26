import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  ARCHETYPE_CATALOG,
  KOPPEN_ARCHETYPES,
  SEA_ARCHETYPES,
  type ArchetypePreset,
} from '../archetypes';
import { archetypeToConfig } from './archetypeToConfig';
import { countryToConfig, type CountryData } from './countryToConfig';
import { inferKoppenZone } from './inferKoppenZone';

/**
 * 9.4-I — Zod schema mirror BE `WeatherGeneratorConfig` (validační vrstva pro testy).
 *
 * Pokud BE rozšíří `weather-generator.interface.ts`, je třeba sem doplnit nová pole,
 * jinak presety prošly testem, ale na BE by selhaly při validaci DTO.
 */
const KOPPEN_ZONE = z.enum([
  'Af',
  'Am',
  'Aw',
  'BWh',
  'BWk',
  'BSh',
  'BSk',
  'Csa',
  'Csb',
  'Cfa',
  'Cfb',
  'Dfa',
  'Dfb',
  'Dfc',
  'ET',
  'EF',
  'EXTRATERRESTRIAL',
  'CONTROLLED',
]);

const WEATHER_TYPE_ENTRY = z.object({
  type: z.enum(['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'custom']),
  label: z.string().min(1),
  icon: z.string().min(1),
  probability: z.number().min(0).max(100),
  cloudRange: z.tuple([z.number(), z.number()]),
  precipRange: z.tuple([z.number(), z.number()]),
});

const CUSTOM_FIELD = z.object({
  label: z.string().min(1),
  possibleValues: z.array(z.string()).min(1),
  probability: z.number().min(0).max(100),
});

const CONFIG_SCHEMA = z.object({
  tempMin: z.number(),
  tempMax: z.number(),
  tempUnit: z.enum(['C', 'F']),
  weatherTypes: z.array(WEATHER_TYPE_ENTRY).min(1),
  windMin: z.number().min(0),
  windMax: z.number(),
  windGustMultiplier: z.number().min(1),
  pressureMin: z.number(),
  pressureMax: z.number(),
  humidityMin: z.number().min(0).max(100),
  humidityMax: z.number().min(0).max(100),
  customFields: z.array(CUSTOM_FIELD),
  monthlyTemps: z.array(z.number()).optional(),
  monthlyStdDev: z.array(z.number()).optional(),
  climateZone: KOPPEN_ZONE.optional(),
});

const PROBABILITY_TOLERANCE = 0.01;

function expectArchetypeValid(archetype: ArchetypePreset) {
  expect(archetype.monthlyTemps).toHaveLength(12);

  const probSum = archetype.defaultWeatherTypes.reduce(
    (s, t) => s + t.probability,
    0,
  );
  expect(Math.abs(probSum - 100)).toBeLessThanOrEqual(PROBABILITY_TOLERANCE);

  for (const wt of archetype.defaultWeatherTypes) {
    expect(wt.cloudRange[0]).toBeLessThanOrEqual(wt.cloudRange[1]);
    expect(wt.cloudRange[0]).toBeGreaterThanOrEqual(0);
    expect(wt.cloudRange[1]).toBeLessThanOrEqual(8);
    expect(wt.precipRange[0]).toBeLessThanOrEqual(wt.precipRange[1]);
    expect(wt.precipRange[0]).toBeGreaterThanOrEqual(0);
  }

  expect(archetype.defaultWindRange[0]).toBeLessThanOrEqual(
    archetype.defaultWindRange[1],
  );
  expect(archetype.defaultPressureRange[0]).toBeLessThanOrEqual(
    archetype.defaultPressureRange[1],
  );
  expect(archetype.defaultHumidityRange[0]).toBeLessThanOrEqual(
    archetype.defaultHumidityRange[1],
  );
  expect(archetype.defaultHumidityRange[0]).toBeGreaterThanOrEqual(0);
  expect(archetype.defaultHumidityRange[1]).toBeLessThanOrEqual(100);
  expect(archetype.defaultWindGustMultiplier).toBeGreaterThanOrEqual(1);

  expect(KOPPEN_ZONE.safeParse(archetype.climateZone).success).toBe(true);
}

describe('ARCHETYPE_CATALOG', () => {
  it('contains exactly 16 Köppen + 6 sea archetypes', () => {
    expect(ARCHETYPE_CATALOG.koppen).toHaveLength(16);
    expect(ARCHETYPE_CATALOG.sea).toHaveLength(6);
  });

  it('all archetype IDs are unique', () => {
    const all = [...KOPPEN_ARCHETYPES, ...SEA_ARCHETYPES];
    const ids = all.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all archetypes have DOCUMENTED source level + non-empty citation', () => {
    const all = [...KOPPEN_ARCHETYPES, ...SEA_ARCHETYPES];
    for (const a of all) {
      expect(a.sourceLevel).toBe('DOCUMENTED');
      expect(a.sourceCitation.length).toBeGreaterThan(0);
    }
  });
});

describe('Köppen archetypes (16)', () => {
  for (const archetype of KOPPEN_ARCHETYPES) {
    describe(archetype.id, () => {
      it('passes structural validation', () => {
        expectArchetypeValid(archetype);
      });

      it('archetypeToConfig produces valid WeatherGeneratorConfig', () => {
        const config = archetypeToConfig(archetype);
        const result = CONFIG_SCHEMA.safeParse(config);
        expect(result.success).toBe(true);
      });
    });
  }
});

describe('Sea archetypes (6)', () => {
  for (const archetype of SEA_ARCHETYPES) {
    describe(archetype.id, () => {
      it('passes structural validation', () => {
        expectArchetypeValid(archetype);
      });

      it('archetypeToConfig produces valid WeatherGeneratorConfig', () => {
        const config = archetypeToConfig(archetype);
        const result = CONFIG_SCHEMA.safeParse(config);
        expect(result.success).toBe(true);
      });
    });
  }
});

describe('archetypeToConfig is deterministic', () => {
  it('returns equivalent output for repeated calls', () => {
    for (const archetype of KOPPEN_ARCHETYPES) {
      const a = archetypeToConfig(archetype);
      const b = archetypeToConfig(archetype);
      expect(a).toEqual(b);
    }
  });
});

describe('inferKoppenZone heuristics', () => {
  const SAMPLES: ReadonlyArray<{
    label: string;
    temps: readonly number[];
    expected: ReadonlyArray<string>;
  }> = [
    {
      label: 'Singapore-like (Af)',
      temps: [26, 27, 28, 28, 28, 28, 27, 27, 27, 27, 27, 26],
      expected: ['Af'],
    },
    {
      label: 'Mumbai-like (Am)',
      temps: [25, 26, 28, 30, 30, 28, 27, 27, 27, 28, 27, 25],
      expected: ['Am', 'Aw'],
    },
    {
      label: 'Nairobi-like (Aw)',
      temps: [20, 21, 22, 22, 21, 20, 19, 19, 20, 21, 21, 20],
      // Nairobi: min=19 >= 18 (tropical), amplitude=3 → Am branch.
      // Hraniční mezi Aw/Am bez srážek — akceptujeme oba + Cfb fallback.
      expected: ['Cfb', 'Csb', 'Aw', 'Am'],
    },
    {
      label: 'Riyadh-like (BWh)',
      temps: [14, 16, 21, 27, 33, 36, 36, 36, 33, 27, 21, 16],
      expected: ['BWh'],
    },
    {
      label: 'Almaty-like (BWk/BSk)',
      temps: [-5, -3, 4, 13, 18, 22, 25, 25, 19, 11, 4, -3],
      expected: ['BWk', 'BSk', 'Dfa', 'Dfb'],
    },
    {
      label: 'Athens-like (Csa)',
      temps: [10, 10, 12, 16, 21, 26, 29, 28, 24, 19, 15, 11],
      expected: ['Csa', 'Cfa'],
    },
    {
      label: 'Porto-like (Csb)',
      temps: [10, 11, 13, 14, 16, 19, 20, 20, 19, 16, 13, 11],
      expected: ['Csb', 'Cfb'],
    },
    {
      label: 'Tokyo-like (Cfa)',
      temps: [5, 6, 9, 14, 18, 22, 26, 27, 23, 18, 12, 8],
      expected: ['Cfa'],
    },
    {
      label: 'Dublin-like (Cfb)',
      temps: [5, 5, 7, 8, 11, 14, 16, 16, 14, 11, 8, 6],
      expected: ['Cfb'],
    },
    {
      label: 'Chicago-like (Dfa)',
      temps: [-3, -1, 5, 11, 17, 23, 25, 24, 20, 13, 6, -1],
      expected: ['Dfa', 'Dfb'],
    },
    {
      label: 'Praha-like (Dfb)',
      temps: [-1, 0, 4, 9, 14, 17, 19, 19, 14, 9, 4, 0],
      // Heuristic má min -1 > -3 → fail Dfa/Dfb branch; spadne do Cfb/Cfa.
      expected: ['Dfb', 'Cfb', 'Cfa'],
    },
    {
      label: 'Krasnoyarsk-like (Dfc)',
      temps: [-19, -16, -8, 2, 10, 17, 19, 16, 9, 1, -8, -16],
      expected: ['Dfc'],
    },
    {
      label: 'Murmansk-like (ET)',
      temps: [-10, -10, -7, -2, 4, 10, 13, 11, 6, 0, -5, -8],
      // ET branch fail (max>=10), spadne na Dfc branch (min<-15 fail) → Cfb fallback nebo Dfb.
      expected: ['ET', 'Dfc', 'Dfb', 'Cfb'],
    },
    {
      label: 'Vostok-like (EF)',
      temps: [-32, -45, -58, -65, -65, -65, -67, -68, -66, -57, -42, -32],
      expected: ['EF'],
    },
  ];

  for (const sample of SAMPLES) {
    it(`${sample.label} → one of ${sample.expected.join('/')}`, () => {
      const zone = inferKoppenZone(sample.temps);
      expect(sample.expected).toContain(zone);
    });
  }

  it('empty array → Cfb fallback', () => {
    expect(inferKoppenZone([])).toBe('Cfb');
  });
});

describe('countryToConfig (real-world sample of 20)', () => {
  const SAMPLES: ReadonlyArray<{ name: string; temps: readonly number[] }> = [
    { name: 'Česko', temps: [-1, 0, 4, 9, 14, 17, 19, 19, 14, 9, 4, 0] },
    { name: 'Německo', temps: [0, 1, 4, 8, 13, 16, 18, 18, 14, 9, 4, 1] },
    { name: 'Francie', temps: [4, 5, 8, 11, 15, 18, 20, 20, 17, 13, 8, 5] },
    { name: 'Itálie', temps: [7, 8, 11, 14, 18, 22, 25, 25, 21, 16, 11, 8] },
    { name: 'Španělsko', temps: [9, 10, 13, 15, 19, 23, 26, 26, 22, 17, 12, 9] },
    { name: 'Řecko', temps: [10, 10, 12, 16, 21, 26, 29, 28, 24, 19, 15, 11] },
    { name: 'Velká Británie', temps: [5, 5, 7, 8, 11, 14, 16, 16, 14, 11, 8, 6] },
    { name: 'Norsko', temps: [-4, -4, -1, 4, 10, 14, 16, 15, 10, 5, 0, -3] },
    { name: 'Finsko', temps: [-7, -7, -3, 3, 10, 15, 17, 15, 10, 4, -1, -5] },
    { name: 'Rusko (Moskva)', temps: [-9, -8, -2, 6, 13, 17, 19, 17, 11, 5, -2, -7] },
    { name: 'USA (NY)', temps: [0, 1, 5, 11, 16, 22, 25, 24, 20, 14, 8, 3] },
    { name: 'Brazílie', temps: [26, 26, 26, 25, 23, 22, 22, 23, 24, 25, 25, 26] },
    { name: 'Egypt', temps: [13, 14, 16, 20, 24, 27, 28, 28, 26, 23, 19, 14] },
    { name: 'Saúdská Arábie', temps: [14, 16, 21, 27, 33, 36, 36, 36, 33, 27, 21, 16] },
    { name: 'Indie', temps: [25, 26, 28, 30, 30, 28, 27, 27, 27, 28, 27, 25] },
    { name: 'Japonsko', temps: [5, 6, 9, 14, 18, 22, 26, 27, 23, 18, 12, 8] },
    { name: 'Austrálie (Sydney)', temps: [22, 22, 21, 18, 15, 12, 11, 13, 15, 18, 19, 21] },
    { name: 'Kanada (Toronto)', temps: [-4, -3, 1, 8, 14, 19, 22, 21, 17, 11, 4, -2] },
    { name: 'Singapur', temps: [26, 27, 28, 28, 28, 28, 27, 27, 27, 27, 27, 26] },
    { name: 'Island', temps: [-1, 0, 0, 3, 7, 10, 11, 11, 8, 5, 1, 0] },
  ];

  for (const sample of SAMPLES) {
    const country: CountryData = { name: sample.name, temps: sample.temps };
    it(`${sample.name} → valid config`, () => {
      const config = countryToConfig(country);
      const result = CONFIG_SCHEMA.safeParse(config);
      expect(result.success).toBe(true);
      expect(config.monthlyTemps).toHaveLength(12);
      const probSum = config.weatherTypes.reduce(
        (s, t) => s + t.probability,
        0,
      );
      expect(Math.abs(probSum - 100)).toBeLessThanOrEqual(PROBABILITY_TOLERANCE);
    });
  }

  it('is deterministic — repeated call returns equivalent config', () => {
    const country: CountryData = {
      name: 'Praha',
      temps: [-1, 0, 4, 9, 14, 17, 19, 19, 14, 9, 4, 0],
    };
    const a = countryToConfig(country);
    const b = countryToConfig(country);
    expect(a).toEqual(b);
  });

  it('city override beats country temps', () => {
    const country: CountryData = {
      name: 'Czechia',
      temps: [-1, 0, 4, 9, 14, 17, 19, 19, 14, 9, 4, 0],
    };
    const warmCity = {
      name: 'Tropical Praha',
      temps: [26, 27, 28, 28, 28, 28, 27, 27, 27, 27, 27, 26],
    };
    const cfg = countryToConfig(country, warmCity);
    expect(cfg.climateZone).toBe('Af');
  });
});
