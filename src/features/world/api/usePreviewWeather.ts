/**
 * 9.4-I — FE-side mock generátor pro trial preview wizard (spec §14.5).
 *
 * Žádné BE volání. Mirror BE generování:
 *  1. `generateTemperature` (Gaussian variance + extrémy).
 *  2. `transitionWeatherType` (Markov cold-start z `climateZone`).
 *  3. Wind/pressure/humidity = uniform v range z configu.
 *  4. Vyber `WeatherTypeEntry` matching `weatherType` → cloud/precip range.
 *
 * Deterministic — seed = `hashSeed(configId + monthIndex + day + extraSalt)`.
 * PJ vidí 3 stabilní rolly bez náhody mezi opakovaným otevřením modalu.
 *
 * „Extrém" slot (TrialMonth.extreme === true) vynutí heat_wave shift přes
 * pevný seed v anomálním pásmu (>2σ).
 */
import { useCallback } from 'react';
import {
  generateTemperature,
  hashSeed,
  mulberry32,
  transitionWeatherType,
  type WeatherType as SimWeatherType,
  type KoppenZone,
} from '@/features/world/lib/weatherSimulation';
import type {
  WeatherGeneratorConfig,
  WeatherResult,
  WeatherTypeEntry,
} from '@/shared/types';
import type { TrialMonth } from './useTrialMonths';

export interface PreviewWeatherOptions {
  /** Stabilní ID generátoru (configId nebo jiný hash zdroj). */
  configId?: string;
  /** Extra salt pro varianty (např. 0/1/2 pro „3 rolly"). */
  salt?: string;
}

const DEFAULT_DAY = 15;

/**
 * Pure preview funkce — bez React. Lze volat ze unit testu / mimo komponentu.
 */
export function previewWeather(
  config: WeatherGeneratorConfig,
  month: TrialMonth,
  options: PreviewWeatherOptions = {},
): WeatherResult {
  const { configId = 'preview', salt = '' } = options;
  const seedKey = `${configId}|${month.index}|${month.monthsTotal}|${DEFAULT_DAY}|${salt}`;
  const baseSeed = hashSeed(seedKey);
  const rng = mulberry32(baseSeed);

  const monthsTotal = month.monthsTotal || 12;
  const monthlyTemps =
    config.monthlyTemps && config.monthlyTemps.length === monthsTotal
      ? config.monthlyTemps
      : deriveMonthlyTemps(config, monthsTotal);

  // 1. Teplota — Gaussian variance, případně forced extreme
  let temperature: number;
  let isAnomaly: boolean;
  let anomalyType: 'heat_wave' | 'cold_snap' | 'severe_storm' | null;
  let expectedAvg: number | null;

  if (month.extreme) {
    // Vynucená anomálie pro „Extrém" slot — heat wave shift.
    const result = generateTemperature({
      monthIndex: month.index,
      day: DEFAULT_DAY,
      monthsTotal,
      monthlyTemps,
      monthlyStdDev: config.monthlyStdDev,
      defaultStdDev: 4,
      seed: baseSeed,
    });
    const stdDev = result.stdDevUsed;
    // Force ~3σ heat wave nad expectedAvg, deterministic
    temperature = Math.round((result.expectedAvg + 3 * stdDev) * 10) / 10;
    expectedAvg = result.expectedAvg;
    isAnomaly = true;
    anomalyType = 'heat_wave';
  } else {
    const result = generateTemperature({
      monthIndex: month.index,
      day: DEFAULT_DAY,
      monthsTotal,
      monthlyTemps,
      monthlyStdDev: config.monthlyStdDev,
      defaultStdDev: 4,
      seed: baseSeed,
    });
    temperature = result.temperature;
    expectedAvg = result.expectedAvg;
    isAnomaly = result.isAnomaly;
    anomalyType = result.anomalyType;
  }

  // 2. Weather type — Markov cold-start nebo weighted random z config
  const weatherType = pickWeatherType(config, rng);
  const entry = config.weatherTypes.find((w) => w.type === weatherType);

  // 3. Cloud / precip — z entry range (uniform)
  const cloudVal = entry ? randRange(entry.cloudRange, rng) : 4;
  const precipVal = entry ? randRange(entry.precipRange, rng) : 0;

  // 4. Wind
  const windSpeed = Math.round(
    config.windMin + rng() * Math.max(0, config.windMax - config.windMin),
  );
  const windGusts = Math.round(windSpeed * (config.windGustMultiplier || 1));

  // 5. Pressure (anomaly = trochu nižší tlak, jinak střed range)
  const pressureMid = (config.pressureMin + config.pressureMax) / 2;
  const pressureSpan = (config.pressureMax - config.pressureMin) / 2;
  const pressureValue = Math.round(
    pressureMid + (rng() * 2 - 1) * pressureSpan,
  );
  const pressureTrend = rng() < 0.5 ? 'stoupá' : 'klesá';

  // 6. Humidity
  const humidityValue = Math.round(
    config.humidityMin + rng() * Math.max(0, config.humidityMax - config.humidityMin),
  );

  // 7. Extras — pro každý custom field roll proti probability
  const extras = (config.customFields ?? [])
    .filter((cf) => rng() < (cf.probability ?? 0))
    .map((cf) => {
      const idx = Math.floor(rng() * cf.possibleValues.length);
      return {
        label: cf.label,
        value: cf.possibleValues[idx] ?? '',
        description: undefined,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    isManual: false,
    temperature,
    tempUnit: config.tempUnit ?? 'C',
    weatherType,
    weatherIcon: entry?.icon ?? '☀️',
    cloudiness: {
      value: `${Math.round(cloudVal)}/8`,
      description: describeCloud(cloudVal),
    },
    precipitation: {
      value: `${precipVal.toFixed(1)} mm`,
      description: describePrecip(precipVal),
    },
    wind: { speed: windSpeed, gusts: windGusts, unit: 'kmh' },
    pressure: { value: pressureValue, trend: pressureTrend },
    humidity: humidityValue,
    extras,
    narrativeText: null,
    isAnomaly,
    anomalyType,
    expectedAvg,
    calendarMonth: {
      name: month.name,
      index: month.index,
      total: monthsTotal,
    },
  };
}

/**
 * React hook wrapper — memoizovaný `previewWeather` (stable reference).
 */
export function usePreviewWeather() {
  const preview = useCallback(
    (
      config: WeatherGeneratorConfig,
      month: TrialMonth,
      options?: PreviewWeatherOptions,
    ) => previewWeather(config, month, options),
    [],
  );
  return { previewWeather: preview };
}

// ── Internals ──────────────────────────────────────────────────────────

function randRange(range: readonly [number, number], rng: () => number): number {
  const [a, b] = range;
  if (a === b) return a;
  return a + rng() * (b - a);
}

function deriveMonthlyTemps(
  config: WeatherGeneratorConfig,
  monthsTotal: number,
): number[] {
  // Fallback — sin-wave mezi tempMin / tempMax, peak v polovině roku.
  const mid = (config.tempMin + config.tempMax) / 2;
  const amp = (config.tempMax - config.tempMin) / 2;
  return Array.from({ length: monthsTotal }, (_, i) => {
    const phase = ((i - monthsTotal / 4) / monthsTotal) * 2 * Math.PI;
    return Math.round((mid + amp * Math.sin(phase)) * 10) / 10;
  });
}

function pickWeatherType(
  config: WeatherGeneratorConfig,
  rng: () => number,
): SimWeatherType {
  // Pokud máme `climateZone` → Markov cold-start (mirror BE generování).
  if (config.climateZone) {
    const zone = config.climateZone as KoppenZone;
    return transitionWeatherType(null, zone, rng);
  }
  // Jinak weighted random z `weatherTypes` (entry-level probability).
  const total = config.weatherTypes.reduce(
    (sum, w) => sum + (w.probability || 0),
    0,
  );
  if (total <= 0) return 'clear';
  const r = rng() * total;
  let cum = 0;
  for (const w of config.weatherTypes) {
    cum += w.probability || 0;
    if (r < cum) return narrowSim(w);
  }
  return narrowSim(config.weatherTypes[0]);
}

function narrowSim(entry: WeatherTypeEntry): SimWeatherType {
  // `custom` není v sim modulu — fallback clear.
  if (entry.type === 'custom') return 'clear';
  return entry.type;
}

function describeCloud(oktas: number): string {
  if (oktas < 2) return 'jasno';
  if (oktas < 4) return 'polojasno';
  if (oktas < 7) return 'oblačno';
  return 'zataženo';
}

function describePrecip(mm: number): string {
  if (mm < 0.1) return 'beze srážek';
  if (mm < 2) return 'slabé srážky';
  if (mm < 10) return 'mírné srážky';
  return 'silné srážky';
}
