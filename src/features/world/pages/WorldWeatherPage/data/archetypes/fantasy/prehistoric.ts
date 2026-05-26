import type { ArchetypePreset } from '../types';

/**
 * Prehistorická období — 4 presety (křída, doba ledová, karbon, perm).
 *
 * sourceLevel: ANALOGY (paleoclimate proxy data — δ¹⁸O, sediments).
 * Hodnoty vychází z reálných paleoklimatických modelů (Hay & Floegel,
 * Clark, Berner) — odlišnost od dnešní Země je dokumentovaná, ale denní
 * variabilita je odhad analogií k současným biomům.
 */

const PREHISTORIC_CRETACEOUS: ArchetypePreset = {
  id: 'prehistoric-cretaceous',
  category: 'fantasy',
  name: 'Křídové tropy',
  subtitle: 'Doba dinosaurů, 100 mil. let',
  description:
    'Vlhko, 5°C nad dnešní hodnoty, vysoké CO₂, dinosauři ve vlhké džungli.',
  emoji: '🦕',
  climateZone: 'Af',
  monthlyTemps: [28, 28, 29, 30, 30, 30, 30, 30, 30, 30, 29, 28],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 15, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 35, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Tropický liják', icon: 'cloud-rain', probability: 30, cloudRange: [5, 8], precipRange: [3, 25] },
    { type: 'storm', label: 'Bouře', icon: 'cloud-lightning', probability: 15, cloudRange: [7, 8], precipRange: [15, 60] },
    { type: 'fog', label: 'Vlhká mlha', icon: 'cloud-fog', probability: 5, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [80, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Vlhko', 'Dinosauři', 'Lijáky'], probability: 45 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Hay W.W. & Floegel S. 2012, New thoughts about the Cretaceous climate and oceans, Earth-Science Reviews 115',
};

const PREHISTORIC_ICE_AGE: ArchetypePreset = {
  id: 'prehistoric-ice-age',
  category: 'fantasy',
  name: 'Doba ledová',
  subtitle: 'Last Glacial Maximum, 20 tis. let',
  description:
    'Rozsáhlé ledovce, mamuti, šabletoví tygři, suchý mrazivý vzduch.',
  emoji: '🦣',
  climateZone: 'EF',
  monthlyTemps: [-25, -23, -18, -10, -2, 4, 7, 5, 0, -8, -18, -23],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Mrazivo jasno', icon: 'sun', probability: 25, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 28, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 28, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Blizzard', icon: 'cloud-lightning', probability: 12, cloudRange: [7, 8], precipRange: [2, 15] },
    { type: 'fog', label: 'Mrznoucí mlha', icon: 'cloud-fog', probability: 7, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 70],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [975, 1030],
  defaultHumidityRange: [40, 85],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Ledovce', 'Mamuti', 'Blizzard'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Clark P.U. et al. 2009, The Last Glacial Maximum, Science 325(5941):710-714',
};

const PREHISTORIC_CARBONIFEROUS: ArchetypePreset = {
  id: 'prehistoric-carboniferous',
  category: 'fantasy',
  name: 'Karbonský prales',
  subtitle: 'Obří hmyz, 300 mil. let',
  description:
    '35% O₂ ve vzduchu, obří hmyz, hořící lesy, vlhké tropy.',
  emoji: '🦂',
  climateZone: 'Af',
  monthlyTemps: [25, 25, 26, 27, 28, 28, 28, 28, 28, 27, 26, 25],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 18, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Tropický liják', icon: 'cloud-rain', probability: 28, cloudRange: [5, 8], precipRange: [3, 25] },
    { type: 'storm', label: 'Bouřka s požáry', icon: 'cloud-lightning', probability: 18, cloudRange: [7, 8], precipRange: [10, 50] },
    { type: 'fog', label: 'Vlhká mlha', icon: 'cloud-fog', probability: 6, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 30],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [75, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Vysoký O₂ → požáry', 'Obří hmyz'], probability: 40 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Berner R.A. 2003, The long-term carbon cycle, fossil fuels and atmospheric composition, Geology 31',
};

const PREHISTORIC_PERMIAN_DESERT: ArchetypePreset = {
  id: 'prehistoric-permian-desert',
  category: 'fantasy',
  name: 'Permská poušť',
  subtitle: 'Pangea aridní vnitrozemí, 270 mil. let',
  description:
    'Extrémní sucho, megamonzun na okrajích, vyprahlý vnitrozemský srdce Pangee.',
  emoji: '🏜️',
  climateZone: 'BWh',
  monthlyTemps: [20, 23, 28, 33, 38, 42, 44, 43, 38, 30, 24, 21],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Spalující slunce', icon: 'sun', probability: 80, cloudRange: [0, 1], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 10, cloudRange: [2, 5], precipRange: [0, 0] },
    { type: 'rain', label: 'Vzácný déšť', icon: 'cloud-rain', probability: 2, cloudRange: [4, 7], precipRange: [1, 10] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 7, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Opar', icon: 'cloud-fog', probability: 1, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 55],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [5, 30],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Extrémní sucho', 'Písečné bouře'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Roscher M. et al. 2011, Permian Pangea megamonsoon paleoclimate models',
};

export const PREHISTORIC_PRESETS: readonly ArchetypePreset[] = [
  PREHISTORIC_CRETACEOUS,
  PREHISTORIC_ICE_AGE,
  PREHISTORIC_CARBONIFEROUS,
  PREHISTORIC_PERMIAN_DESERT,
] as const;
