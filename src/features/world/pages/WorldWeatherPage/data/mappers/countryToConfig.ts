import {
  KOPPEN_STDDEV,
  type KoppenZone,
} from '@/features/world/lib/weatherSimulation';
import { inferKoppenZone } from './inferKoppenZone';
import type { WeatherGeneratorConfigShape } from './archetypeToConfig';

/**
 * 9.4-I — Real-world katalog typy.
 *
 * Sdíleno s `data/realWorld/` modulem, který paralelně vyrábí jiný agent.
 * Definováno tady abychom mohli mapovat a testovat nezávisle.
 */
export interface CityData {
  name: string;
  temps?: readonly number[];
}

export interface CountryData {
  name: string;
  temps: readonly number[];
  cities?: ReadonlyArray<string | CityData>;
}

/**
 * Default weather types per zóna — používáno když country nemá vlastní override.
 * Probability sum = 100. Hodnoty kopírují per-zone defaulty z archetypů.
 */
const WEATHER_TYPES_FOR_ZONE: Record<
  KoppenZone,
  WeatherGeneratorConfigShape['weatherTypes']
> = {
  Af: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 15, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 40, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 30, cloudRange: [5, 8], precipRange: [2, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 13, cloudRange: [6, 8], precipRange: [10, 40] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 2, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Am: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 25, cloudRange: [5, 8], precipRange: [3, 30] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 18, cloudRange: [7, 8], precipRange: [15, 60] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 2, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Aw: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 40, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 18, cloudRange: [5, 8], precipRange: [2, 20] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 10, cloudRange: [6, 8], precipRange: [10, 40] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 2, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  BWh: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 80, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 12, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 3, cloudRange: [4, 7], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [5, 8], precipRange: [5, 30] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 1, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  BWk: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 65, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 18, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 5, cloudRange: [4, 7], precipRange: [1, 10] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [5, 8], precipRange: [5, 25] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 8, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 1, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  BSh: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 65, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 20, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 10, cloudRange: [4, 7], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 2, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  BSk: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 45, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 8, cloudRange: [4, 7], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 12, cloudRange: [5, 8], precipRange: [1, 20] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 2, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  Csa: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 50, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 25, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 15, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 5, cloudRange: [6, 8], precipRange: [10, 35] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 5, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Csb: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 40, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 18, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [6, 8], precipRange: [10, 30] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Cfa: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 22, cloudRange: [5, 8], precipRange: [2, 25] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 7, cloudRange: [6, 8], precipRange: [10, 50] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 3, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 3, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Cfb: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 40, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 22, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [10, 30] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 2, cloudRange: [5, 8], precipRange: [1, 10] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Dfa: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 35, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 15, cloudRange: [5, 8], precipRange: [1, 20] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 7, cloudRange: [6, 8], precipRange: [10, 50] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 10, cloudRange: [5, 8], precipRange: [1, 20] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 3, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Dfb: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 18, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 5, cloudRange: [6, 8], precipRange: [10, 40] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 8, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 4, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  Dfc: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 10, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 22, cloudRange: [5, 8], precipRange: [1, 20] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 5, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  ET: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 8, cloudRange: [5, 8], precipRange: [1, 10] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 2, cloudRange: [6, 8], precipRange: [5, 20] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 22, cloudRange: [5, 8], precipRange: [1, 20] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  EF: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 25, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'storm', label: 'Vichřice', icon: 'cloud-lightning', probability: 5, cloudRange: [6, 8], precipRange: [1, 10] },
    { type: 'fog', label: 'Ledová mlha', icon: 'cloud-fog', probability: 5, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  EXTRATERRESTRIAL: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 80, cloudRange: [0, 0], precipRange: [0, 0] },
    { type: 'storm', label: 'Prachová bouře', icon: 'wind', probability: 20, cloudRange: [3, 8], precipRange: [0, 0] },
  ],
  CONTROLLED: [
    { type: 'clear', label: 'Stabilně', icon: 'check', probability: 95, cloudRange: [0, 0], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Filtrované', icon: 'cloud', probability: 5, cloudRange: [1, 3], precipRange: [0, 0] },
  ],
};

/**
 * Hazardy typické pro Köppen zónu (mlha, ledovka, prachová bouře, …).
 */
const HAZARD_FIELDS_FOR_ZONE: Record<
  KoppenZone,
  WeatherGeneratorConfigShape['customFields']
> = {
  Af: [{ label: 'Dusno', possibleValues: ['mírné', 'silné'], probability: 60 }],
  Am: [{ label: 'Monzun', possibleValues: ['slabý', 'silný'], probability: 30 }],
  Aw: [{ label: 'Prach v ovzduší', possibleValues: ['nízký', 'střední'], probability: 25 }],
  BWh: [{ label: 'Prachová bouře', possibleValues: ['mírná', 'silná'], probability: 15 }],
  BWk: [{ label: 'Prachová bouře', possibleValues: ['mírná', 'silná'], probability: 15 }],
  BSh: [{ label: 'Horký vítr', possibleValues: ['mírný', 'silný'], probability: 20 }],
  BSk: [{ label: 'Sněhová bouře', possibleValues: ['mírná', 'silná'], probability: 15 }],
  Csa: [{ label: 'Sirocco', possibleValues: ['mírný', 'silný'], probability: 15 }],
  Csb: [{ label: 'Pobřežní mlha', possibleValues: ['mírná', 'hustá'], probability: 25 }],
  Cfa: [{ label: 'Tropická bouře', possibleValues: ['žádná', 'tropická bouře'], probability: 8 }],
  Cfb: [
    { label: 'Atlantická bouře', possibleValues: ['žádná', 'silný vítr'], probability: 15 },
    { label: 'Ledovka', possibleValues: ['žádná', 'mírná'], probability: 5 },
  ],
  Dfa: [
    { label: 'Blizzard', possibleValues: ['žádný', 'silný'], probability: 10 },
    { label: 'Tornádo', possibleValues: ['žádné', 'pozorováno'], probability: 3 },
  ],
  Dfb: [
    { label: 'Ledovka', possibleValues: ['žádná', 'silná'], probability: 12 },
    { label: 'Sněhové jazyky', possibleValues: ['žádné', 'rozsáhlé'], probability: 8 },
  ],
  Dfc: [
    { label: 'Polární záře', possibleValues: ['neviditelná', 'silná'], probability: 20 },
    { label: 'Sněhová bouře', possibleValues: ['žádná', 'silná'], probability: 15 },
  ],
  ET: [
    { label: 'Polární záře', possibleValues: ['neviditelná', 'silná'], probability: 25 },
    { label: 'Blizzard', possibleValues: ['žádný', 'silný'], probability: 18 },
  ],
  EF: [
    { label: 'Katabatický vítr', possibleValues: ['mírný', 'extrémní'], probability: 40 },
    { label: 'Whiteout', possibleValues: ['žádný', 'úplný'], probability: 20 },
  ],
  EXTRATERRESTRIAL: [{ label: 'Radiace', possibleValues: ['nízká', 'vysoká'], probability: 80 }],
  CONTROLLED: [{ label: 'HVAC odchylka', possibleValues: ['žádná', 'malá'], probability: 5 }],
};

/**
 * 9.4-I — Mapper: CountryData (+ volitelně CityData) → WeatherGeneratorConfig.
 *
 * Deterministický — stejný vstup vrací stejný output.
 *
 * Postup:
 * 1. monthly temps = city.temps ?? country.temps
 * 2. inferKoppenZone → climateZone
 * 3. monthlyStdDev fallback z KOPPEN_STDDEV[zone]
 * 4. weatherTypes + customFields per-zone defaults
 * 5. tempMin/tempMax odvozené z monthlyTemps ± 2σ
 *
 * Pokud bude potřeba přesnější — country může přidat vlastní override pole.
 */
export function countryToConfig(
  country: CountryData,
  city?: CityData,
): WeatherGeneratorConfigShape {
  const monthlyTemps = [...(city?.temps ?? country.temps)];
  const climateZone = inferKoppenZone(monthlyTemps);
  const monthlyStdDev = [...KOPPEN_STDDEV[climateZone].monthly];

  const tempMinBase = Math.min(...monthlyTemps);
  const tempMaxBase = Math.max(...monthlyTemps);
  const maxStdDev = Math.max(...monthlyStdDev);
  const tempMin = Math.round(tempMinBase - 2 * maxStdDev);
  const tempMax = Math.round(tempMaxBase + 2 * maxStdDev);

  return {
    tempMin,
    tempMax,
    tempUnit: 'C',
    weatherTypes: WEATHER_TYPES_FOR_ZONE[climateZone].map((t) => ({
      ...t,
      cloudRange: [t.cloudRange[0], t.cloudRange[1]],
      precipRange: [t.precipRange[0], t.precipRange[1]],
    })),
    windMin: 0,
    windMax: 40,
    windGustMultiplier: 1.6,
    pressureMin: 990,
    pressureMax: 1030,
    humidityMin: 30,
    humidityMax: 95,
    customFields: HAZARD_FIELDS_FOR_ZONE[climateZone].map((f) => ({
      ...f,
      possibleValues: [...f.possibleValues],
    })),
    monthlyTemps,
    monthlyStdDev,
    climateZone,
  };
}
