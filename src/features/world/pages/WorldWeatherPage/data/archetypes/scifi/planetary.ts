import type { ArchetypePreset } from '../types';

/**
 * 9.4-III — Sci-fi: reálná planetární tělesa (11 presetů).
 *
 * sourceLevel: MEASURED (in-situ instrumentální data NASA/JPL/ESA).
 *
 * Tělesa jsou neobyvatelná — monthlyTemps reprezentují měřené průměry povrchu
 * (resp. cloud-tops pro plynné obry). climateZone EXTRATERRESTRIAL bypassuje
 * Köppen, výjimky: Pluto (EF) a Mars polární čepička (EF) — extrémní mráz
 * v rámci Köppen ledovcové škály je vhodnější aproximace.
 *
 * Hazardy jsou simplifikované — pro vakuum/CO₂/sulfur prostředí
 * `defaultWeatherTypes` obsahuje jen clear + případně fog (Mars dust storms).
 *
 * Pravidlo: čistá data struktura, žádné Math.random.
 */

const NASA_CITATION_MARS =
  'NASA Curiosity REMS instrument 2012-present, Hassler et al. 2014 Science 343';
const NASA_CITATION_MARS_CLIMATE = 'NASA Mars Climate Sounder';
const NASA_CITATION_MOON = 'NASA Apollo missions + LRO Diviner radiometer';
const VENERA_CITATION =
  'Venera 13-14 missions 1981-82, Magellan, Akatsuki';
const CASSINI_TITAN = 'Cassini-Huygens mission 2005-2017';
const GALILEO_EUROPA = 'NASA Galileo orbiter, Hubble Space Telescope';
const CASSINI_ENCELADUS = 'Cassini mission 2005-2015 plume observations';
const GALILEO_IO = 'NASA Galileo + Juno mission';
const NEW_HORIZONS = 'NASA New Horizons mission 2015';
const JUNO_JUPITER = 'NASA Juno mission cloud-top measurements';

/** Mars (celá planeta). Průměr napříč planetou, prachové bouře. */
const PLANET_MARS: ArchetypePreset = {
  id: 'planet-mars',
  category: 'scifi',
  name: 'Mars (celá planeta)',
  subtitle: 'Rudá planeta — průměr povrchu',
  description:
    'Studená pouštní planeta s 8-měsíčním cyklem prachových bouří, řídkou CO₂ atmosférou (~0.6 kPa) a teplotami hluboko pod nulou.',
  emoji: '🔴',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-65, -70, -75, -80, -75, -65, -55, -50, -55, -60, -65, -65],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 75,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'CO₂ mraky',
      icon: 'cloud',
      probability: 10,
      cloudRange: [2, 5],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'Prachová mlha',
      icon: 'cloud-fog',
      probability: 10,
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
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [4, 9],
  defaultHumidityRange: [0, 5],
  defaultCustomFields: [
    {
      label: 'Prachová bouře',
      possibleValues: ['žádná', 'lokální', 'regionální', 'globální'],
      probability: 25,
    },
    {
      label: 'Atmosféra',
      possibleValues: ['95% CO₂, tlak ~0.6 kPa'],
      probability: 100,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NASA_CITATION_MARS,
};

/** Mars: Gale Crater (Curiosity landing site). */
const PLANET_MARS_GALE: ArchetypePreset = {
  id: 'planet-mars-gale-crater',
  category: 'scifi',
  name: 'Mars: Gale Crater',
  subtitle: 'Curiosity rover lokace',
  description:
    'Konkrétní in-situ data z REMS — denní swing -80°C v noci až +20°C v poledne, prachové bouře v sezoně.',
  emoji: '🛸',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-60, -65, -70, -75, -70, -60, -50, -45, -50, -55, -60, -60],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 78,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'Prachová mlha',
      icon: 'cloud-fog',
      probability: 12,
      cloudRange: [3, 7],
      precipRange: [0, 0],
    },
    {
      type: 'storm',
      label: 'Prachová bouře',
      icon: 'wind',
      probability: 10,
      cloudRange: [6, 8],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 90],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [6, 11],
  defaultHumidityRange: [0, 5],
  defaultCustomFields: [
    {
      label: 'Denní swing',
      possibleValues: ['mírný (-30/0°C)', 'silný (-60/+10°C)', 'extrémní (-80/+20°C)'],
      probability: 80,
    },
    {
      label: 'Prachová bouře',
      possibleValues: ['žádná', 'lokální', 'regionální'],
      probability: 20,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NASA_CITATION_MARS,
};

/** Mars: polární čepička. CO₂ led sublimace, polární noc. */
const PLANET_MARS_POLAR: ArchetypePreset = {
  id: 'planet-mars-polar',
  category: 'scifi',
  name: 'Mars: polární čepička',
  subtitle: 'Severní/jižní polární region',
  description:
    'Extrémní mráz a sublimující CO₂ led, polární noc trvá až 6 měsíců, prakticky žádné srážky.',
  emoji: '❄️',
  climateZone: 'EF',
  monthlyTemps: [-125, -120, -115, -110, -105, -100, -95, -100, -110, -115, -125, -125],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno',
      icon: 'sun',
      probability: 70,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'CO₂ ledové mraky',
      icon: 'cloud',
      probability: 20,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'CO₂ ledová mlha',
      icon: 'cloud-fog',
      probability: 10,
      cloudRange: [4, 7],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 70],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [3, 8],
  defaultHumidityRange: [0, 5],
  defaultCustomFields: [
    {
      label: 'CO₂ sublimace',
      possibleValues: ['neaktivní', 'mírná', 'silná'],
      probability: 50,
    },
    {
      label: 'Polární noc',
      possibleValues: ['den', 'soumrak', 'noc'],
      probability: 100,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NASA_CITATION_MARS_CLIMATE,
};

/** Měsíc (Luna). Extrémní swing den/noc, vakuum. */
const PLANET_MOON: ArchetypePreset = {
  id: 'planet-moon',
  category: 'scifi',
  name: 'Měsíc (Luna)',
  subtitle: 'Náš přirozený satelit',
  description:
    '14-denní den/noc cyklus s extrémním swingem (+127°C den / -173°C noc), vakuum, prachový regolith.',
  emoji: '🌕',
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
  defaultPressureRange: [0, 1],
  defaultHumidityRange: [0, 0],
  defaultCustomFields: [
    {
      label: 'Fáze',
      possibleValues: ['lunární den +127°C', 'terminator', 'lunární noc -173°C'],
      probability: 100,
    },
    {
      label: 'Mikrometeority',
      possibleValues: ['žádné', 'spor.', 'častější'],
      probability: 15,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NASA_CITATION_MOON,
};

/** Venuš. Pekelná planeta — 462°C povrchová teplota, 92 atm. */
const PLANET_VENUS: ArchetypePreset = {
  id: 'planet-venus',
  category: 'scifi',
  name: 'Venuš',
  subtitle: 'Pekelná planeta',
  description:
    'Konstantních 462°C, tlak 92 atm, mraky kyseliny sírové, super-rotace atmosféry s periodou 4 dny.',
  emoji: '♀️',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [462, 462, 462, 462, 462, 462, 462, 462, 462, 462, 462, 462],
  defaultWeatherTypes: [
    {
      type: 'cloudy',
      label: 'H₂SO₄ mraky',
      icon: 'cloud',
      probability: 100,
      cloudRange: [8, 8],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 360],
  defaultWindGustMultiplier: 1.3,
  defaultPressureRange: [9000, 9500],
  defaultHumidityRange: [0, 5],
  defaultCustomFields: [
    {
      label: 'Atmosféra',
      possibleValues: ['96.5% CO₂, mraky H₂SO₄, tlak 92 atm'],
      probability: 100,
    },
    {
      label: 'Super-rotace',
      possibleValues: ['~100 m/s (4-denní cyklus)'],
      probability: 100,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: VENERA_CITATION,
};

/** Titan (Saturnův měsíc). Metanové deště, etan jezera. */
const PLANET_TITAN: ArchetypePreset = {
  id: 'planet-titan',
  category: 'scifi',
  name: 'Titan',
  subtitle: 'Saturnův měsíc s metanovým cyklem',
  description:
    'Hustá N₂ atmosféra (1.45 atm), -179°C, metanové deště padají do etanových jezer, mlhavé oranžové nebe.',
  emoji: '🟠',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-179, -179, -179, -179, -179, -179, -179, -179, -179, -179, -179, -179],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno (oranžová mlha)',
      icon: 'sun',
      probability: 40,
      cloudRange: [2, 4],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Metanové mraky',
      icon: 'cloud',
      probability: 35,
      cloudRange: [5, 8],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Metanový déšť',
      icon: 'cloud-rain',
      probability: 10,
      cloudRange: [6, 8],
      precipRange: [1, 15],
    },
    {
      type: 'fog',
      label: 'Tholin mlha',
      icon: 'cloud-fog',
      probability: 15,
      cloudRange: [4, 7],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 10],
  defaultWindGustMultiplier: 1.2,
  defaultPressureRange: [140, 150],
  defaultHumidityRange: [0, 50],
  defaultCustomFields: [
    {
      label: 'Atmosféra',
      possibleValues: ['95% N₂, 5% CH₄, tlak 1.45 atm'],
      probability: 100,
    },
    {
      label: 'Etan jezera',
      possibleValues: ['na obzoru', 'blízko', 'přímo u pobřeží'],
      probability: 30,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: CASSINI_TITAN,
};

/** Europa (Jupiterův měsíc). Ledový povrch, podzemní oceán. */
const PLANET_EUROPA: ArchetypePreset = {
  id: 'planet-europa',
  category: 'scifi',
  name: 'Europa',
  subtitle: 'Jupiterův ledový měsíc',
  description:
    'Ledový povrch -160°C, podpovrchový vodní oceán, intenzivní radiační pás Jupiteru, prakticky žádná atmosféra.',
  emoji: '🧊',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-160, -160, -160, -160, -160, -160, -160, -160, -160, -160, -160, -160],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Vakuum nad ledem',
      icon: 'sun',
      probability: 100,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 0],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [0, 1],
  defaultHumidityRange: [0, 0],
  defaultCustomFields: [
    {
      label: 'Radiace (Jupiter belt)',
      possibleValues: ['vysoká', 'extrémní (~5400 mSv/den)'],
      probability: 100,
    },
    {
      label: 'Kryovulkanická aktivita',
      possibleValues: ['žádná', 'spor.', 'gejzír'],
      probability: 10,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: GALILEO_EUROPA,
};

/** Enceladus (Saturnův měsíc). Vodní gejzíry z jižního pólu. */
const PLANET_ENCELADUS: ArchetypePreset = {
  id: 'planet-enceladus',
  category: 'scifi',
  name: 'Enceladus',
  subtitle: 'Saturnův měsíc s vodními gejzíry',
  description:
    'Mrazivá -201°C krajina, vodní gejzíry z jižního pólu vrhající H₂O led do prstence E.',
  emoji: '💎',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-201, -201, -201, -201, -201, -201, -201, -201, -201, -201, -201, -201],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Vakuum',
      icon: 'sun',
      probability: 90,
      cloudRange: [0, 0],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'Gejzírový plume',
      icon: 'cloud-fog',
      probability: 10,
      cloudRange: [4, 7],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 0],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [0, 1],
  defaultHumidityRange: [0, 0],
  defaultCustomFields: [
    {
      label: 'Gejzír (jižní pól)',
      possibleValues: ['neaktivní', 'mírný', 'aktivní'],
      probability: 30,
    },
    {
      label: 'Podpovrchový oceán',
      possibleValues: ['hluboko (~30 km)', 'mělčí pukliny'],
      probability: 100,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: CASSINI_ENCELADUS,
};

/** Io (Jupiterův měsíc). 400+ aktivních vulkánů, sulfur. */
const PLANET_IO: ArchetypePreset = {
  id: 'planet-io',
  category: 'scifi',
  name: 'Io',
  subtitle: 'Jupiterův vulkanický měsíc',
  description:
    'Nejvulkanicky aktivní těleso ve sluneční soustavě, 400+ aktivních vulkánů, žluto-oranžový sulfur povrch, intenzivní radiace.',
  emoji: '🌋',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-150, -145, -130, -100, -50, 0, 13, 0, -50, -100, -130, -145],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Sulfur jasno',
      icon: 'sun',
      probability: 70,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'SO₂ vulkanický plume',
      icon: 'cloud',
      probability: 20,
      cloudRange: [4, 7],
      precipRange: [0, 0],
    },
    {
      type: 'storm',
      label: 'Vulkanická erupce',
      icon: 'wind',
      probability: 10,
      cloudRange: [6, 8],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 30],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [0, 1],
  defaultHumidityRange: [0, 0],
  defaultCustomFields: [
    {
      label: 'Vulkanická aktivita',
      possibleValues: ['mírná', 'silná', 'paroxysm (Loki)'],
      probability: 60,
    },
    {
      label: 'Radiace (Io plasma torus)',
      possibleValues: ['extrémní (3600 mSv/den)'],
      probability: 100,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: GALILEO_IO,
};

/** Pluto. Trpasličí planeta, dusíkové ledové pláně. */
const PLANET_PLUTO: ArchetypePreset = {
  id: 'planet-pluto',
  category: 'scifi',
  name: 'Pluto',
  subtitle: 'Trpasličí planeta na okraji',
  description:
    'Konstantní -229°C, dusíkové ledové pláně (Sputnik Planitia), atmosféra v perihéliu, jinak kolapsuje na povrch.',
  emoji: '🪐',
  climateZone: 'EF',
  monthlyTemps: [-229, -229, -228, -228, -227, -227, -227, -227, -227, -228, -228, -229],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno (slabá N₂ atm)',
      icon: 'sun',
      probability: 85,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'N₂ mlha',
      icon: 'cloud-fog',
      probability: 15,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [0, 5],
  defaultWindGustMultiplier: 1.1,
  defaultPressureRange: [0, 1],
  defaultHumidityRange: [0, 5],
  defaultCustomFields: [
    {
      label: 'N₂ atmosféra',
      possibleValues: ['kolaps (afélium)', 'tenká', 'měřitelná (perihélium)'],
      probability: 100,
    },
    {
      label: 'Ledové pláně',
      possibleValues: ['N₂ led', 'CH₄ jinovatka', 'CO led'],
      probability: 60,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: NEW_HORIZONS,
};

/** Jupiter (atmosféra). Cloud tops, žádný povrch. */
const PLANET_JUPITER: ArchetypePreset = {
  id: 'planet-jupiter',
  category: 'scifi',
  name: 'Jupiter (atmosféra)',
  subtitle: 'Plynný obr — cloud tops',
  description:
    'Atmosféra plynného obra v úrovni mraků (-145°C), vítr 650 km/h v Great Red Spot, NH₃/H₂O/H₂S mraky, žádný pevný povrch.',
  emoji: '🟤',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-145, -145, -145, -145, -145, -145, -145, -145, -145, -145, -145, -145],
  defaultWeatherTypes: [
    {
      type: 'cloudy',
      label: 'NH₃ pásy mraků',
      icon: 'cloud',
      probability: 60,
      cloudRange: [6, 8],
      precipRange: [0, 0],
    },
    {
      type: 'storm',
      label: 'Bouře (Great Red Spot)',
      icon: 'cloud-lightning',
      probability: 30,
      cloudRange: [7, 8],
      precipRange: [0, 0],
    },
    {
      type: 'fog',
      label: 'Hluboká vrstva',
      icon: 'cloud-fog',
      probability: 10,
      cloudRange: [5, 8],
      precipRange: [0, 0],
    },
  ],
  defaultWindRange: [100, 650],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [500, 3000],
  defaultHumidityRange: [10, 60],
  defaultCustomFields: [
    {
      label: 'Atmosféra',
      possibleValues: ['90% H₂, 10% He, stopy NH₃/CH₄/H₂O'],
      probability: 100,
    },
    {
      label: 'Bouřkový systém',
      possibleValues: ['klidný', 'pásová turbulence', 'Great Red Spot'],
      probability: 40,
    },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: JUNO_JUPITER,
};

export const PLANETARY_PRESETS: readonly ArchetypePreset[] = [
  PLANET_MARS,
  PLANET_MARS_GALE,
  PLANET_MARS_POLAR,
  PLANET_MOON,
  PLANET_VENUS,
  PLANET_TITAN,
  PLANET_EUROPA,
  PLANET_ENCELADUS,
  PLANET_IO,
  PLANET_PLUTO,
  PLANET_JUPITER,
] as const;
