import type { ArchetypePreset } from '../types';

/**
 * 9.4-III — Sci-fi: teoretické exoplanety (5 presetů).
 *
 * sourceLevel: DOCUMENTED (peer-reviewed exoplanetary research)
 *  + INFERRED (eyeball planet — odvozeno z modelů).
 *
 * climateZone EXTRATERRESTRIAL pro vesmírná tělesa, Af pro Hycean (vodní svět).
 * monthlyTemps reprezentují průměr napříč hemisférami (tidally locked planety
 * mají v reálu extrémní gradient — terminator zone je hraniční oblast).
 *
 * Pravidlo: data-only, žádné Math.random.
 */

const PROXIMA_CITATION =
  'Anglada-Escudé et al. 2016, A terrestrial planet candidate in a temperate orbit around Proxima Centauri, Nature 536, 437-440';
const EYEBALL_CITATION =
  'Pierrehumbert R.T. 2011, A palette of climates for Gliese 581g, ApJ 726 L8';
const HYCEAN_CITATION =
  'Madhusudhan et al. 2021, Habitability and Biosignatures of Hycean Worlds, ApJ 918:1';
const HOT_JUPITER_CITATION =
  'Knutson H.A. et al. 2007, A map of the day-night contrast of HD 189733b, Nature 447, 183-186 (WASP-12b/HD 189733b research)';
const NASA_STD_3001 =
  'NASA-STD-3001 Human Systems Integration Standards Vol 1+2';

/** Tidally locked planeta (Proxima b-like). Terminator zone. */
const EXO_TIDALLY_LOCKED: ArchetypePreset = {
  id: 'exo-tidally-locked',
  category: 'scifi',
  name: 'Slapově vázaná planeta',
  subtitle: 'Proxima b — terminator zone',
  description:
    'Jedna strana věčný den +100°C, druhá věčná noc -100°C; obyvatelný úzký pás na terminátoru s teplotou kolem +10°C.',
  emoji: '🌗',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 40,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Konvektivní mraky',
      icon: 'cloud',
      probability: 30,
      cloudRange: [4, 7],
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
      label: 'Konvektivní bouře',
      icon: 'cloud-lightning',
      probability: 10,
      cloudRange: [6, 8],
      precipRange: [10, 40],
    },
    {
      type: 'fog',
      label: 'Mlha na terminátoru',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [20, 80],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [990, 1020],
  defaultHumidityRange: [50, 90],
  defaultCustomFields: [
    {
      label: 'Pozice na terminátoru',
      possibleValues: ['blíže k dennímu (+25°C)', 'střed (+10°C)', 'blíže k noci (-15°C)'],
      probability: 100,
    },
    {
      label: 'Stelární erupce (red dwarf)',
      possibleValues: ['žádná', 'flare', 'super-flare'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: PROXIMA_CITATION,
};

/** Eyeball planet. Subsolar bod tavenina, anti-stellar bod led. */
const EXO_EYEBALL: ArchetypePreset = {
  id: 'exo-eyeball-planet',
  category: 'scifi',
  name: 'Eyeball planeta',
  subtitle: 'Vodní svět s ledovým prstencem',
  description:
    'Subsolar bod taje, anti-stellar bod ledový, mezi nimi prstenec tekutého oceánu — průměrná teplota povrchu kolem -50°C.',
  emoji: '👁️',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-50, -50, -50, -50, -50, -50, -50, -50, -50, -50, -50, -50],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
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
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 15,
      cloudRange: [5, 8],
      precipRange: [1, 15],
    },
    {
      type: 'fog',
      label: 'Mořská mlha',
      icon: 'cloud-fog',
      probability: 10,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [10, 60],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [990, 1020],
  defaultHumidityRange: [40, 90],
  defaultCustomFields: [
    {
      label: 'Zóna',
      possibleValues: ['subsolar tavenina', 'kapalný prstenec', 'anti-stellar led'],
      probability: 100,
    },
    {
      label: 'Atm. cirkulace',
      possibleValues: ['stabilní', 'turbulentní', 'super-rotace'],
      probability: 30,
    },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: EYEBALL_CITATION,
};

/** Hycean ocean world. Globální oceán, H atmosféra. */
const EXO_HYCEAN: ArchetypePreset = {
  id: 'exo-hycean-ocean',
  category: 'scifi',
  name: 'Hycean ocean world',
  subtitle: 'Kepler-138 c/d — vodní svět',
  description:
    'Globální oceán pokrytý vodíkovou atmosférou, ~30°C povrchová teplota, vysoký tlak, potenciálně biosignatury.',
  emoji: '🌊',
  climateZone: 'Af',
  monthlyTemps: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 25,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Mraky',
      icon: 'cloud',
      probability: 40,
      cloudRange: [4, 7],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Vodíkový déšť',
      icon: 'cloud-rain',
      probability: 20,
      cloudRange: [6, 8],
      precipRange: [3, 30],
    },
    {
      type: 'storm',
      label: 'Bouře',
      icon: 'cloud-lightning',
      probability: 10,
      cloudRange: [7, 8],
      precipRange: [15, 60],
    },
    {
      type: 'fog',
      label: 'Mořská mlha',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [10, 60],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [5000, 50000],
  defaultHumidityRange: [80, 100],
  defaultCustomFields: [
    {
      label: 'Atmosféra',
      possibleValues: ['H₂-rich, vysoký tlak'],
      probability: 100,
    },
    {
      label: 'Biosignatura',
      possibleValues: ['žádná', 'DMS detekce', 'organické komplexy'],
      probability: 20,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: HYCEAN_CITATION,
};

/** Hot Jupiter. Extrémní teplo na denní straně. */
const EXO_HOT_JUPITER: ArchetypePreset = {
  id: 'exo-hot-jupiter',
  category: 'scifi',
  name: 'Hot Jupiter',
  subtitle: 'WASP-12b / HD 189733b',
  description:
    'Plynný obr na velmi blízké orbitě hvězdy, denní strana 1500°C+, super-rotace, ionizovaná atmosféra.',
  emoji: '🔥',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500],
  defaultWeatherTypes: [
    {
      type: 'cloudy',
      label: 'Silikátové mraky',
      icon: 'cloud',
      probability: 60,
      cloudRange: [6, 8],
      precipRange: [0, 0],
    },
    {
      type: 'storm',
      label: 'Tepelná bouře',
      icon: 'cloud-lightning',
      probability: 40,
      cloudRange: [7, 8],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [1000, 8000],
  defaultWindGustMultiplier: 1.4,
  defaultPressureRange: [100, 10000],
  defaultHumidityRange: [0, 10],
  defaultCustomFields: [
    {
      label: 'Pozice',
      possibleValues: ['denní strana 1500°C+', 'terminátor', 'noční strana ~700°C'],
      probability: 100,
    },
    {
      label: 'Silikátový déšť',
      possibleValues: ['žádný', 'sklěněný', 'železný'],
      probability: 50,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: HOT_JUPITER_CITATION,
};

/** ISS-like kupole stanice (zařazená podle spec do exoplanetary skupiny). */
const EXO_ISS_DOME: ArchetypePreset = {
  id: 'exo-iss-dome',
  category: 'scifi',
  name: 'ISS-like kupole stanice',
  subtitle: 'Orbitální habitat',
  description:
    'Řízené prostředí ~22°C, HVAC udržuje atmosféru a vlhkost, mikrogravitace, riziko CO₂ buildupu při HVAC failure.',
  emoji: '🛰️',
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
  defaultHumidityRange: [40, 60],
  defaultCustomFields: [
    {
      label: 'HVAC',
      possibleValues: ['nominal', 'mírná porucha', 'critical failure'],
      probability: 8,
    },
    {
      label: 'CO₂ úroveň',
      possibleValues: ['<0.3%', '0.3-0.5%', '>0.5% (alarm)'],
      probability: 100,
    },
    {
      label: 'Gravitace',
      possibleValues: ['mikrogravitace (0g)'],
      probability: 100,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NASA_STD_3001,
};

export const EXOPLANETARY_PRESETS: readonly ArchetypePreset[] = [
  EXO_TIDALLY_LOCKED,
  EXO_EYEBALL,
  EXO_HYCEAN,
  EXO_HOT_JUPITER,
  EXO_ISS_DOME,
] as const;
