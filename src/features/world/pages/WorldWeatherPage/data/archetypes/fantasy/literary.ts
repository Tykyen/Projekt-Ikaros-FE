import type { ArchetypePreset } from '../types';

/**
 * Fantasy literární lokace — 28 presetů ze 7 fantasy světů
 * (Středozem, Westeros/Essos, Faerůn, Witcher, Tamriel).
 *
 * sourceLevel: per-preset — převážně ANALOGY z primárních literárních zdrojů
 * + heuristic mapping na Köppen zóny pro variance model. INFERRED tam kde
 * autorský zdroj uvádí jen kvalitativní popis.
 */

const TOLKIEN_CITATION =
  'Fonstad K.W. 1981, The Atlas of Middle-Earth (Houghton Mifflin); Tolkien letters No. 144, 154';
const MARTIN_CITATION =
  'Martin G.R.R., A World of Ice and Fire (2014, Bantam); ASOIAF wiki climate sections';
const FAERUN_CITATION =
  'Greenwood E. et al., Forgotten Realms Campaign Setting 3rd ed. 2001 (WotC); Volos Guide to All Things Magical 1996';
const WITCHER_CITATION =
  'Sapkowski A., The Witcher saga (1986-1999, SuperNowa); CD Projekt RED Witcher 3 game data';
const TAMRIEL_CITATION =
  'Bethesda Softworks, Pocket Guide to the Empire 1st ed. (1998), 3rd ed. (2007); in-game lore books';

// ===== STŘEDOZEM (7) =====

const MIDDLE_EARTH_SHIRE: ArchetypePreset = {
  id: 'middle-earth-shire',
  category: 'fantasy',
  name: 'Kraj — Středozem',
  subtitle: 'Inspirováno: Tolkien, anglický venkov',
  description:
    'Mírná, zelená krajina, časté mlhy, klidné podzimní deště.',
  emoji: '🌿',
  climateZone: 'Cfb',
  monthlyTemps: [4, 5, 7, 9, 12, 15, 17, 17, 14, 11, 7, 5],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 25, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [10, 25] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 2, cloudRange: [5, 8], precipRange: [1, 8] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 10, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [995, 1025],
  defaultHumidityRange: [60, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Mlha', 'Mírný déšť'], probability: 20 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: TOLKIEN_CITATION,
};

const MIDDLE_EARTH_MORDOR: ArchetypePreset = {
  id: 'middle-earth-mordor',
  category: 'fantasy',
  name: 'Mordor — Středozem',
  subtitle: 'Inspirováno: Tolkien, vulkanická pustina',
  description:
    'Sirné výpary, sopečný popel, žhavé větry z Hory Osudu.',
  emoji: '🌋',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [25, 28, 32, 35, 38, 42, 45, 45, 40, 35, 30, 25],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Spáleno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Popelová oblaka', icon: 'cloud', probability: 45, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'storm', label: 'Sopečná bouře', icon: 'cloud-lightning', probability: 15, cloudRange: [7, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Sirné výpary', icon: 'cloud-fog', probability: 10, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [10, 60],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [990, 1020],
  defaultHumidityRange: [5, 30],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Vulkanický popel', 'Sirné výpary', 'Žhavý vítr'], probability: 60 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${TOLKIEN_CITATION}; analogie Yellowstone caldera + Sahara`,
};

const MIDDLE_EARTH_FOROCHEL: ArchetypePreset = {
  id: 'middle-earth-forochel',
  category: 'fantasy',
  name: 'Forochel — Středozem',
  subtitle: 'Inspirováno: Tolkien, severní mrazivý záliv',
  description:
    'Trvalý mráz, blizzardy, mrznoucí mlha nad ledovým mořem.',
  emoji: '🧊',
  climateZone: 'EF',
  monthlyTemps: [-30, -28, -22, -12, -2, 5, 8, 6, 0, -10, -20, -28],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Mrazivo jasno', icon: 'sun', probability: 20, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 30, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Blizzard', icon: 'cloud-lightning', probability: 10, cloudRange: [7, 8], precipRange: [2, 12] },
    { type: 'fog', label: 'Mrznoucí mlha', icon: 'cloud-fog', probability: 10, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 70],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [975, 1030],
  defaultHumidityRange: [50, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Blizzard', 'Mrznoucí mlha', 'Whiteout'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${TOLKIEN_CITATION}; analogie arktická pustina`,
};

const MIDDLE_EARTH_HARAD: ArchetypePreset = {
  id: 'middle-earth-harad',
  category: 'fantasy',
  name: 'Harad — Středozem',
  subtitle: 'Inspirováno: Tolkien, jižní pouště',
  description:
    'Spalující sluneční žár, písečné bouře, oázy s mumakily.',
  emoji: '🏜️',
  climateZone: 'BWh',
  monthlyTemps: [15, 18, 24, 30, 36, 42, 45, 45, 40, 32, 24, 17],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Spalující slunce', icon: 'sun', probability: 75, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Zamračeno', icon: 'cloud', probability: 12, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Vzácný déšť', icon: 'cloud-rain', probability: 3, cloudRange: [4, 7], precipRange: [1, 10] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 8, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Pouštní opar', icon: 'cloud-fog', probability: 2, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 60],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [5, 35],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Písečná bouře', 'Žízeň', 'Spálení'], probability: 30 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${TOLKIEN_CITATION}; analogie Sahara`,
};

const MIDDLE_EARTH_ROHAN: ArchetypePreset = {
  id: 'middle-earth-rohan',
  category: 'fantasy',
  name: 'Rohan — Středozem',
  subtitle: 'Inspirováno: Tolkien, jezdecké stepi',
  description:
    'Otevřené travnaté pláně, ostrý vichr, sněhové bouře v zimě.',
  emoji: '🐎',
  climateZone: 'BSk',
  monthlyTemps: [-3, -1, 4, 10, 16, 20, 23, 22, 17, 10, 4, -1],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 45, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 28, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 10, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 10, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'fog', label: 'Stepní mlha', icon: 'cloud-fog', probability: 3, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 55],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [990, 1030],
  defaultHumidityRange: [30, 70],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Stepní vichr', 'Sníh', 'Ledovka'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${TOLKIEN_CITATION}; analogie ukrajinská step`,
};

const MIDDLE_EARTH_RIVENDELL: ArchetypePreset = {
  id: 'middle-earth-rivendell',
  category: 'fantasy',
  name: 'Roklinka — Středozem',
  subtitle: 'Inspirováno: Tolkien, alpské údolí',
  description:
    'Skryté údolí s mírným klimatem, mlhy nad vodopády, věčná elfská záře.',
  emoji: '🍃',
  climateZone: 'Csb',
  monthlyTemps: [3, 4, 7, 11, 15, 18, 20, 20, 17, 12, 7, 4],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 35, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 18, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [10, 25] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 2, cloudRange: [5, 8], precipRange: [1, 8] },
    { type: 'fog', label: 'Údolní mlha', icon: 'cloud-fog', probability: 12, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 20],
  defaultWindGustMultiplier: 1.4,
  defaultPressureRange: [1000, 1025],
  defaultHumidityRange: [55, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Mlha v údolí'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${TOLKIEN_CITATION}; analogie Lauterbrunnen (Švýcarsko)`,
};

const MIDDLE_EARTH_MIRKWOOD: ArchetypePreset = {
  id: 'middle-earth-mirkwood',
  category: 'fantasy',
  name: 'Temný hvozd — Středozem',
  subtitle: 'Inspirováno: Tolkien, prastarý hvozd',
  description:
    'Hustá vegetace, věčná mlha, magické světlušky a pavoučí vlákna.',
  emoji: '🕸️',
  climateZone: 'Dfc',
  monthlyTemps: [-12, -10, -5, 2, 8, 13, 16, 15, 10, 4, -3, -10],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Vzácné jasno', icon: 'sun', probability: 15, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Zamračeno', icon: 'cloud', probability: 35, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 15, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 10, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 5, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'fog', label: 'Hustá mlha', icon: 'cloud-fog', probability: 20, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 15],
  defaultWindGustMultiplier: 1.3,
  defaultPressureRange: [985, 1025],
  defaultHumidityRange: [70, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Hustá mlha', 'Magické světlušky', 'Pavouci'], probability: 40 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: `${TOLKIEN_CITATION}; INFERRED z popisu The Hobbit kap. 8`,
};

// ===== WESTEROS + ESSOS (8) =====

const WESTEROS_BEYOND_WALL: ArchetypePreset = {
  id: 'westeros-beyond-wall',
  category: 'fantasy',
  name: 'Za Zdí — Westeros',
  subtitle: 'Inspirováno: G.R.R. Martin, severní pustina',
  description:
    'Trvalý mráz, blizzardy, hrozba Bílých chodců.',
  emoji: '❄️',
  climateZone: 'EF',
  monthlyTemps: [-25, -22, -18, -12, -5, 0, 3, 2, -3, -10, -18, -23],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 20, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 30, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Blizzard', icon: 'cloud-lightning', probability: 12, cloudRange: [7, 8], precipRange: [2, 15] },
    { type: 'fog', label: 'Mrznoucí mlha', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 80],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [970, 1030],
  defaultHumidityRange: [55, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Blizzard', 'Bílí chodci', 'Whiteout'], probability: 40 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: MARTIN_CITATION,
};

const WESTEROS_NORTH: ArchetypePreset = {
  id: 'westeros-north',
  category: 'fantasy',
  name: 'Sever — Westeros',
  subtitle: 'Inspirováno: G.R.R. Martin, Stark domovina',
  description:
    'Dlouhé zimy, husté lesy a mlhy nad bažinami.',
  emoji: '🐺',
  climateZone: 'Dfc',
  monthlyTemps: [-10, -8, -3, 3, 8, 12, 14, 13, 9, 3, -3, -8],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 12, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 20, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 10, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 50],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [980, 1030],
  defaultHumidityRange: [55, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Sníh', 'Mlha', 'Vlci'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: MARTIN_CITATION,
};

const WESTEROS_RIVERLANDS: ArchetypePreset = {
  id: 'westeros-riverlands',
  category: 'fantasy',
  name: 'Říční kraje — Westeros',
  subtitle: 'Inspirováno: G.R.R. Martin, povodí Trojzubce',
  description:
    'Plodná údolí, časté záplavy, mlha nad řekami.',
  emoji: '🏞️',
  climateZone: 'Cfb',
  monthlyTemps: [3, 4, 7, 11, 15, 18, 20, 20, 17, 12, 7, 4],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 25, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 5, cloudRange: [6, 8], precipRange: [10, 35] },
    { type: 'fog', label: 'Říční mlha', icon: 'cloud-fog', probability: 10, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 30],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [990, 1025],
  defaultHumidityRange: [65, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Záplavy', 'Mlha'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: MARTIN_CITATION,
};

const WESTEROS_DORNE: ArchetypePreset = {
  id: 'westeros-dorne',
  category: 'fantasy',
  name: 'Dorne — Westeros',
  subtitle: 'Inspirováno: G.R.R. Martin, jižní písčiny',
  description:
    'Vyprahlá poušť, písečné bouře, pikantní kultura.',
  emoji: '🌶️',
  climateZone: 'BWh',
  monthlyTemps: [15, 17, 21, 26, 32, 37, 40, 40, 35, 28, 22, 17],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 75, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 12, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Vzácný déšť', icon: 'cloud-rain', probability: 4, cloudRange: [4, 7], precipRange: [1, 12] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 7, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Opar', icon: 'cloud-fog', probability: 2, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 55],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [10, 40],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Písečná bouře', 'Žízeň'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: MARTIN_CITATION,
};

const WESTEROS_IRON_ISLANDS: ArchetypePreset = {
  id: 'westeros-iron-islands',
  category: 'fantasy',
  name: 'Železné ostrovy — Westeros',
  subtitle: 'Inspirováno: G.R.R. Martin, drsné pobřeží',
  description:
    'Skalnaté ostrovy, vichřice, věčné mlhy nad zálivy.',
  emoji: '⚓',
  climateZone: 'Cfb',
  monthlyTemps: [3, 3, 5, 7, 10, 13, 15, 15, 13, 10, 7, 5],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Vzácné jasno', icon: 'sun', probability: 15, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Zamračeno', icon: 'cloud', probability: 40, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 25, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Mořská bouře', icon: 'cloud-lightning', probability: 8, cloudRange: [7, 8], precipRange: [10, 35] },
    { type: 'fog', label: 'Pobřežní mlha', icon: 'cloud-fog', probability: 12, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [10, 75],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [975, 1025],
  defaultHumidityRange: [70, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Vichr', 'Mlha', 'Vlnobití'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${MARTIN_CITATION}; analogie Skotsko (Hebridy)`,
};

const ESSOS_VOLANTIS: ArchetypePreset = {
  id: 'essos-volantis',
  category: 'fantasy',
  name: 'Volantis — Essos',
  subtitle: 'Inspirováno: G.R.R. Martin, otrokářské město v deltě',
  description:
    'Vlhké subtropické město v deltě řeky, malárie, parna.',
  emoji: '🐉',
  climateZone: 'BWh',
  monthlyTemps: [18, 20, 24, 28, 32, 35, 37, 37, 33, 28, 23, 19],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 55, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 20, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 12, cloudRange: [5, 8], precipRange: [2, 18] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 8, cloudRange: [6, 8], precipRange: [10, 35] },
    { type: 'fog', label: 'Říční mlha', icon: 'cloud-fog', probability: 5, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [60, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Vlhko', 'Malárie'], probability: 30 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: MARTIN_CITATION,
};

const ESSOS_SLAVERS_BAY: ArchetypePreset = {
  id: 'essos-slavers-bay',
  category: 'fantasy',
  name: 'Otrokářský záliv — Essos',
  subtitle: 'Inspirováno: G.R.R. Martin, písčiny u Meereenu',
  description:
    'Spalující pobřeží, písečné bouře, dračí oheň nad pyramidami.',
  emoji: '🔥',
  climateZone: 'BWh',
  monthlyTemps: [20, 22, 26, 30, 34, 37, 39, 38, 34, 29, 24, 21],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 70, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 15, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Vzácný déšť', icon: 'cloud-rain', probability: 4, cloudRange: [4, 7], precipRange: [1, 10] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 8, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Opar', icon: 'cloud-fog', probability: 3, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 50],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [15, 45],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Písečná bouře', 'Dračí oheň'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: MARTIN_CITATION,
};

const ESSOS_ASSHAI: ArchetypePreset = {
  id: 'essos-asshai',
  category: 'fantasy',
  name: 'Asshai — Essos',
  subtitle: 'Inspirováno: G.R.R. Martin, město stínů',
  description:
    'Tmavé město bez ptáků a koní, stínová mlha, magické temnoty.',
  emoji: '🌑',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [15, 15, 16, 17, 18, 19, 20, 20, 19, 18, 17, 16],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Šerou jasno', icon: 'sun', probability: 15, cloudRange: [2, 4], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Trvalé šero', icon: 'cloud', probability: 50, cloudRange: [5, 8], precipRange: [0, 0] },
    { type: 'rain', label: 'Černý déšť', icon: 'cloud-rain', probability: 10, cloudRange: [6, 8], precipRange: [1, 10] },
    { type: 'storm', label: 'Stínová bouře', icon: 'cloud-lightning', probability: 5, cloudRange: [7, 8], precipRange: [5, 20] },
    { type: 'fog', label: 'Stínová mlha', icon: 'cloud-fog', probability: 20, cloudRange: [6, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 20],
  defaultWindGustMultiplier: 1.3,
  defaultPressureRange: [995, 1015],
  defaultHumidityRange: [60, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Stínová mlha', 'Magická tma'], probability: 50 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: `${MARTIN_CITATION}; INFERRED z atlas-textu sekce Asshai`,
};

// ===== FAERŮN / FORGOTTEN REALMS (5) =====

const FAERUN_HEARTLANDS: ArchetypePreset = {
  id: 'faerun-heartlands',
  category: 'fantasy',
  name: 'Heartlands — Faerůn',
  subtitle: 'Inspirováno: Forgotten Realms, centrální regiony',
  description:
    'Mírný klimat středního Faerůnu, časté mlhy a déšť.',
  emoji: '🏰',
  climateZone: 'Cfb',
  monthlyTemps: [-1, 0, 4, 9, 14, 18, 20, 20, 16, 10, 5, 1],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 28, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 20, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [6, 8], precipRange: [10, 30] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 5, cloudRange: [5, 8], precipRange: [1, 10] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [990, 1025],
  defaultHumidityRange: [55, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Mlha', 'Déšť'], probability: 20 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${FAERUN_CITATION}; analogie střední Evropa`,
};

const FAERUN_FROZENFAR: ArchetypePreset = {
  id: 'faerun-frozenfar',
  category: 'fantasy',
  name: 'Frozenfar — Faerůn',
  subtitle: 'Inspirováno: Forgotten Realms, severní mrazivé pustiny',
  description:
    'Extrémní mráz, polární medvědi, blizzardy nad ledovým hřebenem.',
  emoji: '🐻‍❄️',
  climateZone: 'EF',
  monthlyTemps: [-35, -32, -25, -15, -5, 2, 6, 4, -3, -15, -25, -32],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Mrazivo', icon: 'sun', probability: 20, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 28, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 32, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Blizzard', icon: 'cloud-lightning', probability: 12, cloudRange: [7, 8], precipRange: [2, 15] },
    { type: 'fog', label: 'Mrznoucí mlha', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [10, 85],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [970, 1030],
  defaultHumidityRange: [50, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Blizzard', 'Polární medvědi', 'Whiteout'], probability: 40 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: FAERUN_CITATION,
};

const FAERUN_ANAUROCH: ArchetypePreset = {
  id: 'faerun-anauroch',
  category: 'fantasy',
  name: 'Anauroch — Faerůn',
  subtitle: 'Inspirováno: Forgotten Realms, Velká poušť',
  description:
    'Magicky vytvořená poušť, písečné bouře, iluze v opar.',
  emoji: '🏜️',
  climateZone: 'BWh',
  monthlyTemps: [12, 15, 20, 27, 35, 40, 43, 43, 38, 30, 22, 14],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 78, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 10, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Vzácný déšť', icon: 'cloud-rain', probability: 2, cloudRange: [4, 7], precipRange: [1, 10] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 8, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Magický opar', icon: 'cloud-fog', probability: 2, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 60],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [5, 30],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Písečná bouře', 'Magické iluze'], probability: 30 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: FAERUN_CITATION,
};

const FAERUN_CALIMSHAN: ArchetypePreset = {
  id: 'faerun-calimshan',
  category: 'fantasy',
  name: 'Calimshan — Faerůn',
  subtitle: 'Inspirováno: Forgotten Realms, jižní pouštní království',
  description:
    'Žhavé jižní království, písečné bouře, genie z lamp.',
  emoji: '🧞',
  climateZone: 'BWh',
  monthlyTemps: [16, 18, 22, 27, 32, 36, 38, 38, 34, 28, 22, 18],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 72, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 13, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Vzácný déšť', icon: 'cloud-rain', probability: 5, cloudRange: [4, 7], precipRange: [1, 10] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 7, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Opar', icon: 'cloud-fog', probability: 3, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 50],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [15, 45],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Písečná bouře', 'Genie'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: FAERUN_CITATION,
};

const FAERUN_UNDERDARK: ArchetypePreset = {
  id: 'faerun-underdark',
  category: 'fantasy',
  name: 'Underdark — Faerůn',
  subtitle: 'Inspirováno: Forgotten Realms, podzemní svět',
  description:
    'Konstantní podzemní teplota, žádný vítr, zatuchlý vzduch.',
  emoji: '🕳️',
  climateZone: 'CONTROLLED',
  monthlyTemps: [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
  defaultWeatherTypes: [
    { type: 'cloudy', label: 'Tma', icon: 'cloud', probability: 70, cloudRange: [8, 8], precipRange: [0, 0] },
    { type: 'fog', label: 'Zatuchlost', icon: 'cloud-fog', probability: 25, cloudRange: [6, 8], precipRange: [0, 0] },
    { type: 'rain', label: 'Kapající voda', icon: 'cloud-rain', probability: 5, cloudRange: [8, 8], precipRange: [0, 2] },
  ],
  defaultWindRange: [0, 5],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [85, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Zatuchlost', 'Žádný vítr', 'Tma'], probability: 80 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: `${FAERUN_CITATION}; analogie reálné jeskyně (Mammoth Cave roční průměr)`,
};

// ===== WITCHER (3) =====

const WITCHER_VELEN: ArchetypePreset = {
  id: 'witcher-velen',
  category: 'fantasy',
  name: 'Velen — Witcher',
  subtitle: 'Inspirováno: Sapkowski, válkou rozervané mokřady',
  description:
    'Mokřady plné monster, husté mlhy, šedivé nebe.',
  emoji: '🪦',
  climateZone: 'Cfb',
  monthlyTemps: [-3, -1, 3, 8, 13, 16, 18, 17, 13, 8, 3, -1],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Vzácné jasno', icon: 'sun', probability: 18, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Zamračeno', icon: 'cloud', probability: 40, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 22, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [6, 8], precipRange: [10, 30] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 3, cloudRange: [5, 8], precipRange: [1, 10] },
    { type: 'fog', label: 'Bažinatá mlha', icon: 'cloud-fog', probability: 13, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 30],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [985, 1020],
  defaultHumidityRange: [70, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Mokřady', 'Monstra v mlze'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: WITCHER_CITATION,
};

const WITCHER_SKELLIGE: ArchetypePreset = {
  id: 'witcher-skellige',
  category: 'fantasy',
  name: 'Skellige — Witcher',
  subtitle: 'Inspirováno: Sapkowski, severské ostrovy',
  description:
    'Drsné severní moře, vichr, sirény a draugy.',
  emoji: '⛵',
  climateZone: 'Dfc',
  monthlyTemps: [-2, -1, 2, 5, 9, 13, 15, 14, 11, 7, 3, 0],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 18, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Zamračeno', icon: 'cloud', probability: 35, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 20, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Mořská bouře', icon: 'cloud-lightning', probability: 10, cloudRange: [7, 8], precipRange: [10, 35] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 10, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'fog', label: 'Mořská mlha', icon: 'cloud-fog', probability: 7, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [10, 80],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [970, 1025],
  defaultHumidityRange: [70, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Vichr', 'Sirény', 'Draugy'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: WITCHER_CITATION,
};

const WITCHER_TOUSSAINT: ArchetypePreset = {
  id: 'witcher-toussaint',
  category: 'fantasy',
  name: 'Toussaint — Witcher',
  subtitle: 'Inspirováno: Sapkowski, vinařské království',
  description:
    'Slunné vinice, mírné středomořské počasí, upíři v noci.',
  emoji: '🍷',
  climateZone: 'Csa',
  monthlyTemps: [8, 9, 12, 16, 20, 24, 27, 27, 23, 18, 13, 9],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 52, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 25, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 13, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 5, cloudRange: [6, 8], precipRange: [10, 30] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 5, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 30],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [1005, 1025],
  defaultHumidityRange: [40, 80],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Upíři', 'Vinice'], probability: 20 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: WITCHER_CITATION,
};

// ===== TAMRIEL / ELDER SCROLLS (5) =====

const TAMRIEL_SKYRIM: ArchetypePreset = {
  id: 'tamriel-skyrim',
  category: 'fantasy',
  name: 'Skyrim — Tamriel',
  subtitle: 'Inspirováno: Elder Scrolls, severní hory',
  description:
    'Hornaté tundry, blizzardy, sídla draků pod ledovými vrcholy.',
  emoji: '🐲',
  climateZone: 'Dfc',
  monthlyTemps: [-15, -13, -8, -2, 4, 9, 11, 10, 5, -1, -8, -13],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 28, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 8, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 25, cloudRange: [5, 8], precipRange: [1, 18] },
    { type: 'storm', label: 'Blizzard', icon: 'cloud-lightning', probability: 8, cloudRange: [7, 8], precipRange: [2, 15] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 6, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 60],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [980, 1030],
  defaultHumidityRange: [50, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Blizzard', 'Draci'], probability: 30 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: TAMRIEL_CITATION,
};

const TAMRIEL_HAMMERFELL: ArchetypePreset = {
  id: 'tamriel-hammerfell',
  category: 'fantasy',
  name: 'Hammerfell — Tamriel',
  subtitle: 'Inspirováno: Elder Scrolls, redguardská poušť',
  description:
    'Žhavá poušť, písečné bouře, oázy a kamenné věže.',
  emoji: '🗡️',
  climateZone: 'BWh',
  monthlyTemps: [16, 19, 24, 30, 35, 40, 42, 42, 37, 30, 23, 18],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 75, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 12, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Vzácný déšť', icon: 'cloud-rain', probability: 3, cloudRange: [4, 7], precipRange: [1, 10] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 8, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Opar', icon: 'cloud-fog', probability: 2, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 55],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [10, 40],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Písečná bouře', 'Žízeň'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: TAMRIEL_CITATION,
};

const TAMRIEL_CYRODIIL: ArchetypePreset = {
  id: 'tamriel-cyrodiil',
  category: 'fantasy',
  name: 'Cyrodiil — Tamriel',
  subtitle: 'Inspirováno: Elder Scrolls, srdce Tamrielu',
  description:
    'Mírné centrální království, oblačnost a časté deště.',
  emoji: '🏛️',
  climateZone: 'Cfb',
  monthlyTemps: [3, 4, 7, 11, 15, 19, 21, 21, 17, 12, 7, 4],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 22, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [6, 8], precipRange: [10, 30] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 3, cloudRange: [5, 8], precipRange: [1, 8] },
    { type: 'fog', label: 'Mlha', icon: 'cloud-fog', probability: 6, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [990, 1025],
  defaultHumidityRange: [55, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Déšť'], probability: 20 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: TAMRIEL_CITATION,
};

const TAMRIEL_BLACK_MARSH: ArchetypePreset = {
  id: 'tamriel-black-marsh',
  category: 'fantasy',
  name: 'Black Marsh — Tamriel',
  subtitle: 'Inspirováno: Elder Scrolls, Argonianské bažiny',
  description:
    'Tropické bažiny, vlhko, jedovatí hadi a pradávné stromy.',
  emoji: '🐊',
  climateZone: 'Af',
  monthlyTemps: [22, 22, 23, 24, 25, 26, 27, 27, 26, 25, 24, 22],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 15, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 30, cloudRange: [5, 8], precipRange: [2, 20] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 12, cloudRange: [6, 8], precipRange: [15, 50] },
    { type: 'fog', label: 'Bažinatá mlha', icon: 'cloud-fog', probability: 8, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [1000, 1015],
  defaultHumidityRange: [75, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Vlhkost', 'Jedovatí hadi'], probability: 40 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: TAMRIEL_CITATION,
};

const TAMRIEL_MORROWIND: ArchetypePreset = {
  id: 'tamriel-morrowind',
  category: 'fantasy',
  name: 'Morrowind — Tamriel',
  subtitle: 'Inspirováno: Elder Scrolls, Dunmer sopečná pustina',
  description:
    'Sopečný popel, pelinální bouře, hroty Rudé hory.',
  emoji: '🌋',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [12, 14, 18, 23, 28, 32, 34, 33, 28, 22, 17, 13],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Šeré jasno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Popelová oblaka', icon: 'cloud', probability: 35, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'rain', label: 'Kyselý déšť', icon: 'cloud-rain', probability: 8, cloudRange: [5, 8], precipRange: [1, 10] },
    { type: 'storm', label: 'Pelinální bouře', icon: 'cloud-lightning', probability: 22, cloudRange: [7, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Popelový opar', icon: 'cloud-fog', probability: 10, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 65],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [985, 1020],
  defaultHumidityRange: [20, 60],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Sopečný popel', 'Pelinální bouře'], probability: 45 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: TAMRIEL_CITATION,
};

export const LITERARY_PRESETS: readonly ArchetypePreset[] = [
  MIDDLE_EARTH_SHIRE,
  MIDDLE_EARTH_MORDOR,
  MIDDLE_EARTH_FOROCHEL,
  MIDDLE_EARTH_HARAD,
  MIDDLE_EARTH_ROHAN,
  MIDDLE_EARTH_RIVENDELL,
  MIDDLE_EARTH_MIRKWOOD,
  WESTEROS_BEYOND_WALL,
  WESTEROS_NORTH,
  WESTEROS_RIVERLANDS,
  WESTEROS_DORNE,
  WESTEROS_IRON_ISLANDS,
  ESSOS_VOLANTIS,
  ESSOS_SLAVERS_BAY,
  ESSOS_ASSHAI,
  FAERUN_HEARTLANDS,
  FAERUN_FROZENFAR,
  FAERUN_ANAUROCH,
  FAERUN_CALIMSHAN,
  FAERUN_UNDERDARK,
  WITCHER_VELEN,
  WITCHER_SKELLIGE,
  WITCHER_TOUSSAINT,
  TAMRIEL_SKYRIM,
  TAMRIEL_HAMMERFELL,
  TAMRIEL_CYRODIIL,
  TAMRIEL_BLACK_MARSH,
  TAMRIEL_MORROWIND,
] as const;
