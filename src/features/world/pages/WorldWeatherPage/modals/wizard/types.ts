/**
 * 9.4-I — sdílené typy pro wizard tvorby generátoru počasí.
 */
import type { ArchetypePreset } from '../../data/archetypes/types';
import type { CityData, CountryData } from '../../data/realWorld/types';
import type { ExtremePreset } from '../../data/realWorld/extremes';
import type { WeatherGeneratorConfig } from '@/shared/types';

/** Realm = první stadium wizardu — zdroj presetů. */
export type Realm = 'real' | 'fantasy' | 'scifi' | 'custom' | 'set';

/** Kategorie napříč všemi realms — druhé stadium wizardu. */
export type RealCategory =
  // real-world
  | 'countries'
  | 'koppen'
  | 'sea'
  | 'extremes'
  // fantasy (9.4-II)
  | 'fantasy-literary'
  | 'fantasy-mythological'
  | 'fantasy-prehistoric'
  | 'fantasy-steampunk'
  | 'fantasy-horror'
  | 'fantasy-aerial'
  | 'fantasy-magical'
  // scifi (9.4-III)
  | 'scifi-planetary'
  | 'scifi-exoplanetary'
  | 'scifi-cyberpunk'
  | 'scifi-stations'
  | 'scifi-ship-interiors'
  | 'scifi-ship-types'
  | 'scifi-eva'
  // custom (9.4-dluh) — per-world saved presets
  | 'custom';

/** Stage state machine. */
export type Stage = 'crossroads' | 'categories' | 'preset-detail';

/**
 * Univerzální „preset item" pro stage 3 list — zaobaluje 3 typy dat
 * (country city, archetype, extreme) do jednoho UI shape.
 */
export interface PresetItem {
  /** Stabilní ID pro localStorage recent + selected guard. */
  id: string;
  /** Kategorie pro routing (countries/koppen/sea/extremes). */
  category: RealCategory;
  /** Display label v listu (např. „Česko — Praha"). */
  displayName: string;
  /** Subtitle (např. „Mírné kontinentální · stř. Evropa"). */
  subtitle: string;
  /** Glyph (emoji) pro card. */
  glyph: string;
  /** Krátký popisek (1 věta) pro detail pane. */
  description: string;
  /** Mini-metrics pro list (tempRange, humidityHint, windHint). */
  metrics: {
    tempLabel: string;
    humidityLabel?: string;
    windLabel?: string;
  };
  /** Sortovací klíč. */
  sortKey: string;
  /** Fuzzy search korpus — joined string všech searchable polí. */
  searchCorpus: string;
  /** Builder pro výsledný config (lazy, počítá se až při „Použít"). */
  toConfig: () => WeatherGeneratorConfig;
  /** Pro country items — defaultní jméno generátoru („Praha — Česko"). */
  defaultGeneratorName: string;
}

/** Vstup pro builder — vytvořeno per kategorie. */
export interface PresetItemBuilderArgs {
  countries?: ReadonlyArray<{ continent: string; country: CountryData; city?: CityData }>;
  archetypes?: ReadonlyArray<ArchetypePreset>;
  extremes?: ReadonlyArray<ExtremePreset>;
}
