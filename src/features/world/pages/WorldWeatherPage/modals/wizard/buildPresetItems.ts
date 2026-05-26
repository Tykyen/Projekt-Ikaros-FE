/**
 * 9.4-I — Builder pro PresetItem array napříč všemi kategoriemi.
 *
 * Sjednocuje 3 různé data shapes (Country/City, Archetype, Extreme) do
 * jednoho UI shapu pro stage 3 listu + fuzzy search.
 */
import {
  REAL_WORLD_CATALOG,
  EXTREMES,
  type CityData,
  type CountryData,
} from '../../data/realWorld';
import { ARCHETYPE_CATALOG } from '../../data/archetypes';
import type { ArchetypePreset } from '../../data/archetypes/types';
import type { ExtremePreset } from '../../data/realWorld/extremes';
import { countryToConfig } from '../../data/mappers/countryToConfig';
import { archetypeToConfig } from '../../data/mappers/archetypeToConfig';
import { KOPPEN_STDDEV } from '@/features/world/lib/weatherSimulation';
import type {
  CustomWeatherPreset,
  WeatherGeneratorConfig,
  WeatherTypeEntry,
} from '@/shared/types';
import type { PresetItem, RealCategory } from './types';

/** Glyph per kategorie/typ. */
const COUNTRY_GLYPHS: Record<string, string> = {
  // Známé „flag-like" glyfy pro známá města (UI flavor)
  Praha: '🏛',
  Brno: '🏰',
  Ostrava: '⛏',
  Liberec: '🌲',
  Plzeň: '🍺',
  Bratislava: '🏰',
  Vídeň: '🎼',
  Berlín: '🐻',
  Mnichov: '🍺',
  Paříž: '🗼',
  Londýn: '🎩',
  Řím: '🏛',
  Madrid: '🌅',
  Atény: '🏛',
  Moskva: '☃',
  Tokio: '🗼',
  Soul: '🏮',
  Peking: '🏯',
  Šanghaj: '🌃',
  Bangkok: '🛕',
  Káhira: '🐪',
  Lagos: '🌴',
  'New York': '🗽',
  'Los Angeles': '🌴',
  Chicago: '💨',
  Toronto: '🍁',
  Vancouver: '🏔',
  'Ciudad de México': '🌶',
  'Buenos Aires': '💃',
  'São Paulo': '🌃',
  'Rio de Janeiro': '🌅',
  Sydney: '🏖',
  Auckland: '🐑',
};

const COUNTRY_FALLBACK_GLYPH = '🌍';

const CONTINENT_GLYPH: Record<string, string> = {
  Evropa: '🏰',
  Asie: '🏯',
  Afrika: '🌴',
  'Severní Amerika': '🏙',
  'Střední Amerika': '🌋',
  'Jižní Amerika': '🌅',
  'Austrálie a Oceánie': '🏖',
};

function fmtTempRange(temps: readonly number[]): string {
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  return `${Math.round(min)} / ${Math.round(max)} °C`;
}

function averageStdDev(zone: keyof typeof KOPPEN_STDDEV): number {
  const m = KOPPEN_STDDEV[zone].monthly;
  return m.reduce((s, x) => s + x, 0) / m.length;
}

// ── COUNTRIES ─────────────────────────────────────────────────────────

export function buildCountryItems(): PresetItem[] {
  const out: PresetItem[] = [];
  for (const [continent, countries] of Object.entries(REAL_WORLD_CATALOG)) {
    for (const country of countries) {
      // 1. Country-level item (no city)
      out.push(makeCountryItem(continent, country));
      // 2. Per-city items (s vlastními temps nebo bez)
      const cities = country.cities ?? [];
      for (const c of cities) {
        const cityData: CityData =
          typeof c === 'string' ? { name: c } : c;
        out.push(makeCityItem(continent, country, cityData));
      }
    }
  }
  return out;
}

function makeCountryItem(continent: string, country: CountryData): PresetItem {
  const id = `country:${continent}:${country.name}`;
  const displayName = country.name;
  const subtitle = continent;
  const glyph = CONTINENT_GLYPH[continent] ?? COUNTRY_FALLBACK_GLYPH;
  return {
    id,
    category: 'countries',
    displayName,
    subtitle,
    glyph,
    description: `Průměrné teploty země ${country.name}. Klikni pro náhled klimatu.`,
    metrics: { tempLabel: fmtTempRange(country.temps) },
    sortKey: `${continent}|${country.name}`,
    searchCorpus: `${country.name} ${continent}`.toLowerCase(),
    toConfig: () => countryToConfig(country) as WeatherGeneratorConfig,
    defaultGeneratorName: country.name,
  };
}

function makeCityItem(
  continent: string,
  country: CountryData,
  city: CityData,
): PresetItem {
  const temps = city.temps ?? country.temps;
  const id = `city:${continent}:${country.name}:${city.name}`;
  const displayName = `${country.name} — ${city.name}`;
  const subtitle = `${continent}`;
  const glyph = COUNTRY_GLYPHS[city.name] ?? '🏙';
  return {
    id,
    category: 'countries',
    displayName,
    subtitle,
    glyph,
    description: `Klima ${city.name} (${country.name}).`,
    metrics: { tempLabel: fmtTempRange(temps) },
    sortKey: `${continent}|${country.name}|${city.name}`,
    searchCorpus: `${city.name} ${country.name} ${continent}`.toLowerCase(),
    toConfig: () =>
      countryToConfig(country, city) as WeatherGeneratorConfig,
    defaultGeneratorName: `${city.name} — ${country.name}`,
  };
}

// ── ARCHETYPES (Köppen + Sea + Fantasy + Sci-fi) ───────────────────────

export function buildArchetypeItems(
  archetypes: ReadonlyArray<ArchetypePreset>,
  category: RealCategory,
): PresetItem[] {
  return archetypes.map((a) => makeArchetypeItem(a, category));
}

function makeArchetypeItem(
  archetype: ArchetypePreset,
  category: RealCategory,
): PresetItem {
  const tempLabel = fmtTempRange(archetype.monthlyTemps);
  const humidityMid = Math.round(
    (archetype.defaultHumidityRange[0] + archetype.defaultHumidityRange[1]) / 2,
  );
  const windMid = Math.round(
    (archetype.defaultWindRange[0] + archetype.defaultWindRange[1]) / 2,
  );
  return {
    id: `archetype:${archetype.id}`,
    category,
    displayName: archetype.name,
    subtitle: archetype.subtitle,
    glyph: archetype.emoji ?? (category === 'sea' ? '🌊' : '🌡'),
    description: archetype.description,
    metrics: {
      tempLabel,
      humidityLabel: `${humidityMid} %`,
      windLabel: `${windMid} km/h`,
    },
    sortKey: archetype.name,
    searchCorpus: `${archetype.name} ${archetype.subtitle} ${archetype.description} ${archetype.climateZone}`.toLowerCase(),
    toConfig: () => archetypeToConfig(archetype) as WeatherGeneratorConfig,
    defaultGeneratorName: archetype.name,
  };
}

// ── EXTREMES ──────────────────────────────────────────────────────────

export function buildExtremeItems(
  extremes: ReadonlyArray<ExtremePreset>,
): PresetItem[] {
  return extremes.map(makeExtremeItem);
}

function makeExtremeItem(extreme: ExtremePreset): PresetItem {
  const tempLabel = `${Math.round(extreme.tempMin)} / ${Math.round(extreme.tempMax)} °C`;
  const humidityMid = Math.round((extreme.humidityMin + extreme.humidityMax) / 2);
  // Extremy nepatří do archetypeToConfig — vyrobíme config inline.
  const toConfig = (): WeatherGeneratorConfig => extremeToConfig(extreme);
  return {
    id: `extreme:${extreme.id}`,
    category: 'extremes',
    displayName: extreme.name,
    subtitle: 'Reálný extrém',
    glyph: glyphForExtreme(extreme),
    description: extreme.description,
    metrics: {
      tempLabel,
      humidityLabel: `${humidityMid} %`,
    },
    sortKey: extreme.name,
    searchCorpus: `${extreme.name} ${extreme.description}`.toLowerCase(),
    toConfig,
    defaultGeneratorName: extreme.name,
  };
}

function glyphForExtreme(extreme: ExtremePreset): string {
  if (extreme.id === 'naica') return '💎';
  if (extreme.id === 'vostok' || extreme.id === 'dry-valleys') return '❄';
  if (extreme.id === 'death-valley') return '🔥';
  if (extreme.id === 'cherrapunji') return '🌧';
  if (extreme.id === 'mariana-trench') return '🌊';
  if (extreme.id === 'yellowstone') return '♨';
  return '⚡';
}

function extremeToConfig(extreme: ExtremePreset): WeatherGeneratorConfig {
  // Synthetic monthly temps — sinová křivka mezi tempMin a tempMax (peak v půlce roku).
  const mid = (extreme.tempMin + extreme.tempMax) / 2;
  const amp = (extreme.tempMax - extreme.tempMin) / 2;
  const monthlyTemps = Array.from({ length: 12 }, (_, i) => {
    const phase = ((i - 3) / 12) * 2 * Math.PI;
    return Math.round((mid + amp * Math.sin(phase)) * 10) / 10;
  });
  const stdDevAvg = averageStdDev(extreme.climateZone);
  const monthlyStdDev = Array.from({ length: 12 }, () => stdDevAvg);

  const weatherTypes: WeatherTypeEntry[] = [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 60,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'storm',
      label: 'Extrém',
      icon: 'wind',
      probability: 40,
      cloudRange: [3, 8],
      precipRange: [0, 50],
    },
  ];

  return {
    tempMin: Math.round(extreme.tempMin),
    tempMax: Math.round(extreme.tempMax),
    tempUnit: 'C',
    weatherTypes,
    windMin: 0,
    windMax: 60,
    windGustMultiplier: 1.8,
    pressureMin: 980,
    pressureMax: 1040,
    humidityMin: extreme.humidityMin,
    humidityMax: extreme.humidityMax,
    customFields: [
      {
        label: 'Hazard',
        possibleValues: ['výjimečný', 'lethal bez ochrany'],
        probability: 50,
      },
    ],
    monthlyTemps,
    monthlyStdDev,
    climateZone: extreme.climateZone,
  };
}

// ── COMBINED BUILDER ──────────────────────────────────────────────────

// ── Fantasy + Scifi category filters ──────────────────────────────────

const FANTASY_PREFIX_MAP: Record<string, string[]> = {
  'fantasy-literary': [
    'middle-earth-',
    'westeros-',
    'essos-',
    'faerun-',
    'witcher-',
    'tamriel-',
  ],
  'fantasy-mythological': ['myth-'],
  'fantasy-prehistoric': ['prehistoric-'],
  'fantasy-steampunk': ['steampunk-'],
  'fantasy-horror': ['horror-'],
  'fantasy-aerial': ['aerial-'],
  'fantasy-magical': ['magical-'],
};

const SCIFI_PREFIX_MAP: Record<string, string[]> = {
  'scifi-planetary': ['planet-'],
  'scifi-exoplanetary': ['exo-'],
  'scifi-cyberpunk': ['cyberpunk-'],
  'scifi-stations': ['station-'],
  'scifi-ship-interiors': [
    'ship-crew-',
    'ship-bridge',
    'ship-engine-',
    'ship-cargo-',
    'ship-airlock',
    'ship-eva-suit-',
    'ship-hydroponics',
    'ship-med-',
    'ship-cryo-bay',
    'ship-mess-',
  ],
  'scifi-ship-types': [
    'ship-generation-',
    'ship-mining-',
    'ship-military-',
    'ship-civilian-',
    'ship-exploration',
    'ship-cryo-haul',
  ],
  'scifi-eva': ['eva-'],
};

function filterArchetypesByPrefix(
  archetypes: ReadonlyArray<ArchetypePreset>,
  prefixes: string[],
): ArchetypePreset[] {
  return archetypes.filter((p) =>
    prefixes.some((pref) => p.id.startsWith(pref)),
  );
}

// ── CUSTOM PRESETS (9.4-dluh) ─────────────────────────────────────────

/** Builder pro custom svět-scoped presety. Dynamický (závisí na fetch). */
export function buildCustomPresetItems(
  presets: ReadonlyArray<CustomWeatherPreset>,
): PresetItem[] {
  return presets.map((p) => makeCustomPresetItem(p));
}

function makeCustomPresetItem(preset: CustomWeatherPreset): PresetItem {
  const config = preset.config;
  const tempLabel = `${Math.round(config.tempMin)} / ${Math.round(config.tempMax)} °${config.tempUnit ?? 'C'}`;
  const humidityMid =
    config.humidityMin !== undefined && config.humidityMax !== undefined
      ? Math.round((config.humidityMin + config.humidityMax) / 2)
      : null;
  const windMid =
    config.windMin !== undefined && config.windMax !== undefined
      ? Math.round((config.windMin + config.windMax) / 2)
      : null;
  const description =
    preset.description ??
    `Vlastní preset (vytvořen ${new Date(preset.createdAt).toLocaleDateString('cs-CZ')}, použit ${preset.usageCount}×).`;
  return {
    id: `custom:${preset.id}`,
    category: 'custom',
    displayName: preset.name,
    subtitle: `Vlastní preset · ${preset.usageCount}× použit`,
    glyph: preset.emoji ?? '⭐',
    description,
    metrics: {
      tempLabel,
      humidityLabel: humidityMid !== null ? `${humidityMid} %` : undefined,
      windLabel: windMid !== null ? `${windMid} km/h` : undefined,
    },
    // Sort: usageCount desc (nejvíc použité první), pak name. Padding pro stabilní string sort.
    sortKey: `${String(99999 - preset.usageCount).padStart(5, '0')}|${preset.name}`,
    searchCorpus: `${preset.name} ${preset.description ?? ''}`.toLowerCase(),
    toConfig: () => preset.config,
    defaultGeneratorName: preset.name,
  };
}

// ── COMBINED BUILDER ──────────────────────────────────────────────────

/**
 * Vrátí všechny presety napříč kategoriemi (pro fuzzy search).
 * `customPresets` (9.4-dluh) — optional per-world saved presety; pokud
 * předáno, přidá se před static array a fuzzy search je propustí.
 */
export function buildAllPresetItems(
  customPresets?: ReadonlyArray<CustomWeatherPreset>,
): PresetItem[] {
  const fantasyItems: PresetItem[] = [];
  for (const [category, prefixes] of Object.entries(FANTASY_PREFIX_MAP)) {
    fantasyItems.push(
      ...buildArchetypeItems(
        filterArchetypesByPrefix(ARCHETYPE_CATALOG.fantasy, prefixes),
        category as RealCategory,
      ),
    );
  }
  const scifiItems: PresetItem[] = [];
  for (const [category, prefixes] of Object.entries(SCIFI_PREFIX_MAP)) {
    scifiItems.push(
      ...buildArchetypeItems(
        filterArchetypesByPrefix(ARCHETYPE_CATALOG.scifi, prefixes),
        category as RealCategory,
      ),
    );
  }
  const customItems = customPresets ? buildCustomPresetItems(customPresets) : [];
  return [
    ...customItems,
    ...buildCountryItems(),
    ...buildArchetypeItems(ARCHETYPE_CATALOG.koppen, 'koppen'),
    ...buildArchetypeItems(ARCHETYPE_CATALOG.sea, 'sea'),
    ...buildExtremeItems(EXTREMES),
    ...fantasyItems,
    ...scifiItems,
  ];
}

/**
 * Vrátí presety jen pro vybranou kategorii (rychlejší než filter přes all).
 *
 * Pro `custom` kategorii vrací `customPresets` parameter (svět-scoped data
 * fetched async). Bez parametru → empty (caller musí dodat).
 */
export function buildItemsForCategory(
  category: RealCategory,
  customPresets?: ReadonlyArray<CustomWeatherPreset>,
): PresetItem[] {
  // Custom (9.4-dluh) — per-world saved presety
  if (category === 'custom') {
    return customPresets ? buildCustomPresetItems(customPresets) : [];
  }

  // Real-world (9.4-I)
  if (category === 'countries') return buildCountryItems();
  if (category === 'koppen')
    return buildArchetypeItems(ARCHETYPE_CATALOG.koppen, 'koppen');
  if (category === 'sea')
    return buildArchetypeItems(ARCHETYPE_CATALOG.sea, 'sea');
  if (category === 'extremes') return buildExtremeItems(EXTREMES);

  // Fantasy (9.4-II)
  if (category in FANTASY_PREFIX_MAP) {
    return buildArchetypeItems(
      filterArchetypesByPrefix(
        ARCHETYPE_CATALOG.fantasy,
        FANTASY_PREFIX_MAP[category],
      ),
      category,
    );
  }

  // Sci-fi (9.4-III)
  if (category in SCIFI_PREFIX_MAP) {
    return buildArchetypeItems(
      filterArchetypesByPrefix(
        ARCHETYPE_CATALOG.scifi,
        SCIFI_PREFIX_MAP[category],
      ),
      category,
    );
  }

  return [];
}
