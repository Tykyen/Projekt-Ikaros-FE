import type { ArchetypePreset } from '../types';

/**
 * 9.4-III — Sci-fi: EVA exteriéry (4 presety).
 *
 * sourceLevel: MEASURED (Apollo, ISS EVA — in-flight data) +
 *              DOCUMENTED (Mars DRA 5.0, NIAC asteroid retrieval).
 *
 * Pozor — climateZone EXTRATERRESTRIAL ALE monthlyTemps drží 22°C
 * (oblek-relevant). Pro variance model je rozhodující co PJ "cítí", a to je
 * mikroklima skafandru, ne -150°C exteriér. Hazardy a exteriér teplotní swing
 * jsou v defaultCustomFields.
 *
 * Pravidlo: data-only, žádné Math.random.
 */

const APOLLO_SURFACE = 'Apollo 11-17 surface operations data + LSAM thermal logs';
const NASA_EVA = 'NASA EVA standards + EMU technical specifications';
const MARS_DRA = 'NASA Mars Design Reference Architecture 5.0 (NASA-SP-2009-566)';
const NIAC_ASTEROID =
  'NASA NIAC Asteroid Retrieval and Utilization studies + OSIRIS-REx mission';

/** Apollo lunar EVA. */
const EVA_APOLLO_LUNAR: ArchetypePreset = {
  id: 'eva-apollo-lunar',
  category: 'scifi',
  name: 'Apollo lunar EVA',
  subtitle: 'Měsíční povrchová operace',
  description:
    'Oblek udržuje ~22°C (cítěno PJ), exteriér swing -173 až +127°C, riziko mikrometeoritů a radiace, regolith dust.',
  emoji: '🌑',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Vakuum',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 0],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [290, 310],
  defaultHumidityRange: [40, 70],
  defaultCustomFields: [
    {
      label: 'Exteriér teplota',
      possibleValues: ['lunární noc -173°C', 'terminator', 'lunární den +127°C'],
      probability: 100,
    },
    {
      label: 'Regolith dust',
      possibleValues: ['čisto', 'na obleku', 'kontaminace dýchání'],
      probability: 60,
    },
    {
      label: 'Mikrometeority',
      possibleValues: ['žádné', 'spor.', 'roj (>1mm)'],
      probability: 10,
    },
    {
      label: 'Radiace (cosmic)',
      possibleValues: ['nominal', 'solar event', 'SPE alarm'],
      probability: 5,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: APOLLO_SURFACE,
};

/** ISS orbital EVA. */
const EVA_ISS_ORBITAL: ArchetypePreset = {
  id: 'eva-iss-orbital',
  category: 'scifi',
  name: 'ISS orbital EVA',
  subtitle: 'Spacewalk na LEO',
  description:
    'Oblek 22°C, exteriér +120°C v slunci / -150°C ve stínu (45-min cyklus), orbital debris riziko, tether-only.',
  emoji: '🛰️',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Vakuum',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 0],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [290, 310],
  defaultHumidityRange: [40, 70],
  defaultCustomFields: [
    {
      label: 'Exteriér',
      possibleValues: ['stín -150°C', 'terminator', 'slunce +120°C'],
      probability: 100,
    },
    {
      label: 'Orbital debris',
      possibleValues: ['nízké riziko', 'tracked object', 'conjunction alarm'],
      probability: 8,
    },
    {
      label: 'Tether',
      possibleValues: ['zajištěn', 'SAFER backup', 'volný drift'],
      probability: 2,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NASA_EVA,
};

/** Mars surface EVA. */
const EVA_MARS_SURFACE: ArchetypePreset = {
  id: 'eva-mars-surface',
  category: 'scifi',
  name: 'Mars surface EVA',
  subtitle: 'Marsovský povrchový výstup',
  description:
    'Oblek 22°C, exteriér průměrně -80°C, prachové bouře omezují EVA, řídký vzduch (0.6 kPa) — bez tlakového obleku okamžitá smrt.',
  emoji: '🔴',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno (oblek)',
      icon: 'sun',
      probability: 80,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'Prachová mlha',
      icon: 'cloud-fog',
      probability: 15,
      cloudRange: [3, 7],
      precipRange: [0, 0],
    },
    {
      type: 'storm',
      label: 'Prachová bouře',
      icon: 'wind',
      probability: 5,
      cloudRange: [6, 8],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 100],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [290, 310],
  defaultHumidityRange: [40, 70],
  defaultCustomFields: [
    {
      label: 'Exteriér teplota',
      possibleValues: ['noc -120°C', 'ráno -60°C', 'poledne -20°C', 'sol max +20°C'],
      probability: 100,
    },
    {
      label: 'Prach na obleku',
      possibleValues: ['čisto', 'pokrytý', 'omezuje pohyb'],
      probability: 50,
    },
    {
      label: 'Prachová bouře',
      possibleValues: ['žádná', 'lokální', 'regionální (EVA pozastaveno)'],
      probability: 20,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: MARS_DRA,
};

/** Asteroid EVA. */
const EVA_ASTEROID: ArchetypePreset = {
  id: 'eva-asteroid',
  category: 'scifi',
  name: 'Asteroid EVA',
  subtitle: 'Mikrogravita na asteroidu',
  description:
    'Oblek 22°C, exteriér -150 až +50°C podle slunce, mikrogravitace (~0.0001g), regolith dust se nesedí.',
  emoji: '☄️',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Vakuum',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 0],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [290, 310],
  defaultHumidityRange: [40, 70],
  defaultCustomFields: [
    {
      label: 'Exteriér teplota',
      possibleValues: ['stín -150°C', 'terminator', 'slunce +50°C'],
      probability: 100,
    },
    {
      label: 'Gravitace',
      possibleValues: ['~0g (drift)', 'tether nutný'],
      probability: 100,
    },
    {
      label: 'Regolith plume',
      possibleValues: ['čisto', 'lokální', 'omezuje vizibilitu'],
      probability: 40,
    },
    {
      label: 'Rotace tělesa',
      possibleValues: ['pomalá', 'rychlá', 'chaotická (tumbling)'],
      probability: 30,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: NIAC_ASTEROID,
};

export const EVA_PRESETS: readonly ArchetypePreset[] = [
  EVA_APOLLO_LUNAR,
  EVA_ISS_ORBITAL,
  EVA_MARS_SURFACE,
  EVA_ASTEROID,
] as const;
