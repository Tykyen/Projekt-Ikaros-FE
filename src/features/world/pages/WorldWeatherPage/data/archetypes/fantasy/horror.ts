import type { ArchetypePreset } from '../types';

/**
 * Horror / Lovecraft — 4 presety (Innsmouth, Mountains of Madness, R'lyeh, Arkham).
 *
 * sourceLevel: ANALOGY (real-world climate analog) nebo INFERRED (R'lyeh — fiktivní
 * dimenze). Citace odkazuje na konkrétní Lovecraftovy povídky.
 */

const LOVECRAFT_INNSMOUTH: ArchetypePreset = {
  id: 'horror-innsmouth',
  category: 'fantasy',
  name: 'Innsmouth mlha',
  subtitle: 'Lovecraft 1936, hnijící pobřežní město',
  description:
    'Chladné pobřeží Nové Anglie, rybí zápach, mlha z moře.',
  emoji: '🐟',
  climateZone: 'Cfb',
  monthlyTemps: [2, 3, 5, 8, 12, 16, 19, 19, 16, 12, 7, 4],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 18, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Zamračeno', icon: 'cloud', probability: 35, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 20, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Mořská bouře', icon: 'cloud-lightning', probability: 5, cloudRange: [7, 8], precipRange: [10, 30] },
    { type: 'fog', label: 'Pobřežní mlha', icon: 'cloud-fog', probability: 22, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 45],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [985, 1025],
  defaultHumidityRange: [75, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Rybí zápach', 'Mlha', 'Hluboké stíny'], probability: 40 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Lovecraft H.P. 1936, The Shadow over Innsmouth (Visionary Publishing); analogie Massachusetts pobřeží',
};

const LOVECRAFT_MOUNTAINS_OF_MADNESS: ArchetypePreset = {
  id: 'horror-mountains-of-madness',
  category: 'fantasy',
  name: 'Antarktida — Mountains of Madness',
  subtitle: 'Lovecraft 1936, prastará města pod ledem',
  description:
    'Extrémní antarktický mráz, vichřice, prastaré bytosti pod ledem.',
  emoji: '🦑',
  climateZone: 'EF',
  monthlyTemps: [-30, -32, -38, -45, -52, -55, -58, -57, -52, -45, -35, -30],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Mrazivo jasno', icon: 'sun', probability: 20, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 25, cloudRange: [5, 8], precipRange: [0, 8] },
    { type: 'storm', label: 'Katabatická vichřice', icon: 'cloud-lightning', probability: 18, cloudRange: [7, 8], precipRange: [0, 10] },
    { type: 'fog', label: 'Ledová mlha', icon: 'cloud-fog', probability: 7, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [15, 100],
  defaultWindGustMultiplier: 2.1,
  defaultPressureRange: [960, 1020],
  defaultHumidityRange: [40, 80],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Katabatický vítr', 'Whiteout', 'Starší bytosti'], probability: 50 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Lovecraft H.P. 1936, At the Mountains of Madness; inspired Byrd Antarctic Expeditions 1928-30',
};

const LOVECRAFT_RLYEH: ArchetypePreset = {
  id: 'horror-rlyeh',
  category: 'fantasy',
  name: "R'lyeh",
  subtitle: 'Lovecraft 1928, podmořské město Cthulhu',
  description:
    'Podmořské non-euklidovské město, dimenzionální posun, mrazivá voda.',
  emoji: '🐙',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  defaultWeatherTypes: [
    { type: 'cloudy', label: 'Šerá voda', icon: 'cloud', probability: 50, cloudRange: [7, 8], precipRange: [0, 0] },
    { type: 'storm', label: 'Dimenzionální warp', icon: 'cloud-lightning', probability: 20, cloudRange: [7, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Cthulhovská mlha', icon: 'cloud-fog', probability: 30, cloudRange: [6, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [1020, 1100],
  defaultHumidityRange: [95, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Dimenzionální warp', 'Šepoty Cthulhua', 'Non-euklidovská geometrie'], probability: 80 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: "Lovecraft H.P. 1928, The Call of Cthulhu (Weird Tales Feb 1928)",
};

const LOVECRAFT_ARKHAM: ArchetypePreset = {
  id: 'horror-arkham',
  category: 'fantasy',
  name: 'Arkham',
  subtitle: 'Lovecraft mythos, prokleté Massachusetts',
  description:
    'Deformovaná realita, cosmic horror v ulicích, šepoty z hloubek.',
  emoji: '📕',
  climateZone: 'Cfb',
  monthlyTemps: [0, 2, 5, 10, 15, 19, 22, 21, 17, 12, 6, 2],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 22, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Zamračeno', icon: 'cloud', probability: 35, cloudRange: [4, 7], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 18, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 8, cloudRange: [7, 8], precipRange: [10, 35] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 7, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'fog', label: 'Cosmic mlha', icon: 'cloud-fog', probability: 10, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [985, 1025],
  defaultHumidityRange: [60, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Cosmic horror', 'Šepoty', 'Deformovaná realita'], probability: 35 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: 'Lovecraft H.P., Cthulhu Mythos cycle (1917-1937); analogie Salem, Massachusetts',
};

export const HORROR_PRESETS: readonly ArchetypePreset[] = [
  LOVECRAFT_INNSMOUTH,
  LOVECRAFT_MOUNTAINS_OF_MADNESS,
  LOVECRAFT_RLYEH,
  LOVECRAFT_ARKHAM,
] as const;
