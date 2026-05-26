import type { ArchetypePreset } from './types';

/**
 * 9.4-I — Köppen-Geiger klimatické zóny (16 archetypů).
 *
 * sourceLevel: DOCUMENTED
 * source: Peel et al. 2007, *Updated world map of the Köppen-Geiger climate
 *         classification*, Hydrol. Earth Syst. Sci., 11, 1633–1644.
 *
 * Reference monthlyTemps jsou typické průměry pro reprezentativní města
 * dané zóny (Singapore, Mumbai, Athens, Praha, Murmansk, Vostok, atd.).
 * Std dev se fallbacks z `KOPPEN_STDDEV` (sdílený simulation modul).
 *
 * Pravidlo: každý preset je čistá data struktura — žádné Math.random.
 */

const KOPPEN_CITATION =
  'Peel et al. 2007, Updated world map of the Köppen-Geiger climate classification, Hydrol. Earth Syst. Sci.';

/**
 * Af — Tropical rainforest (Singapore-like).
 * Stabilní 26–28°C celoročně, vysoká vlhkost, časté konvektivní srážky.
 */
const AF_TROPICAL_RAINFOREST: ArchetypePreset = {
  id: 'af-tropical-rainforest',
  category: 'koppen',
  name: 'Tropický deštný prales',
  subtitle: 'Jako Singapur nebo Manaus',
  description:
    'Stabilní vysoké teploty a vlhkost celoročně, časté odpolední bouřky.',
  emoji: '🌴',
  climateZone: 'Af',
  monthlyTemps: [26, 27, 28, 28, 28, 28, 27, 27, 27, 27, 27, 26],
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
      probability: 30,
      cloudRange: [5, 8],
      precipRange: [2, 15],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 13,
      cloudRange: [6, 8],
      precipRange: [10, 40],
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
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [1005, 1015],
  defaultHumidityRange: [70, 95],
  defaultCustomFields: [
    {
      label: 'Dusno',
      possibleValues: ['mírné', 'silné', 'extrémní'],
      probability: 60,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Am — Tropical monsoon (Mumbai-like).
 * Výrazná monzunová sezona, jinak teplo a vlhko.
 */
const AM_TROPICAL_MONSOON: ArchetypePreset = {
  id: 'am-tropical-monsoon',
  category: 'koppen',
  name: 'Tropický monzunový',
  subtitle: 'Jako Bombaj nebo Chittagong',
  description:
    'Vlhká monzunová sezona střídá sušší období, vysoké teploty celoročně.',
  emoji: '🌧️',
  climateZone: 'Am',
  monthlyTemps: [25, 26, 28, 30, 30, 28, 27, 27, 27, 28, 27, 25],
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
      probability: 30,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 25,
      cloudRange: [5, 8],
      precipRange: [3, 30],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 18,
      cloudRange: [7, 8],
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
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [1000, 1015],
  defaultHumidityRange: [65, 95],
  defaultCustomFields: [
    {
      label: 'Monzun',
      possibleValues: ['slabý', 'silný', 'záplavy'],
      probability: 30,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Aw — Tropical savanna (Nairobi-like).
 * Suchá a vlhká sezona, mírnější teploty díky nadmořské výšce.
 */
const AW_TROPICAL_SAVANNA: ArchetypePreset = {
  id: 'aw-tropical-savanna',
  category: 'koppen',
  name: 'Tropická savana',
  subtitle: 'Jako Nairobi nebo Brasília',
  description:
    'Suché a vlhké období se střídají, mírnější teploty díky nadmořské výšce.',
  emoji: '🦒',
  climateZone: 'Aw',
  monthlyTemps: [20, 21, 22, 22, 21, 20, 19, 19, 20, 21, 21, 20],
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
      probability: 30,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 18,
      cloudRange: [5, 8],
      precipRange: [2, 20],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 10,
      cloudRange: [6, 8],
      precipRange: [10, 40],
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
  defaultWindRange: [0, 30],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [1005, 1020],
  defaultHumidityRange: [40, 85],
  defaultCustomFields: [
    {
      label: 'Prach v ovzduší',
      possibleValues: ['nízký', 'střední', 'vysoký'],
      probability: 25,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * BWh — Hot desert (Riyadh-like).
 * Extrémní denní swing, srážky vzácné, prachové bouře.
 */
const BWH_HOT_DESERT: ArchetypePreset = {
  id: 'bwh-hot-desert',
  category: 'koppen',
  name: 'Horká poušť',
  subtitle: 'Jako Rijád nebo Káhira',
  description:
    'Extrémní denní výkyvy teplot, prachové bouře a téměř žádné srážky.',
  emoji: '🏜️',
  climateZone: 'BWh',
  monthlyTemps: [14, 16, 21, 27, 33, 36, 36, 36, 33, 27, 21, 16],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 80,
      cloudRange: [0, 1],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 12,
      cloudRange: [2, 5],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 3,
      cloudRange: [4, 7],
      precipRange: [1, 15],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 4,
      cloudRange: [5, 8],
      precipRange: [5, 30],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 1,
      cloudRange: [3, 6],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 50],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [10, 40],
  defaultCustomFields: [
    {
      label: 'Prachová bouře',
      possibleValues: ['mírná', 'silná', 'haboob'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * BWk — Cold desert (Almaty-like).
 * Velký roční rozsah, suché, kontinentální extrémy.
 */
const BWK_COLD_DESERT: ArchetypePreset = {
  id: 'bwk-cold-desert',
  category: 'koppen',
  name: 'Studená poušť',
  subtitle: 'Jako Almaty nebo Gobi',
  description:
    'Velký rozsah teplot mezi zimou a létem, suchý vzduch a prachové bouře.',
  emoji: '🌵',
  climateZone: 'BWk',
  monthlyTemps: [-5, -3, 4, 13, 18, 22, 25, 25, 19, 11, 4, -3],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 65,
      cloudRange: [0, 2],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 18,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 5,
      cloudRange: [4, 7],
      precipRange: [1, 10],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 3,
      cloudRange: [5, 8],
      precipRange: [5, 25],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 8,
      cloudRange: [5, 8],
      precipRange: [1, 15],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 1,
      cloudRange: [3, 6],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 55],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [1000, 1025],
  defaultHumidityRange: [20, 55],
  defaultCustomFields: [
    {
      label: 'Prachová bouře',
      possibleValues: ['mírná', 'silná'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * BSh — Hot steppe (Cairo-like).
 * Polosuché, mírná zima, horké suché léto.
 */
const BSH_HOT_STEPPE: ArchetypePreset = {
  id: 'bsh-hot-steppe',
  category: 'koppen',
  name: 'Horká stepní oblast',
  subtitle: 'Jako Káhira nebo Madrid',
  description:
    'Polosuchý klimat s mírnou zimou a horkým suchým létem, srážky koncentrované do několika měsíců.',
  emoji: '🌾',
  climateZone: 'BSh',
  monthlyTemps: [13, 14, 16, 20, 24, 27, 28, 28, 26, 23, 19, 14],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 65,
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
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 10,
      cloudRange: [4, 7],
      precipRange: [1, 12],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 3,
      cloudRange: [6, 8],
      precipRange: [5, 25],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 2,
      cloudRange: [3, 6],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [1005, 1020],
  defaultHumidityRange: [25, 65],
  defaultCustomFields: [
    {
      label: 'Sirocco / horký vítr',
      possibleValues: ['žádný', 'mírný', 'silný'],
      probability: 20,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * BSk — Cold steppe (Astana-like).
 * Mrazivá zima, mírné léto, suchý kontinentální klimat.
 */
const BSK_COLD_STEPPE: ArchetypePreset = {
  id: 'bsk-cold-steppe',
  category: 'koppen',
  name: 'Studená stepní oblast',
  subtitle: 'Jako Astana nebo Ulánbátar',
  description:
    'Mrazivá zima a mírné léto, suchý kontinentální klimat se sněhovými bouřemi.',
  emoji: '🌬️',
  climateZone: 'BSk',
  monthlyTemps: [-15, -14, -7, 4, 13, 19, 21, 19, 13, 4, -5, -12],
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
      probability: 8,
      cloudRange: [4, 7],
      precipRange: [1, 12],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 3,
      cloudRange: [6, 8],
      precipRange: [5, 25],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 12,
      cloudRange: [5, 8],
      precipRange: [1, 20],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 2,
      cloudRange: [3, 6],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 50],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [995, 1030],
  defaultHumidityRange: [30, 70],
  defaultCustomFields: [
    {
      label: 'Sněhová bouře / blizzard',
      possibleValues: ['žádná', 'mírná', 'silná'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Csa — Mediterranean hot summer (Athens-like).
 * Horké suché léto, mírná deštivá zima.
 */
const CSA_MEDITERRANEAN_HOT: ArchetypePreset = {
  id: 'csa-mediterranean-hot',
  category: 'koppen',
  name: 'Středomořské (horké léto)',
  subtitle: 'Jako Atény nebo Sevilla',
  description:
    'Horké suché léto a mírná deštivá zima, charakteristické pro pobřeží Středomoří.',
  emoji: '🫒',
  climateZone: 'Csa',
  monthlyTemps: [10, 10, 12, 16, 21, 26, 29, 28, 24, 19, 15, 11],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 50,
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
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 15,
      cloudRange: [5, 8],
      precipRange: [1, 15],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 5,
      cloudRange: [6, 8],
      precipRange: [10, 35],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [1005, 1025],
  defaultHumidityRange: [40, 80],
  defaultCustomFields: [
    {
      label: 'Sirocco / Mistral',
      possibleValues: ['žádný', 'mírný', 'silný'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Csb — Mediterranean warm summer (Porto-like).
 * Mírnější verze Csa s chladnějším létem díky oceánu.
 */
const CSB_MEDITERRANEAN_WARM: ArchetypePreset = {
  id: 'csb-mediterranean-warm',
  category: 'koppen',
  name: 'Středomořské (teplé léto)',
  subtitle: 'Jako Porto nebo San Francisco',
  description:
    'Mírnější středomořský klimat, oceánský vliv tlumí letní extrémy.',
  emoji: '🍇',
  climateZone: 'Csb',
  monthlyTemps: [10, 11, 13, 14, 16, 19, 20, 20, 19, 16, 13, 11],
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
      probability: 30,
      cloudRange: [3, 6],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Déšť',
      icon: 'cloud-rain',
      probability: 18,
      cloudRange: [5, 8],
      precipRange: [1, 18],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 4,
      cloudRange: [6, 8],
      precipRange: [10, 30],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 8,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [1005, 1025],
  defaultHumidityRange: [55, 90],
  defaultCustomFields: [
    {
      label: 'Pobřežní mlha',
      possibleValues: ['žádná', 'mírná', 'hustá'],
      probability: 25,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Cfa — Humid subtropical (Tokyo-like).
 * Vlhké teplé léto, mírná zima, časté monzunové srážky.
 */
const CFA_HUMID_SUBTROPICAL: ArchetypePreset = {
  id: 'cfa-humid-subtropical',
  category: 'koppen',
  name: 'Subtropické vlhké',
  subtitle: 'Jako Tokio nebo Šanghaj',
  description:
    'Vlhké teplé léto a mírná zima, časté monzunové srážky a tajfuny.',
  emoji: '🌸',
  climateZone: 'Cfa',
  monthlyTemps: [5, 6, 9, 14, 18, 22, 26, 27, 23, 18, 12, 8],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 30,
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
      probability: 22,
      cloudRange: [5, 8],
      precipRange: [2, 25],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 7,
      cloudRange: [6, 8],
      precipRange: [10, 50],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 3,
      cloudRange: [5, 8],
      precipRange: [1, 12],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 3,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [995, 1025],
  defaultHumidityRange: [50, 90],
  defaultCustomFields: [
    {
      label: 'Tajfun',
      possibleValues: ['žádný', 'tropická bouře', 'tajfun'],
      probability: 8,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Cfb — Oceanic (Dublin/Londýn-like).
 * Mírné stabilní teploty díky oceánu, časté přeháňky.
 */
const CFB_OCEANIC: ArchetypePreset = {
  id: 'cfb-oceanic',
  category: 'koppen',
  name: 'Mírné oceánské',
  subtitle: 'Jako Dublin nebo Londýn',
  description:
    'Mírné stabilní teploty díky oceánu, časté přeháňky a oblačnost.',
  emoji: '☁️',
  climateZone: 'Cfb',
  monthlyTemps: [5, 5, 7, 8, 11, 14, 16, 16, 14, 11, 8, 6],
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
      precipRange: [1, 15],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 3,
      cloudRange: [6, 8],
      precipRange: [10, 30],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 2,
      cloudRange: [5, 8],
      precipRange: [1, 10],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 8,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 50],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [990, 1025],
  defaultHumidityRange: [65, 95],
  defaultCustomFields: [
    {
      label: 'Atlantická bouře',
      possibleValues: ['žádná', 'mírná', 'silný vítr'],
      probability: 15,
    },
    {
      label: 'Ledovka',
      possibleValues: ['žádná', 'mírná', 'silná'],
      probability: 5,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Dfa — Continental hot summer (Chicago-like).
 * Studená zima, horké léto, kontinentální výkyvy.
 */
const DFA_CONTINENTAL_HOT: ArchetypePreset = {
  id: 'dfa-continental-hot',
  category: 'koppen',
  name: 'Kontinentální (horké léto)',
  subtitle: 'Jako Chicago nebo Toronto',
  description:
    'Studená zasněžená zima a horké vlhké léto, výrazné kontinentální výkyvy.',
  emoji: '🌽',
  climateZone: 'Dfa',
  monthlyTemps: [-3, -1, 5, 11, 17, 23, 25, 24, 20, 13, 6, -1],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 35,
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
      precipRange: [1, 20],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 7,
      cloudRange: [6, 8],
      precipRange: [10, 50],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 10,
      cloudRange: [5, 8],
      precipRange: [1, 20],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 3,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 45],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [990, 1030],
  defaultHumidityRange: [40, 90],
  defaultCustomFields: [
    {
      label: 'Blizzard',
      possibleValues: ['žádný', 'mírný', 'silný'],
      probability: 10,
    },
    {
      label: 'Tornádo',
      possibleValues: ['žádné', 'pozorováno'],
      probability: 3,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Dfb — Continental warm summer (Praha-like).
 * Praha-like — mírná zima se sněhem, teplé léto s bouřkami.
 */
const DFB_CONTINENTAL_WARM: ArchetypePreset = {
  id: 'dfb-continental-warm',
  category: 'koppen',
  name: 'Kontinentální (mírné léto)',
  subtitle: 'Jako Praha nebo Berlín',
  description:
    'Mírná zima se sněhem a teplé léto s občasnými bouřkami, čtyři výrazná období.',
  emoji: '🍂',
  climateZone: 'Dfb',
  monthlyTemps: [-1, 0, 4, 9, 14, 17, 19, 19, 14, 9, 4, 0],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 30,
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
      precipRange: [1, 18],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 5,
      cloudRange: [6, 8],
      precipRange: [10, 40],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 8,
      cloudRange: [5, 8],
      precipRange: [1, 15],
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
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [990, 1030],
  defaultHumidityRange: [50, 90],
  defaultCustomFields: [
    {
      label: 'Ledovka',
      possibleValues: ['žádná', 'mírná', 'silná'],
      probability: 12,
    },
    {
      label: 'Sněhové jazyky',
      possibleValues: ['žádné', 'lokální', 'rozsáhlé'],
      probability: 8,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * Dfc — Subarctic taiga (Krasnoyarsk-like).
 * Extrémně studená zima, krátké chladné léto, jehličnaté lesy.
 */
const DFC_SUBARCTIC: ArchetypePreset = {
  id: 'dfc-subarctic',
  category: 'koppen',
  name: 'Subarktická tajga',
  subtitle: 'Jako Krasnojarsk nebo Whitehorse',
  description:
    'Extrémně studená zima a krátké chladné léto, dlouhé období se sněhem.',
  emoji: '🌲',
  climateZone: 'Dfc',
  monthlyTemps: [-19, -16, -8, 2, 10, 17, 19, 16, 9, 1, -8, -16],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 30,
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
      probability: 10,
      cloudRange: [5, 8],
      precipRange: [1, 15],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 3,
      cloudRange: [6, 8],
      precipRange: [5, 25],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 22,
      cloudRange: [5, 8],
      precipRange: [1, 20],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 45],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [985, 1035],
  defaultHumidityRange: [55, 95],
  defaultCustomFields: [
    {
      label: 'Polární záře',
      possibleValues: ['neviditelná', 'viditelná', 'silná'],
      probability: 20,
    },
    {
      label: 'Sněhová bouře',
      possibleValues: ['žádná', 'mírná', 'silná'],
      probability: 15,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * ET — Tundra (Murmansk-like).
 * Polární klimat, krátké chladné léto, žádné stromy.
 */
const ET_TUNDRA: ArchetypePreset = {
  id: 'et-tundra',
  category: 'koppen',
  name: 'Tundra',
  subtitle: 'Jako Murmansk nebo Nuuk',
  description:
    'Polární klimat s krátkým chladným létem, polární noc a den se střídají.',
  emoji: '🐧',
  climateZone: 'ET',
  monthlyTemps: [-10, -10, -7, -2, 4, 10, 13, 11, 6, 0, -5, -8],
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
      probability: 8,
      cloudRange: [5, 8],
      precipRange: [1, 10],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 2,
      cloudRange: [6, 8],
      precipRange: [5, 20],
    },
    {
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 22,
      cloudRange: [5, 8],
      precipRange: [1, 20],
    },
    {
      type: 'fog',
      label: 'Mlha',
      icon: 'cloud-fog',
      probability: 8,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 55],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [980, 1030],
  defaultHumidityRange: [65, 95],
  defaultCustomFields: [
    {
      label: 'Polární záře',
      possibleValues: ['neviditelná', 'viditelná', 'silná'],
      probability: 25,
    },
    {
      label: 'Blizzard',
      possibleValues: ['žádný', 'mírný', 'silný'],
      probability: 18,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

/**
 * EF — Ice cap (Vostok-like).
 * Extrémní permafrost, teploty pod nulou celoročně.
 */
const EF_ICE_CAP: ArchetypePreset = {
  id: 'ef-ice-cap',
  category: 'koppen',
  name: 'Ledovcová pustina',
  subtitle: 'Jako Vostok nebo grónský vnitrozemský led',
  description:
    'Extrémní mráz celoročně, vichřice a katabatické větry nad ledovcem.',
  emoji: '🧊',
  climateZone: 'EF',
  monthlyTemps: [-32, -45, -58, -65, -65, -65, -67, -68, -66, -57, -42, -32],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Slunečno',
      icon: 'sun',
      probability: 30,
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
      type: 'snow',
      label: 'Sníh',
      icon: 'cloud-snow',
      probability: 25,
      cloudRange: [5, 8],
      precipRange: [0, 5],
    },
    {
      type: 'storm',
      label: 'Vichřice',
      icon: 'cloud-lightning',
      probability: 5,
      cloudRange: [6, 8],
      precipRange: [1, 10],
    },
    {
      type: 'fog',
      label: 'Ledová mlha',
      icon: 'cloud-fog',
      probability: 5,
      cloudRange: [4, 7],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [10, 80],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [970, 1030],
  defaultHumidityRange: [40, 80],
  defaultCustomFields: [
    {
      label: 'Katabatický vítr',
      possibleValues: ['mírný', 'silný', 'extrémní'],
      probability: 40,
    },
    {
      label: 'Whiteout',
      possibleValues: ['žádný', 'částečný', 'úplný'],
      probability: 20,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: KOPPEN_CITATION,
};

export const KOPPEN_ARCHETYPES: readonly ArchetypePreset[] = [
  AF_TROPICAL_RAINFOREST,
  AM_TROPICAL_MONSOON,
  AW_TROPICAL_SAVANNA,
  BWH_HOT_DESERT,
  BWK_COLD_DESERT,
  BSH_HOT_STEPPE,
  BSK_COLD_STEPPE,
  CSA_MEDITERRANEAN_HOT,
  CSB_MEDITERRANEAN_WARM,
  CFA_HUMID_SUBTROPICAL,
  CFB_OCEANIC,
  DFA_CONTINENTAL_HOT,
  DFB_CONTINENTAL_WARM,
  DFC_SUBARCTIC,
  ET_TUNDRA,
  EF_ICE_CAP,
] as const;
