import type { KoppenZone } from '@/features/world/lib/weatherSimulation';

/**
 * 9.4-I — Archetype preset (klimatický nebo mořský).
 *
 * Slouží jako one-click šablona pro PJ. Mapper (`archetypeToConfig.ts`)
 * převádí na `WeatherGeneratorConfig` pro BE.
 *
 * Pravidlo: data-only — žádné Math.random ani side-effects.
 */
export interface ArchetypePreset {
  /** Stabilní identifikátor (kebab-case), např. 'cfb-oceanic'. */
  id: string;
  /** UI grouping. */
  category: 'koppen' | 'sea' | 'fantasy' | 'scifi';
  /** Český název pro UI (např. „Mírné oceánské"). */
  name: string;
  /** Sub-text v UI (real-world analog, např. „Jako Dublin nebo Londýn"). */
  subtitle: string;
  /** Krátký popis pro náhled karty (1 věta). */
  description: string;
  /** Emoji ikona pro card (volitelné). */
  emoji?: string;
  /** Köppen kód — řídí variance + Markov persistence. */
  climateZone: KoppenZone;
  /** 12 měsíčních referenčních průměrů (Jan..Dec). */
  monthlyTemps: readonly number[];
  /** Volitelný override std dev (KOPPEN_STDDEV je fallback). */
  monthlyStdDev?: readonly number[];
  /** Defaultní mix typů počasí — probability sum = 100. */
  defaultWeatherTypes: ReadonlyArray<{
    type: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
    label: string;
    icon: string;
    probability: number;
    cloudRange: readonly [number, number];
    precipRange: readonly [number, number];
  }>;
  /** [min, max] km/h. */
  defaultWindRange: readonly [number, number];
  /** Násobič pro nárazové gusty (>=1). */
  defaultWindGustMultiplier: number;
  /** [min, max] hPa. */
  defaultPressureRange: readonly [number, number];
  /** [min, max] %. */
  defaultHumidityRange: readonly [number, number];
  /** Hazardy typické pro zónu (mlha, ledovka, prachová bouře, …). */
  defaultCustomFields?: ReadonlyArray<{
    label: string;
    possibleValues: readonly string[];
    probability: number;
  }>;
  /**
   * Confidence úroveň (viz spec §2.0).
   * - DOCUMENTED: měřená data (Köppen, NOAA, WMO).
   * - MEASURED: alias pro reálná pozorování (planety, atmosféra).
   * - ANALOGY: fiktivní lokace mapovaná na reálný klima-analog.
   * - INFERRED: odvozeno z autorského popisu, ne přímo dokumentováno.
   * - FICTIONAL: čistě fantazijní, žádný real-world podklad.
   */
  sourceLevel:
    | 'DOCUMENTED'
    | 'MEASURED'
    | 'ANALOGY'
    | 'INFERRED'
    | 'FICTIONAL';
  /** Primary source citation. */
  sourceCitation: string;
}
