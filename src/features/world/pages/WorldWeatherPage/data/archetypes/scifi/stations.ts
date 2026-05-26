import type { ArchetypePreset } from '../types';

/**
 * 9.4-III — Sci-fi: vesmírné stanice (5 presetů).
 *
 * sourceLevel: MEASURED (ISS, Mir, Skylab — historická in-flight data) +
 *              DOCUMENTED (O'Neill cylinder, Stanford Torus — teoretické
 *              koncepty publikované v peer-review studiích).
 *
 * Všechny stanice climateZone CONTROLLED — řízené HVAC udržuje stabilní
 * teplotu a tlak. Hazardy: mikrogravitace, CO₂ buildup, rotation failure
 * (pro umělou gravitaci přes rotaci).
 *
 * Pravidlo: data-only, žádné Math.random.
 */

const NASA_STD_3001 =
  'NASA-STD-3001 Human Systems Integration Standards Vol 1+2';
const MIR_CITATION = 'RKK Energia Mir Space Station documentation 1986-2001';
const SKYLAB_CITATION =
  'NASA SP-4011 Skylab: A Chronology + Skylab Earth Resources Experiment Package';
const ONEILL_CITATION =
  "O'Neill G.K. 1974, The Colonization of Space, Physics Today 27(9):32 + NASA Ames Summer Study 1975";
const STANFORD_TORUS_CITATION =
  'NASA Ames Summer Study 1975, Space Settlements: A Design Study (NASA SP-413)';

/** Společné pro CONTROLLED prostředí — 100% clear. */
const CLEAR_NOMINAL = [
  {
    type: 'clear' as const,
    label: 'Nominal',
    icon: 'sun',
    probability: 100,
    cloudRange: [0, 0] as const,
    precipRange: [0, 0] as const,
  },
];

/** ISS — International Space Station. */
const STATION_ISS: ArchetypePreset = {
  id: 'station-iss',
  category: 'scifi',
  name: 'ISS',
  subtitle: 'International Space Station',
  description:
    'Reálná orbitální stanice na LEO, 22°C nominální (18-27°C rozsah), mikrogravitace, tlak 101.3 kPa, CO₂ pod 0.5%.',
  emoji: '🛰️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [40, 60],
  defaultCustomFields: [
    {
      label: 'Gravitace',
      possibleValues: ['mikrogravitace (0g)'],
      probability: 100,
    },
    {
      label: 'CO₂ úroveň',
      possibleValues: ['<0.3%', '0.3-0.5%', '>0.5% (alarm)'],
      probability: 100,
    },
    {
      label: 'HVAC',
      possibleValues: ['nominal', 'údržba', 'critical failure'],
      probability: 5,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NASA_STD_3001,
};

/** Mir — sovětská stanice 1986-2001. */
const STATION_MIR: ArchetypePreset = {
  id: 'station-mir',
  category: 'scifi',
  name: 'Mir',
  subtitle: 'Sovětská stanice 1986-2001',
  description:
    'Historická orbitální stanice — 23°C (18-28°C), vyšší vlhkost (40-70%), modulární konstrukce, plíseň v pozdější éře.',
  emoji: '☭',
  climateZone: 'CONTROLLED',
  monthlyTemps: [23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1000, 1015],
  defaultHumidityRange: [40, 70],
  defaultCustomFields: [
    {
      label: 'Gravitace',
      possibleValues: ['mikrogravitace (0g)'],
      probability: 100,
    },
    {
      label: 'Vlhkost (riziko plísně)',
      possibleValues: ['nízká', 'střední', 'vysoká'],
      probability: 70,
    },
    {
      label: 'Modulární stav',
      possibleValues: ['nominal', 'únik', 'critical'],
      probability: 10,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: MIR_CITATION,
};

/** Skylab — USA 1973-79. */
const STATION_SKYLAB: ArchetypePreset = {
  id: 'station-skylab',
  category: 'scifi',
  name: 'Skylab',
  subtitle: 'USA stanice 1973-1979',
  description:
    'První americká orbitální stanice — 25°C (21-29°C), Apollo-derived ECLSS, větší obytný prostor než ISS.',
  emoji: '🚀',
  climateZone: 'CONTROLLED',
  monthlyTemps: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [340, 350],
  defaultHumidityRange: [35, 55],
  defaultCustomFields: [
    {
      label: 'Gravitace',
      possibleValues: ['mikrogravitace (0g)'],
      probability: 100,
    },
    {
      label: 'Tlak',
      possibleValues: ['snížený 34.5 kPa', 'O₂ 70%'],
      probability: 100,
    },
    {
      label: 'ECLSS',
      possibleValues: ['nominal', 'meteoroid shield damaged'],
      probability: 5,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: SKYLAB_CITATION,
};

/** O'Neill cylinder — teoretický koncept. */
const STATION_ONEILL: ArchetypePreset = {
  id: 'station-oneill-cylinder',
  category: 'scifi',
  name: "O'Neill cylinder",
  subtitle: 'Velký rotující habitat',
  description:
    'Teoretický rotující válec generující 1g umělou gravitaci, 22°C, vlastní ozónová bublina, riziko rotation failure.',
  emoji: '🌀',
  climateZone: 'CONTROLLED',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 60,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 25,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Řízený déšť',
      icon: 'cloud-rain',
      probability: 10,
      cloudRange: [5, 7],
      precipRange: [1, 10],
    },
    {
      type: 'fog',
      label: 'Ranní mlha',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [4, 6],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 15],
  defaultWindGustMultiplier: 1.2,
  defaultPressureRange: [1010, 1020],
  defaultHumidityRange: [40, 75],
  defaultCustomFields: [
    {
      label: 'Gravitace (rotací)',
      possibleValues: ['1g nominal', 'precese', 'rotation failure'],
      probability: 5,
    },
    {
      label: 'Ozónová bublina',
      possibleValues: ['intaktní', 'mikropropad', 'breach alarm'],
      probability: 3,
    },
    {
      label: 'Coriolis efekt',
      possibleValues: ['nezaznamenatelný', 'cítitelný'],
      probability: 30,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: ONEILL_CITATION,
};

/** Stanford Torus — teoretický koncept. */
const STATION_STANFORD_TORUS: ArchetypePreset = {
  id: 'station-stanford-torus',
  category: 'scifi',
  name: 'Stanford Torus',
  subtitle: 'Prsten ~10 000 obyvatel',
  description:
    'Teoretický prstencový habitat s rotací pro 1g, 22°C, navržen NASA Ames 1975, kapacita ~10 000 lidí.',
  emoji: '⭕',
  climateZone: 'CONTROLLED',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 70,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 20,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Řízený déšť',
      icon: 'cloud-rain',
      probability: 10,
      cloudRange: [5, 7],
      precipRange: [1, 8],
    },
  ],
  defaultWindRange: [0, 12],
  defaultWindGustMultiplier: 1.1,
  defaultPressureRange: [1010, 1020],
  defaultHumidityRange: [40, 70],
  defaultCustomFields: [
    {
      label: 'Gravitace (rotací)',
      possibleValues: ['1g nominal', 'precesní oscilace', 'rotation failure'],
      probability: 3,
    },
    {
      label: 'Sluneční zrcadla',
      possibleValues: ['nominal', 'misalign'],
      probability: 5,
    },
    {
      label: 'Populace',
      possibleValues: ['částečná', 'plná ~10 000'],
      probability: 100,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: STANFORD_TORUS_CITATION,
};

export const STATION_PRESETS: readonly ArchetypePreset[] = [
  STATION_ISS,
  STATION_MIR,
  STATION_SKYLAB,
  STATION_ONEILL,
  STATION_STANFORD_TORUS,
] as const;
