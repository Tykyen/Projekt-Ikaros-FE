import type { ArchetypePreset } from '../types';

/**
 * Magická / bioluminiscentní prostředí — 5 presetů.
 *
 * sourceLevel: ANALOGY (bioluminiscentní džungle — reálná biologie)
 * nebo FICTIONAL (Fae plán, magické bouřkové zóny — čistě fantazijní).
 */

const MAGICAL_BIOLUMINESCENT: ArchetypePreset = {
  id: 'magical-bioluminescent',
  category: 'fantasy',
  name: 'Bioluminiscentní džungle',
  subtitle: 'Inspirováno: Avatar Pandora, reálné bioluminiscentní druhy',
  description:
    'Tropická džungle s rostlinami a houbami zářícími v noci.',
  emoji: '🍄',
  climateZone: 'Af',
  monthlyTemps: [22, 22, 23, 24, 24, 24, 24, 24, 24, 24, 23, 22],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 18, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Tropický déšť', icon: 'cloud-rain', probability: 30, cloudRange: [5, 8], precipRange: [2, 20] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 12, cloudRange: [6, 8], precipRange: [15, 50] },
    { type: 'fog', label: 'Zářící mlha', icon: 'cloud-fog', probability: 10, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [1000, 1015],
  defaultHumidityRange: [80, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Jedy', 'Magická záře', 'Vlhko'], probability: 40 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation:
    "Cameron J. 2009, Avatar; reálná bioluminiscence — Watasenia scintillans (firefly squid), dinoflagellate blooms (Hastings J.W. 1996, J. Mol. Evol.)",
};

const MAGICAL_STORM_ZONE: ArchetypePreset = {
  id: 'magical-storm-zone',
  category: 'fantasy',
  name: 'Magická bouřková zóna',
  subtitle: 'Chaotická magická anomálie',
  description:
    'Trvalé magické bouřky, blesky bez konce, energetické anomálie.',
  emoji: '🌩️',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [10, 10, 12, 14, 16, 18, 20, 19, 17, 14, 12, 10],
  defaultWeatherTypes: [
    { type: 'cloudy', label: 'Trvalé mraky', icon: 'cloud', probability: 25, cloudRange: [6, 8], precipRange: [0, 0] },
    { type: 'rain', label: 'Magický déšť', icon: 'cloud-rain', probability: 20, cloudRange: [7, 8], precipRange: [2, 20] },
    { type: 'storm', label: 'Magická bouře', icon: 'cloud-lightning', probability: 45, cloudRange: [7, 8], precipRange: [10, 50] },
    { type: 'fog', label: 'Energetická mlha', icon: 'cloud-fog', probability: 10, cloudRange: [6, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [15, 90],
  defaultWindGustMultiplier: 2.1,
  defaultPressureRange: [950, 1030],
  defaultHumidityRange: [60, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Magické blesky', 'Energetické anomálie', 'Stálé bouřky'], probability: 70 },
  ],
  sourceLevel: 'FICTIONAL',
  sourceCitation: 'FICTIONAL — čistě fantazijní prostředí, žádný real-world podklad',
};

const MAGICAL_ENCHANTED_FOREST: ArchetypePreset = {
  id: 'magical-enchanted-forest',
  category: 'fantasy',
  name: 'Magicky upravený les',
  subtitle: 'Začarovaný hvozd, bludné cesty',
  description:
    'Les s magickými rostlinami, bludné cesty, šepoty stromů.',
  emoji: '🌳',
  climateZone: 'Cfb',
  monthlyTemps: [5, 6, 8, 12, 16, 19, 21, 20, 17, 12, 8, 6],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Magické jasno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Jemný déšť', icon: 'cloud-rain', probability: 18, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'fog', label: 'Magická mlha', icon: 'cloud-fog', probability: 18, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 20],
  defaultWindGustMultiplier: 1.3,
  defaultPressureRange: [995, 1025],
  defaultHumidityRange: [70, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Bludné cesty', 'Magické rostliny', 'Šepoty'], probability: 45 },
  ],
  sourceLevel: 'FICTIONAL',
  sourceCitation: 'FICTIONAL — archetyp začarovaného lesa (folklórní topos)',
};

const MAGICAL_FAE_REALM: ArchetypePreset = {
  id: 'magical-fae-realm',
  category: 'fantasy',
  name: 'Fae plán',
  subtitle: 'Říše faerie, věčné jaro',
  description:
    'Věčné jaro, čas plyne jinak, fae triky a magické dveře.',
  emoji: '🧚',
  climateZone: 'Csb',
  monthlyTemps: [15, 16, 17, 18, 19, 20, 21, 21, 20, 18, 17, 16],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 50, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 25, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Jemný déšť', icon: 'cloud-rain', probability: 15, cloudRange: [5, 8], precipRange: [1, 10] },
    { type: 'storm', label: 'Vzácná bouřka', icon: 'cloud-lightning', probability: 2, cloudRange: [6, 8], precipRange: [5, 15] },
    { type: 'fog', label: 'Faerie mlha', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 20],
  defaultWindGustMultiplier: 1.3,
  defaultPressureRange: [1005, 1025],
  defaultHumidityRange: [50, 85],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Čas plyne jinak', 'Fae triky', 'Magické dveře'], probability: 55 },
  ],
  sourceLevel: 'FICTIONAL',
  sourceCitation: 'FICTIONAL — keltský folklór Sídhe; Briggs K.M. 1976, An Encyclopedia of Fairies',
};

const MAGICAL_CRYSTAL_FIELDS: ArchetypePreset = {
  id: 'magical-crystal-fields',
  category: 'fantasy',
  name: 'Krystalové pole',
  subtitle: 'Magická krajina rezonujících krystalů',
  description:
    'Pole krystalů, harmonické rezonance, řezné rány od ostrých hran.',
  emoji: '💎',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-5, -3, 0, 5, 10, 14, 16, 15, 12, 7, 2, -3],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Krystalový lesk', icon: 'sun', probability: 50, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 20, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'snow', label: 'Krystalový sníh', icon: 'cloud-snow', probability: 12, cloudRange: [5, 8], precipRange: [0, 8] },
    { type: 'storm', label: 'Rezonanční bouře', icon: 'cloud-lightning', probability: 10, cloudRange: [6, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Krystalový prach', icon: 'cloud-fog', probability: 8, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [990, 1020],
  defaultHumidityRange: [10, 50],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Řezné rány', 'Harmonické rezonance', 'Oslepující lesk'], probability: 45 },
  ],
  sourceLevel: 'FICTIONAL',
  sourceCitation: 'FICTIONAL — archetyp krystalové pustiny (fantasy/sci-fi topos)',
};

export const MAGICAL_PRESETS: readonly ArchetypePreset[] = [
  MAGICAL_BIOLUMINESCENT,
  MAGICAL_STORM_ZONE,
  MAGICAL_ENCHANTED_FOREST,
  MAGICAL_FAE_REALM,
  MAGICAL_CRYSTAL_FIELDS,
] as const;
