import { KOPPEN_STDDEV } from '@/features/world/lib/weatherSimulation';
import type { ArchetypePreset } from '../archetypes/types';

/**
 * 9.4-I — Mapper: ArchetypePreset → WeatherGeneratorConfig (BE shape).
 *
 * Triviální 1:1 kopie polí. Std dev fallback z `KOPPEN_STDDEV` když preset
 * nedefinuje vlastní `monthlyStdDev`.
 *
 * Deterministický (žádné Math.random) — důležité pro reprodukovatelnost.
 *
 * Mirror struktury z `backend/src/modules/world-weather/interfaces/
 * weather-generator.interface.ts` — pokud BE rozšíří `WeatherGeneratorConfig`,
 * je třeba sem doplnit nová pole.
 */
export interface WeatherGeneratorConfigShape {
  tempMin: number;
  tempMax: number;
  tempUnit: 'C' | 'F';
  weatherTypes: Array<{
    type: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'custom';
    label: string;
    icon: string;
    probability: number;
    cloudRange: [number, number];
    precipRange: [number, number];
  }>;
  windMin: number;
  windMax: number;
  windGustMultiplier: number;
  pressureMin: number;
  pressureMax: number;
  humidityMin: number;
  humidityMax: number;
  customFields: Array<{
    label: string;
    possibleValues: string[];
    probability: number;
  }>;
  monthlyTemps?: number[];
  monthlyStdDev?: number[];
  climateZone?:
    | 'Af'
    | 'Am'
    | 'Aw'
    | 'BWh'
    | 'BWk'
    | 'BSh'
    | 'BSk'
    | 'Csa'
    | 'Csb'
    | 'Cfa'
    | 'Cfb'
    | 'Dfa'
    | 'Dfb'
    | 'Dfc'
    | 'ET'
    | 'EF'
    | 'EXTRATERRESTRIAL'
    | 'CONTROLLED';
}

export function archetypeToConfig(
  archetype: ArchetypePreset,
): WeatherGeneratorConfigShape {
  const monthlyTemps = [...archetype.monthlyTemps];
  const monthlyStdDev = archetype.monthlyStdDev
    ? [...archetype.monthlyStdDev]
    : [...KOPPEN_STDDEV[archetype.climateZone].monthly];

  // Odvození tempMin/tempMax z monthlyTemps + std dev (± 2σ pro denní rozpětí).
  const tempMinBase = Math.min(...monthlyTemps);
  const tempMaxBase = Math.max(...monthlyTemps);
  const maxStdDev = Math.max(...monthlyStdDev);
  const tempMin = Math.round(tempMinBase - 2 * maxStdDev);
  const tempMax = Math.round(tempMaxBase + 2 * maxStdDev);

  return {
    tempMin,
    tempMax,
    tempUnit: 'C',
    weatherTypes: archetype.defaultWeatherTypes.map((entry) => ({
      type: entry.type,
      label: entry.label,
      icon: entry.icon,
      probability: entry.probability,
      cloudRange: [entry.cloudRange[0], entry.cloudRange[1]],
      precipRange: [entry.precipRange[0], entry.precipRange[1]],
    })),
    windMin: archetype.defaultWindRange[0],
    windMax: archetype.defaultWindRange[1],
    windGustMultiplier: archetype.defaultWindGustMultiplier,
    pressureMin: archetype.defaultPressureRange[0],
    pressureMax: archetype.defaultPressureRange[1],
    humidityMin: archetype.defaultHumidityRange[0],
    humidityMax: archetype.defaultHumidityRange[1],
    customFields: (archetype.defaultCustomFields ?? []).map((f) => ({
      label: f.label,
      possibleValues: [...f.possibleValues],
      probability: f.probability,
    })),
    monthlyTemps,
    monthlyStdDev,
    climateZone: archetype.climateZone,
  };
}
