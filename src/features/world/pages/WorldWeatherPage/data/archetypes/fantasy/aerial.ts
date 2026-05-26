import type { ArchetypePreset } from '../types';

/**
 * Vzdušná / létající prostředí — 3 presety.
 *
 * sourceLevel: ANALOGY (reálná altitudinální atmosféra dle US Standard
 * Atmosphere 1976) nebo INFERRED (fiktivní floating islands z popkultury).
 */

const AERIAL_FLOATING_ISLANDS: ArchetypePreset = {
  id: 'aerial-floating-islands',
  category: 'fantasy',
  name: 'Floating ostrovy',
  subtitle: 'Inspirováno: Avatar Hallelujah Mountains',
  description:
    'Vznášející se kusy země ve výšce, výškové bouře, vodopády do prázdna.',
  emoji: '🏝️',
  climateZone: 'Cfb',
  monthlyTemps: [0, 2, 6, 10, 14, 17, 19, 19, 15, 10, 5, 2],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno nad oblaky', icon: 'sun', probability: 35, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 25, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 15, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Výšková bouře', icon: 'cloud-lightning', probability: 12, cloudRange: [7, 8], precipRange: [10, 40] },
    { type: 'fog', label: 'Mraky pod nohama', icon: 'cloud-fog', probability: 13, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [10, 70],
  defaultWindGustMultiplier: 2.0,
  defaultPressureRange: [800, 950],
  defaultHumidityRange: [40, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Výšková bouře', 'Padání', 'Nárazový vítr'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Cameron J. 2009, Avatar (20th Century Fox) Hallelujah Mountains; analogie Huangshan + Mt. Roraima',
};

const AERIAL_STRATOSPHERE: ArchetypePreset = {
  id: 'aerial-stratosphere',
  category: 'fantasy',
  name: 'Stratosféra',
  subtitle: 'Reálná atmosféra ve výšce ~10 km',
  description:
    'Extrémní výška, nízký O₂, silné UV záření, mrazivé teploty.',
  emoji: '🪂',
  climateZone: 'EXTRATERRESTRIAL',
  monthlyTemps: [-55, -55, -55, -55, -55, -55, -55, -55, -55, -55, -55, -55],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 75, cloudRange: [0, 0], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Cirrus nad', icon: 'cloud', probability: 18, cloudRange: [1, 3], precipRange: [0, 0] },
    { type: 'storm', label: 'Jet stream turbulence', icon: 'cloud-lightning', probability: 7, cloudRange: [2, 5], precipRange: [0, 2] },
  ],
  defaultWindRange: [50, 250],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [200, 300],
  defaultHumidityRange: [0, 15],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Nízký O₂', 'UV záření', 'Jet stream'], probability: 60 },
  ],
  sourceLevel: 'MEASURED',
  sourceCitation: 'US Standard Atmosphere 1976 (NOAA/NASA/USAF); NASA upper-atmosphere data',
};

const AERIAL_SKY_CITY: ArchetypePreset = {
  id: 'aerial-sky-city',
  category: 'fantasy',
  name: 'Vzdušné město',
  subtitle: 'Inspirováno: Columbia (BioShock Infinite)',
  description:
    'Vznášející se město na quantum-levitaci, bouřky v dálkách, padání.',
  emoji: '🎈',
  climateZone: 'Cfb',
  monthlyTemps: [15, 16, 17, 19, 20, 22, 23, 23, 21, 19, 17, 16],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 50, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 25, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 10, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Vzdálené bouřky', icon: 'cloud-lightning', probability: 10, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'fog', label: 'Mraky pod', icon: 'cloud-fog', probability: 5, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 50],
  defaultWindGustMultiplier: 1.7,
  defaultPressureRange: [900, 980],
  defaultHumidityRange: [40, 80],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Bouřky v dálkách', 'Padání'], probability: 25 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: 'Irrational Games 2013, BioShock Infinite (2K Games); inspired by zeppelin tech 1900-1930',
};

export const AERIAL_PRESETS: readonly ArchetypePreset[] = [
  AERIAL_FLOATING_ISLANDS,
  AERIAL_STRATOSPHERE,
  AERIAL_SKY_CITY,
] as const;
