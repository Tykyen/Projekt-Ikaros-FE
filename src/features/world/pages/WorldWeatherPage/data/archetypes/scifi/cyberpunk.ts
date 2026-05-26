import type { ArchetypePreset } from '../types';

/**
 * 9.4-III — Sci-fi: cyberpunk / urbanní dystopie (4 presety).
 *
 * sourceLevel: DOCUMENTED (Delhi PM2.5) + ANALOGY (vše ostatní — extrapolace
 * z reálných klimatických dat na fiktivní megacity prostředí).
 *
 * climateZone Cfa pro venkovní městské, CONTROLLED pro interiéry korporátních
 * věží a mall. Hazardy: smog, acid rain, dohlednost, surveillance.
 *
 * Pravidlo: data-only, žádné Math.random.
 */

const NEON_CITY_CITATION =
  'Tokyo JMA climate normals 1991-2020 + urban heat island studies (Kanda M. 2007)';
const DELHI_CITATION =
  'Delhi PM2.5 records 2010-2020, IIT-D Centre of Excellence for Research on Clean Air';
const HVAC_CITATION =
  'ASHRAE Standard 62.1 Ventilation for Acceptable Indoor Air Quality + skyscraper HVAC design';

/** Neon City — Tokyo-like + smog + acid rain. */
const CYBER_NEON_CITY: ArchetypePreset = {
  id: 'cyberpunk-neon-city',
  category: 'scifi',
  name: 'Neon City',
  subtitle: 'Tokio-like megacity s acid rain',
  description:
    'Vlhká subtropická megacity s urban heat island, neonové záře v noci, příležitostné acid rain z průmyslových emisí.',
  emoji: '🌆',
  climateZone: 'Cfa',
  monthlyTemps: [5, 6, 9, 14, 18, 22, 26, 27, 23, 18, 12, 8],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno (smog haze)',
      icon: 'sun',
      probability: 20,
      cloudRange: [1, 3],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 35,
      cloudRange: [4, 7],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Acid rain',
      icon: 'cloud-rain',
      probability: 25,
      cloudRange: [5, 8],
      precipRange: [2, 25],
    },
    {
      type: 'storm',
      label: 'Bouřka',
      icon: 'cloud-lightning',
      probability: 5,
      cloudRange: [7, 8],
      precipRange: [15, 50],
    },
    {
      type: 'fog',
      label: 'Smog',
      icon: 'cloud-fog',
      probability: 15,
      cloudRange: [5, 8],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 35],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [55, 90],
  defaultCustomFields: [
    {
      label: 'Smog (PM2.5)',
      possibleValues: ['nízký <50', 'střední 50-150', 'vysoký 150-300', 'extrémní >300'],
      probability: 60,
    },
    {
      label: 'pH dešťové vody',
      possibleValues: ['neutrální 6-7', 'kyselý 4-5', 'silně kyselý <4'],
      probability: 40,
    },
    {
      label: 'Neonové záře',
      possibleValues: ['noční světlo (lux >50)'],
      probability: 100,
    },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: NEON_CITY_CITATION,
};

/** Megacity smog — Delhi-like pea-souper. */
const CYBER_MEGACITY_SMOG: ArchetypePreset = {
  id: 'cyberpunk-megacity-smog',
  category: 'scifi',
  name: 'Megacity smog',
  subtitle: 'Delhi-like pea-souper',
  description:
    'Extrémní znečištění ovzduší, dohlednost často <50m, PM2.5 přesahuje 500 µg/m³, dýchací maska povinná.',
  emoji: '😷',
  climateZone: 'Cfa',
  monthlyTemps: [12, 14, 19, 24, 29, 32, 34, 33, 29, 24, 18, 13],
  defaultWeatherTypes: [
    {
      type: 'clear',
      label: 'Jasno (smog haze)',
      icon: 'sun',
      probability: 10,
      cloudRange: [2, 4],
      precipRange: [0, 0],
    },
    {
      type: 'cloudy',
      label: 'Oblačno',
      icon: 'cloud',
      probability: 25,
      cloudRange: [5, 7],
      precipRange: [0, 0],
    },
    {
      type: 'rain',
      label: 'Toxický déšť',
      icon: 'cloud-rain',
      probability: 15,
      cloudRange: [6, 8],
      precipRange: [2, 30],
    },
    {
      type: 'storm',
      label: 'Monzun',
      icon: 'cloud-lightning',
      probability: 5,
      cloudRange: [7, 8],
      precipRange: [20, 80],
    },
    {
      type: 'fog',
      label: 'Pea-souper smog',
      icon: 'cloud-fog',
      probability: 45,
      cloudRange: [6, 8],
      precipRange: [0, 1],
    },
  ],
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.4,
  defaultPressureRange: [995, 1015],
  defaultHumidityRange: [40, 90],
  defaultCustomFields: [
    {
      label: 'Smog (PM2.5)',
      possibleValues: ['vysoký 150-300', 'extrémní 300-500', 'hazardous >500'],
      probability: 90,
    },
    {
      label: 'Dohlednost',
      possibleValues: ['>500m', '100-500m', '<100m', '<50m'],
      probability: 70,
    },
    {
      label: 'Asthma riziko',
      possibleValues: ['nízké', 'zvýšené', 'kritické'],
      probability: 60,
    },
  ],
  sourceLevel: 'DOCUMENTED',
  sourceCitation: DELHI_CITATION,
};

/** Korporátní věže — sterilní řízené prostředí. */
const CYBER_CORPORATE_TOWERS: ArchetypePreset = {
  id: 'cyberpunk-corporate-towers',
  category: 'scifi',
  name: 'Korporátní věže',
  subtitle: 'Sterilní interní HVAC',
  description:
    'Klimatizované patra arcology — konstantní 21°C, surveillance kamery, sterilita, pohotovostní personál.',
  emoji: '🏢',
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
  defaultWindRange: [0, 3],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [40, 55],
  defaultCustomFields: [
    {
      label: 'Surveillance',
      possibleValues: ['základní', 'rozšířená', 'biometrická 24/7'],
      probability: 100,
    },
    {
      label: 'HVAC',
      possibleValues: ['nominal', 'údržba', 'porucha'],
      probability: 5,
    },
    {
      label: 'Sterilita',
      possibleValues: ['standardní', 'cleanroom'],
      probability: 30,
    },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: HVAC_CITATION,
};

/** Mall klimatizovaný — konzumní bublina. */
const CYBER_MALL_CONTROLLED: ArchetypePreset = {
  id: 'cyberpunk-mall-controlled',
  category: 'scifi',
  name: 'Mall klimatizovaný',
  subtitle: 'Konzumní bublina',
  description:
    'Velkoplošný mall — konstantních 20°C, žádné venkovní vědomí, neustálý konzumní hluk a reklamy.',
  emoji: '🛍️',
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
  defaultWindRange: [0, 2],
  defaultWindGustMultiplier: 1.0,
  defaultPressureRange: [1010, 1015],
  defaultHumidityRange: [45, 60],
  defaultCustomFields: [
    {
      label: 'Hladina hluku',
      possibleValues: ['střední (60 dB)', 'vysoká (75 dB)', 'extrémní (85 dB)'],
      probability: 80,
    },
    {
      label: 'Reklamy',
      possibleValues: ['statické', 'video', 'AR overlay'],
      probability: 100,
    },
    {
      label: 'Návštěvnost',
      possibleValues: ['klidno', 'normální', 'crowd'],
      probability: 60,
    },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: HVAC_CITATION,
};

export const CYBERPUNK_PRESETS: readonly ArchetypePreset[] = [
  CYBER_NEON_CITY,
  CYBER_MEGACITY_SMOG,
  CYBER_CORPORATE_TOWERS,
  CYBER_MALL_CONTROLLED,
] as const;
