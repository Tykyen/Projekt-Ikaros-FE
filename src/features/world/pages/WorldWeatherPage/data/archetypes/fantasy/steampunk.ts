import type { ArchetypePreset } from '../types';

/**
 * Steampunk / viktoriánská éra — 3 presety.
 *
 * sourceLevel: ANALOGY — kombinace reálných historických smog-records
 * (Great Smog of London 1952) + industriální éry 1880-1900.
 */

const STEAMPUNK_CITATION_LONDON =
  'Brimblecombe P. 1987, The Big Smoke (Methuen); Great Smog of London 1952 records (Met Office)';

const STEAMPUNK_SMOG_LONDON: ArchetypePreset = {
  id: 'steampunk-smog-london',
  category: 'fantasy',
  name: 'Smog Londýn 1880',
  subtitle: 'Viktoriánská éra, pea-souper',
  description:
    'Hustý uhelný smog, kyselá mlha, dohlednost pod 1 metr.',
  emoji: '🏭',
  climateZone: 'Cfb',
  monthlyTemps: [3, 4, 6, 9, 12, 15, 17, 17, 14, 10, 6, 4],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Vzácné jasno', icon: 'sun', probability: 10, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Smogová zataženo', icon: 'cloud', probability: 30, cloudRange: [5, 8], precipRange: [0, 0] },
    { type: 'rain', label: 'Kyselý déšť', icon: 'cloud-rain', probability: 25, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [10, 25] },
    { type: 'fog', label: 'Pea-souper smog', icon: 'cloud-fog', probability: 32, cloudRange: [6, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 30],
  defaultWindGustMultiplier: 1.5,
  defaultPressureRange: [990, 1025],
  defaultHumidityRange: [70, 99],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Pea-souper smog', 'Kyselá mlha', 'Dohlednost <1m'], probability: 50 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: STEAMPUNK_CITATION_LONDON,
};

const STEAMPUNK_INDUSTRIAL_FIELDS: ArchetypePreset = {
  id: 'steampunk-industrial-fields',
  category: 'fantasy',
  name: 'Industriální fields',
  subtitle: 'Černý průmysl, uhelná pole',
  description:
    'Uhelný popel v ovzduší, kyselý déšť nad fabrikami a doly.',
  emoji: '⚙️',
  climateZone: 'Cfb',
  monthlyTemps: [5, 6, 8, 11, 14, 17, 19, 19, 16, 12, 8, 6],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Vzácné jasno', icon: 'sun', probability: 15, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Popelná oblaka', icon: 'cloud', probability: 38, cloudRange: [5, 8], precipRange: [0, 0] },
    { type: 'rain', label: 'Kyselý déšť', icon: 'cloud-rain', probability: 25, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 4, cloudRange: [6, 8], precipRange: [10, 30] },
    { type: 'fog', label: 'Popelová mlha', icon: 'cloud-fog', probability: 18, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [990, 1025],
  defaultHumidityRange: [60, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Uhelný popel', 'Kyselý déšť'], probability: 40 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: STEAMPUNK_CITATION_LONDON,
};

const STEAMPUNK_GAS_LAMPS: ArchetypePreset = {
  id: 'steampunk-gas-lamps',
  category: 'fantasy',
  name: 'Plynové ulice',
  subtitle: 'Viktoriánské městské uličky',
  description:
    'Noční mlha v plynových světlech, vlhko, občasné úniky.',
  emoji: '🕯️',
  climateZone: 'Cfb',
  monthlyTemps: [3, 4, 7, 10, 13, 16, 18, 18, 15, 11, 7, 4],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 22, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 33, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 20, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 3, cloudRange: [6, 8], precipRange: [10, 25] },
    { type: 'fog', label: 'Noční mlha', icon: 'cloud-fog', probability: 22, cloudRange: [5, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.4,
  defaultPressureRange: [995, 1025],
  defaultHumidityRange: [65, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Noční mlha', 'Plynové úniky'], probability: 35 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: STEAMPUNK_CITATION_LONDON,
};

export const STEAMPUNK_PRESETS: readonly ArchetypePreset[] = [
  STEAMPUNK_SMOG_LONDON,
  STEAMPUNK_INDUSTRIAL_FIELDS,
  STEAMPUNK_GAS_LAMPS,
] as const;
