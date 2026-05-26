import type { ArchetypePreset } from './types';

/**
 * 9.4-I — Mořská prostředí (6 archetypů).
 *
 * sourceLevel: DOCUMENTED
 * source: WMO Sea State Code (WMO-No. 471), NOAA NDBC Buoy Network 1990-2020.
 *
 * Teploty jsou typické sea-surface temperatures (SST) pro reprezentativní
 * oblasti. Hazardy reflektují Beaufort + Sea State scales.
 */

const SEAS_CITATION =
  'WMO Sea State Code (WMO-No. 471), NOAA NDBC Buoy Network 1990-2020';

/**
 * Otevřený oceán v mírném pásmu (severní Atlantik / severní Pacifik).
 * Stabilní mořský klimat, časté mlhy a vlnobití.
 */
const SEA_OPEN_OCEAN: ArchetypePreset = {
  id: 'sea-open-ocean',
  category: 'sea',
  name: 'Otevřený oceán (mírné pásmo)',
  subtitle: 'Jako severní Atlantik',
  description:
    'Stabilní mořské teploty, časté mlhy, dlouhé vlny a větrné fronty.',
  emoji: '🌊',
  climateZone: 'Cfb',
  monthlyTemps: [8, 8, 9, 10, 12, 14, 16, 16, 15, 13, 11, 9],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 25,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 35,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 18,
      cloudRange: [5, 8],
      precipRange: [1, 15],
    },
    {
      type: 'storm',
      label: 'Bouře',
      icon: 'cloud-lightning',
      probability: 5,
      cloudRange: [6, 8],
      precipRange: [10, 40],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 17,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [5, 55],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [980, 1030],
  defaultHumidityRange: [70, 95],
  defaultCustomFields: [
    {
      label: 'Vlnobití (Beaufort)',
      possibleValues: ['0-2 klidné', '3-4 mírné', '5-6 čerstvé', '7-9 silné'],
      probability: 70,
    },
    {
      label: 'Mlha',
      possibleValues: ['žádná', 'lokální', 'hustá'],
      probability: 35,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SEAS_CITATION,
};

/**
 * Korálový atol v tropech (Maledivy / Polynésie).
 * Stabilní 27-28°C, tropické bouře v sezoně.
 */
const SEA_CORAL_ATOLL: ArchetypePreset = {
  id: 'sea-coral-atoll',
  category: 'sea',
  name: 'Korálový atol (tropický)',
  subtitle: 'Jako Maledivy nebo Polynésie',
  description:
    'Stabilní tropické moře 27-28°C, občasné tropické bouře a tajfuny.',
  emoji: '🏝️',
  climateZone: 'Af',
  monthlyTemps: [27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 27],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 45,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 30,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 15,
      cloudRange: [5, 8],
      precipRange: [2, 20],
    },
    {
      type: 'storm',
      label: 'Tropická bouře',
      icon: 'cloud-lightning',
      probability: 8,
      cloudRange: [6, 8],
      precipRange: [15, 60],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 2,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [5, 40],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [1005, 1018],
  defaultHumidityRange: [75, 95],
  defaultCustomFields: [
    {
      label: 'Tropická bouře',
      possibleValues: ['žádná', 'tropická bouře', 'cyklon'],
      probability: 10,
    },
    {
      label: 'Vlnobití (Beaufort)',
      possibleValues: ['0-2 klidné', '3-4 mírné', '5-6 čerstvé'],
      probability: 50,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SEAS_CITATION,
};

/**
 * Severní moře (drsné, krátké vlny, časté vichry).
 * Mělké moře, výrazné větrné fronty z Atlantiku.
 */
const SEA_NORTH_SEA: ArchetypePreset = {
  id: 'sea-north-sea',
  category: 'sea',
  name: 'Severní moře (drsné)',
  subtitle: 'Jako Severní moře nebo Hebridy',
  description:
    'Mělké drsné moře, časté vichry, krátké strmé vlny a vytrvalá mlha.',
  emoji: '⚓',
  climateZone: 'Cfb',
  monthlyTemps: [4, 4, 5, 7, 10, 13, 15, 15, 13, 10, 7, 5],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 15,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 40,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 22,
      cloudRange: [5, 8],
      precipRange: [2, 20],
    },
    {
      type: 'storm',
      label: 'Vichr',
      icon: 'cloud-lightning',
      probability: 10,
      cloudRange: [6, 8],
      precipRange: [10, 35],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 13,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [10, 70],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [970, 1025],
  defaultHumidityRange: [75, 95],
  defaultCustomFields: [
    {
      label: 'Vlnobití (Beaufort)',
      possibleValues: [
        '3-4 mírné',
        '5-6 čerstvé',
        '7-9 silné',
        '10+ vichřice',
      ],
      probability: 80,
    },
    {
      label: 'Mlha',
      possibleValues: ['žádná', 'lokální', 'hustá'],
      probability: 40,
    },
    {
      label: 'Vichr',
      possibleValues: ['žádný', 'silný', 'orkán'],
      probability: 25,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SEAS_CITATION,
};

/**
 * Karibské vody (warm, hurikány Jun-Nov).
 * Teplé moře, hurikánová sezona, jinak stabilně příjemné.
 */
const SEA_CARIBBEAN: ArchetypePreset = {
  id: 'sea-caribbean',
  category: 'sea',
  name: 'Karibské vody',
  subtitle: 'Jako Karibik nebo Bahamy',
  description:
    'Teplé moře, sezona hurikánů od června do listopadu, jinak stabilně příjemné počasí.',
  emoji: '🏖️',
  climateZone: 'Am',
  monthlyTemps: [25, 25, 26, 26, 27, 27, 28, 28, 28, 27, 26, 25],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 40,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 28,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 18,
      cloudRange: [5, 8],
      precipRange: [2, 25],
    },
    {
      type: 'storm',
      label: 'Hurikán',
      icon: 'cloud-lightning',
      probability: 10,
      cloudRange: [7, 8],
      precipRange: [20, 80],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 4,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [5, 60],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [970, 1020],
  defaultHumidityRange: [70, 95],
  defaultCustomFields: [
    {
      label: 'Hurikán',
      possibleValues: ['žádný', 'tropická bouře', 'kategorie 1-2', 'kategorie 3+'],
      probability: 12,
    },
    {
      label: 'Vlnobití (Beaufort)',
      possibleValues: ['0-2 klidné', '3-4 mírné', '5-6 čerstvé', '7+ silné'],
      probability: 60,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SEAS_CITATION,
};

/**
 * Subarktické moře (Barentsovo / Beringovo).
 * Studená voda, polární led, blizzardy.
 */
const SEA_SUBARCTIC: ArchetypePreset = {
  id: 'sea-subarctic',
  category: 'sea',
  name: 'Subarktické moře',
  subtitle: 'Jako Barentsovo nebo Beringovo moře',
  description:
    'Studené moře blízko polárního kruhu, sezónní led, blizzardy a polární mlha.',
  emoji: '🥶',
  climateZone: 'ET',
  monthlyTemps: [-2, -2, -1, 1, 4, 8, 11, 11, 9, 5, 2, 0],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 20,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 35,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 10,
      cloudRange: [5, 8],
      precipRange: [1, 12],
    },
    {
      type: 'storm',
      label: 'Vichr',
      icon: 'cloud-lightning',
      probability: 8,
      cloudRange: [6, 8],
      precipRange: [5, 25],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 17,
      cloudRange: [5, 8],
      precipRange: [1, 18],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 10,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [5, 65],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [970, 1030],
  defaultHumidityRange: [70, 95],
  defaultCustomFields: [
    {
      label: 'Mořský led',
      possibleValues: ['žádný', 'roztroušený', 'pevný'],
      probability: 50,
    },
    {
      label: 'Blizzard',
      possibleValues: ['žádný', 'mírný', 'silný'],
      probability: 20,
    },
    {
      label: 'Polární záře',
      possibleValues: ['neviditelná', 'viditelná'],
      probability: 25,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SEAS_CITATION,
};

/**
 * Hluboké moře (Subnautica-like). climateZone CONTROLLED — žádný roční cyklus,
 * stabilní 4°C deep-sea voda, extrémní tlak místo počasí.
 */
const SEA_DEEP_OCEAN: ArchetypePreset = {
  id: 'sea-deep-ocean',
  category: 'sea',
  name: 'Hluboké moře',
  subtitle: 'Jako Mariana Trench nebo abysální zóna',
  description:
    'Konstantní 4°C ve velkých hloubkách, žádné srážky, extrémní tlak a věčná tma.',
  emoji: '🐙',
  climateZone: 'CONTROLLED',
  monthlyTemps: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Klid',
      icon: 'circle',
      probability: 70,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Zákal (sediment)',
      icon: 'cloud',
      probability: 18,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'storm',
      label: 'Hlubinný proud',
      icon: 'wind',
      probability: 7,
      cloudRange: [4, 8],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'Tma (částice)',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [4, 7],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 10],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [50000, 110000],
  defaultHumidityRange: [100, 100],
  defaultCustomFields: [
    {
      label: 'Tlak',
      possibleValues: ['vysoký (500 bar)', 'extrémní (1000 bar)', 'kritický (1100 bar)'],
      probability: 100,
    },
    {
      label: 'Bioluminiscence',
      possibleValues: ['žádná', 'slabá', 'silná'],
      probability: 40,
    },
    {
      label: 'Hlubinný proud',
      possibleValues: ['klidný', 'mírný', 'silný'],
      probability: 25,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SEAS_CITATION,
};

export const SEA_ARCHETYPES: readonly ArchetypePreset[] = [
  SEA_OPEN_OCEAN,
  SEA_CORAL_ATOLL,
  SEA_NORTH_SEA,
  SEA_CARIBBEAN,
  SEA_SUBARCTIC,
  SEA_DEEP_OCEAN,
] as const;
