import type { ArchetypePreset } from '../types';

/**
 * 9.4-III — Sci-fi: typy lodí (6 presetů).
 *
 * sourceLevel: DOCUMENTED (Project Orion, Daedalus, Cassini) +
 *              ANALOGY (vojenské, civilní, mining — extrapolace z analogických
 *              pozemních / námořních standardů).
 *
 * Všechny climateZone CONTROLLED (HVAC) kromě cryo-haul (EF). Liší se default
 * teplotou podle účelu — generation ship 22°C komfort, mining 25°C průmyslové,
 * cryo-haul 3°C cluster pods.
 *
 * Pravidlo: data-only, žádné Math.random.
 */

const ORION_DAEDALUS =
  'Project Orion (Dyson, Taylor 1958) + Project Daedalus BIS 1973-78';
const NIAC_ASTEROID =
  'NASA NIAC Asteroid Mining studies + analogy reálných námořních mining vessels';
const NAVY_SUBMARINE =
  'US Navy submarine HVAC standards (NAVSEA Tech Manuals) + ekvivalent';
const FAA_AC = 'FAA AC 25.831 Ventilation + airline cabin air quality standards';
const CASSINI_VOYAGER =
  'Cassini-Huygens + Voyager probe thermal design (NASA/JPL)';
const SPACEWORKS_CRYO =
  'NASA NIAC 2014 Spaceworks Torpor Inducing Transfer Habitat study';

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

/** Generation ship — multi-generační kontrolované prostředí. */
const SHIP_GENERATION: ArchetypePreset = {
  id: 'ship-generation-ship',
  category: 'scifi',
  name: 'Generation ship',
  subtitle: 'Multi-generační loď',
  description:
    'Stovky až tisíce let cesta, 22°C komfort, riziko politických krizí a genetických mutací mezi generacemi.',
  emoji: '🌐',
  climateZone: 'CONTROLLED',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 3],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [40, 60],
  defaultCustomFields: [
    {
      label: 'Generace',
      possibleValues: ['1.', '2.', '3.+', 'forgotten origins'],
      probability: 100,
    },
    {
      label: 'Sociální stav',
      possibleValues: ['stabilní', 'frakce', 'krize'],
      probability: 30,
    },
    {
      label: 'Genetická diverzita',
      possibleValues: ['nominal', 'klesající', 'kritická'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: ORION_DAEDALUS,
};

/** Mining vessel — průmyslové prostředí. */
const SHIP_MINING: ArchetypePreset = {
  id: 'ship-mining-vessel',
  category: 'scifi',
  name: 'Mining vessel',
  subtitle: 'Asteroidová těžební loď',
  description:
    'Teplejší (25°C) průmyslové prostředí, prach z těžby, vibrace, riziko exploze a depresurizace.',
  emoji: '⛏️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 8],
  defaultWindGustMultiplier: 1.3,
  defaultPressureRange: [1005, 1015],
  defaultHumidityRange: [25, 50],
  defaultCustomFields: [
    {
      label: 'Prach (regolith)',
      possibleValues: ['nízký', 'střední', 'vysoký'],
      probability: 70,
    },
    {
      label: 'Vibrace',
      possibleValues: ['ticho', 'drill aktivní', 'extrakce'],
      probability: 60,
    },
    {
      label: 'Bezpečnost',
      possibleValues: ['nominal', 'warning', 'exploze riziko'],
      probability: 15,
    },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: NIAC_ASTEROID,
};

/** Military cruiser. */
const SHIP_MILITARY: ArchetypePreset = {
  id: 'ship-military-cruiser',
  category: 'scifi',
  name: 'Military cruiser',
  subtitle: 'Vojenská loď',
  description:
    'Disciplinované 20°C prostředí, časté alarm cykly, válečný stav mění operační režim, opt. nutkavé prostředí.',
  emoji: '⚔️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 4],
  defaultWindGustMultiplier: 1.1,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [35, 50],
  defaultCustomFields: [
    {
      label: 'Alert level',
      possibleValues: ['green', 'yellow', 'red', 'black'],
      probability: 30,
    },
    {
      label: 'Battle stations',
      possibleValues: ['stand-down', 'drill', 'real'],
      probability: 20,
    },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: NAVY_SUBMARINE,
};

/** Civilian transport. */
const SHIP_CIVILIAN: ArchetypePreset = {
  id: 'ship-civilian-transport',
  category: 'scifi',
  name: 'Civilian transport',
  subtitle: 'Civilní doprava',
  description:
    'Komfortní 22°C kabina, riziko motion sickness, panika při turbulencích, různorodá pasažérská populace.',
  emoji: '✈️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 3],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [750, 800],
  defaultHumidityRange: [15, 30],
  defaultCustomFields: [
    {
      label: 'Cestující',
      possibleValues: ['relax', 'nervozita', 'panika'],
      probability: 25,
    },
    {
      label: 'Turbulence',
      possibleValues: ['žádné', 'mírné', 'silné'],
      probability: 30,
    },
    {
      label: 'Tlak v kabině',
      possibleValues: ['ekvivalent ~2400m n.m.'],
      probability: 100,
    },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: FAA_AC,
};

/** Exploration ship. */
const SHIP_EXPLORATION: ArchetypePreset = {
  id: 'ship-exploration',
  category: 'scifi',
  name: 'Exploration ship',
  subtitle: 'Vědecko-průzkumná loď',
  description:
    'Flexibilní 21°C s laboratořemi, časté EVA, neznámé prostředí venku — biohazard, exotická chemie.',
  emoji: '🔭',
  climateZone: 'CONTROLLED',
  monthlyTemps: [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 3],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1005, 1015],
  defaultHumidityRange: [35, 55],
  defaultCustomFields: [
    {
      label: 'Mise fáze',
      possibleValues: ['transit', 'orbit', 'survey', 'sample return'],
      probability: 100,
    },
    {
      label: 'Karanténa',
      possibleValues: ['žádná', 'biohazard', 'unknown contagion'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: CASSINI_VOYAGER,
};

/** Cryo-haul / refugee ark. EF — cluster pods. */
const SHIP_CRYO_HAUL: ArchetypePreset = {
  id: 'ship-cryo-haul',
  category: 'scifi',
  name: 'Cryo-haul',
  subtitle: 'Refugee ark / sleeper transport',
  description:
    'Chladný (~3°C) interiér plný cryo pods, minimální posádka v rotaci, riziko pod selhání a halucinací.',
  emoji: '🥶',
  climateZone: 'EF',
  monthlyTemps: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  defaultWeatherTypes: CLEAR_NOMINAL,
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1005, 1015],
  defaultHumidityRange: [20, 35],
  defaultCustomFields: [
    {
      label: 'Pod selhání rate',
      possibleValues: ['<1/1000', '1-5/1000', '>5/1000 (kritické)'],
      probability: 40,
    },
    {
      label: 'Posádka stav',
      possibleValues: ['nominal', 'únava', 'halucinace', 'paranoia'],
      probability: 25,
    },
    {
      label: 'Populace v podech',
      possibleValues: ['stovky', 'tisíce', 'desetitisíce'],
      probability: 100,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SPACEWORKS_CRYO,
};

export const SHIP_TYPE_PRESETS: readonly ArchetypePreset[] = [
  SHIP_GENERATION,
  SHIP_MINING,
  SHIP_MILITARY,
  SHIP_CIVILIAN,
  SHIP_EXPLORATION,
  SHIP_CRYO_HAUL,
] as const;
