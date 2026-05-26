import type { ArchetypePreset } from '../types';

/**
 * 9.4-III — Sci-fi: lodní interiéry per-room (10 presetů).
 *
 * sourceLevel: MEASURED (Apollo, ISS, Shuttle in-flight data) +
 *              DOCUMENTED (NASA NIAC studie, ESA EDEN ISS, FAA standardy).
 *
 * Všechny prostředí climateZone CONTROLLED kromě cryo-bay (EF — řízené hluboké
 * chlazení). Jednotlivé místnosti mají různé tepelné profily podle účelu:
 * engine room nejteplejší (~30°C), cryo-bay nejstudenější (5°C).
 *
 * Pravidlo: data-only, žádné Math.random.
 */

const NASA_STD_3001 =
  'NASA-STD-3001 Human Systems Integration Standards Vol 1+2';
const APOLLO_OPS = 'NASA Apollo Operations Handbook + ISS Cupola design specs';
const APOLLO_SM = 'Apollo Service Module thermal control data';
const SHUTTLE_PAYLOAD = 'Space Shuttle Payload Bay specs (NSTS 21492)';
const ISS_QUEST = 'ISS Quest Airlock specs (NASA-STD-3001 §6)';
const EMU_CITATION =
  'NASA EMU (Extravehicular Mobility Unit) + Apollo A7L technical specs';
const VEGGIE_CITATION =
  'NASA Veggie experiment 2014-present + ESA EDEN ISS Antarctica greenhouse';
const SPACEWORKS_CRYO =
  'NASA NIAC 2014 Spaceworks Torpor Inducing Transfer Habitat study';
const ISS_UNITY = 'ISS Unity Node 1 + Harmony Node 2 habitation specs';

/** Crew quarters / kajuty. */
const SHIP_CREW_QUARTERS: ArchetypePreset = {
  id: 'ship-crew-quarters',
  category: 'scifi',
  name: 'Crew quarters',
  subtitle: 'Spací kajuty posádky',
  description:
    'Osobní prostor 18-22°C pro spánek, tlumené osvětlení, izolace zvuku, riziko sleep deprivation a izolace.',
  emoji: '🛏️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 1],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [40, 55],
  defaultCustomFields: [
    {
      label: 'Osvětlení',
      possibleValues: ['noční', 'tlumené', 'denní'],
      probability: 100,
    },
    {
      label: 'Sleep cycle',
      possibleValues: ['nominal', 'deprivation', 'circadian disruption'],
      probability: 25,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: NASA_STD_3001,
};

/** Bridge / velitelský můstek. */
const SHIP_BRIDGE: ArchetypePreset = {
  id: 'ship-bridge',
  category: 'scifi',
  name: 'Velitelský můstek',
  subtitle: 'Command center',
  description:
    'Centrální velitelské stanoviště 20-22°C s chlazením elektroniky, alarm hluk při incidentech, stres posádky.',
  emoji: '🎛️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [35, 50],
  defaultCustomFields: [
    {
      label: 'Alert level',
      possibleValues: ['normal', 'yellow', 'red'],
      probability: 15,
    },
    {
      label: 'Hladina hluku',
      possibleValues: ['tichá (45 dB)', 'aktivní (60 dB)', 'alarm (80+ dB)'],
      probability: 100,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: APOLLO_OPS,
};

/** Engine room / strojovna. */
const SHIP_ENGINE_ROOM: ArchetypePreset = {
  id: 'ship-engine-room',
  category: 'scifi',
  name: 'Strojovna',
  subtitle: 'Pohonný systém + hydraulika',
  description:
    'Teplé (25-35°C) prostředí motorů, hluk hydrauliky, suchý vzduch z thermal radiátorů, vyšší riziko zranění.',
  emoji: '⚙️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [2, 8],
  defaultWindGustMultiplier: 1.2,
  defaultPressureRange: [1010, 1020],
  defaultHumidityRange: [20, 35],
  defaultCustomFields: [
    {
      label: 'Hladina hluku',
      possibleValues: ['vysoká (85 dB)', 'extrémní (95+ dB)'],
      probability: 100,
    },
    {
      label: 'Hydraulika',
      possibleValues: ['nominal', 'mírná porucha', 'únik'],
      probability: 8,
    },
    {
      label: 'Tepelné záření',
      possibleValues: ['standardní', 'zvýšené', 'kritické'],
      probability: 60,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: APOLLO_SM,
};

/** Cargo hold. */
const SHIP_CARGO_HOLD: ArchetypePreset = {
  id: 'ship-cargo-hold',
  category: 'scifi',
  name: 'Cargo hold',
  subtitle: 'Nákladový prostor',
  description:
    'Variabilní 10-25°C dle nákladu, riziko shifting cargo při manévrech, omezené osvětlení.',
  emoji: '📦',
  climateZone: 'CONTROLLED',
  monthlyTemps: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 3],
  defaultWindGustMultiplier: 1.1,
  defaultPressureRange: [1005, 1015],
  defaultHumidityRange: [25, 55],
  defaultCustomFields: [
    {
      label: 'Cargo stav',
      possibleValues: ['zajištěno', 'shifting', 'havárie'],
      probability: 10,
    },
    {
      label: 'Náklad',
      possibleValues: ['suchý', 'chlazený', 'nebezpečný', 'biohazard'],
      probability: 100,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SHUTTLE_PAYLOAD,
};

/** Airlock. */
const SHIP_AIRLOCK: ArchetypePreset = {
  id: 'ship-airlock',
  category: 'scifi',
  name: 'Airlock',
  subtitle: 'Vstupní komora EVA',
  description:
    'Přechodová komora pro EVA — proměnlivý tlak při cyklování, riziko depressurization, prepress checklist.',
  emoji: '🚪',
  climateZone: 'CONTROLLED',
  monthlyTemps: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 5],
  defaultWindGustMultiplier: 1.3,
  defaultPressureRange: [0, 1015],
  defaultHumidityRange: [20, 50],
  defaultCustomFields: [
    {
      label: 'Cyklus',
      possibleValues: ['pressurized', 'depressing', 'vacuum', 'repress'],
      probability: 100,
    },
    {
      label: 'Stav těsnění',
      possibleValues: ['nominal', 'pomalý únik', 'breach'],
      probability: 5,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: ISS_QUEST,
};

/** EVA suit (vnitřek). */
const SHIP_EVA_SUIT_INTERIOR: ArchetypePreset = {
  id: 'ship-eva-suit-interior',
  category: 'scifi',
  name: 'EVA suit (vnitřek)',
  subtitle: 'Kosmický oblek',
  description:
    'Mikroklima skafandru — 22°C, 30% O₂, tlak 30 kPa, riziko mlžení visoru a dehydratace při delší EVA.',
  emoji: '👨‍🚀',
  climateZone: 'CONTROLLED',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 1],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [290, 310],
  defaultHumidityRange: [40, 70],
  defaultCustomFields: [
    {
      label: 'Visor stav',
      possibleValues: ['čistý', 'mlžící se', 'mlha (anti-fog selhal)'],
      probability: 20,
    },
    {
      label: 'O₂ úroveň',
      possibleValues: ['nominal 30%', 'klesající', 'reserve <15%'],
      probability: 100,
    },
    {
      label: 'Dehydratace',
      possibleValues: ['nízká', 'střední', 'kritická'],
      probability: 30,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: EMU_CITATION,
};

/** Hydroponics. */
const SHIP_HYDROPONICS: ArchetypePreset = {
  id: 'ship-hydroponics',
  category: 'scifi',
  name: 'Hydroponics',
  subtitle: 'Pěstírna rostlin',
  description:
    'Teplé a vlhké (22-25°C, vlhkost 60-80%), umělé LED osvětlení, riziko nákazy rostlin.',
  emoji: '🌱',
  climateZone: 'CONTROLLED',
  monthlyTemps: [23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 95,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'Misting',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [3, 6],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 5],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [60, 80],
  defaultCustomFields: [
    {
      label: 'LED osvětlení',
      possibleValues: ['fotosyntéza-fáze', 'klidová fáze'],
      probability: 100,
    },
    {
      label: 'Stav rostlin',
      possibleValues: ['zdravé', 'stres', 'nákaza', 'kolaps'],
      probability: 15,
    },
    {
      label: 'CO₂ obohacení',
      possibleValues: ['standardní', 'zvýšené (1000 ppm)'],
      probability: 60,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: VEGGIE_CITATION,
};

/** Med-bay. */
const SHIP_MED_BAY: ArchetypePreset = {
  id: 'ship-med-bay',
  category: 'scifi',
  name: 'Med-bay',
  subtitle: 'Lékařské centrum',
  description:
    'Sterilní prostředí 20-22°C, vlhkost 30-40%, izolační boxy pro pacienty, stigma karantény.',
  emoji: '🏥',
  climateZone: 'CONTROLLED',
  monthlyTemps: [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [30, 40],
  defaultCustomFields: [
    {
      label: 'Sterilita',
      possibleValues: ['standardní', 'ISO 7 cleanroom', 'ISO 5'],
      probability: 100,
    },
    {
      label: 'Obsazenost',
      possibleValues: ['volné', 'běžná', 'kapacita', 'karanténa'],
      probability: 60,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: NASA_STD_3001,
};

/** Cryo-bay / sleeper pods. EF — řízené hluboké chlazení. */
const SHIP_CRYO_BAY: ArchetypePreset = {
  id: 'ship-cryo-bay',
  category: 'scifi',
  name: 'Cryo-bay',
  subtitle: 'Sleeper pods',
  description:
    'Chladné prostředí ~5°C kolem pods, kontrolovaná hypotermie 32-34°C u člověka uvnitř, kritické pod selhání.',
  emoji: '🧊',
  climateZone: 'EF',
  monthlyTemps: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 1],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1005, 1015],
  defaultHumidityRange: [25, 40],
  defaultCustomFields: [
    {
      label: 'Pod stav',
      possibleValues: ['nominal', 'warning', 'critical', 'failed'],
      probability: 5,
    },
    {
      label: 'Hypotermie člověka',
      possibleValues: ['32-34°C stabilní', 'driftující', 'kritická'],
      probability: 100,
    },
    {
      label: 'Glazura na podech',
      possibleValues: ['čistá', 'jinovatka', 'led'],
      probability: 50,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: SPACEWORKS_CRYO,
};

/** Mess hall / jídelna. */
const SHIP_MESS_HALL: ArchetypePreset = {
  id: 'ship-mess-hall',
  category: 'scifi',
  name: 'Mess hall',
  subtitle: 'Společná jídelna',
  description:
    'Společný prostor 22°C, vyšší vlhkost při shluku posádky, místo konfliktů i komunity, mikrobiální stratifikace.',
  emoji: '🍽️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Nominal',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [40, 65],
  defaultCustomFields: [
    {
      label: 'Obsazenost',
      possibleValues: ['prázdná', 'individuální', 'shift change', 'plná'],
      probability: 80,
    },
    {
      label: 'Sociální napětí',
      possibleValues: ['klidné', 'mírné', 'konflikt'],
      probability: 25,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: ISS_UNITY,
};

export const SHIP_INTERIOR_PRESETS: readonly ArchetypePreset[] = [
  SHIP_CREW_QUARTERS,
  SHIP_BRIDGE,
  SHIP_ENGINE_ROOM,
  SHIP_CARGO_HOLD,
  SHIP_AIRLOCK,
  SHIP_EVA_SUIT_INTERIOR,
  SHIP_HYDROPONICS,
  SHIP_MED_BAY,
  SHIP_CRYO_BAY,
  SHIP_MESS_HALL,
] as const;
