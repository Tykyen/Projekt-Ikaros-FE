import type { KoppenZone } from '@/features/world/lib/weatherSimulation';

/**
 * Real-world katalog — 7 reálných extrémů (B-13).
 *
 * sourceLevel: MEASURED  (přímá in-situ měření z primárních zdrojů)
 * source: per-preset block comment níže (NOAA, NASA, USGS, IMD, García-Ruiz 2007,
 *         Russian Antarctic Expedition, Cameron Deepsea Challenger).
 *
 * Tyto presety reprezentují klimaticky výjimečná místa naší planety —
 * extrémy které PJ může chtít použít pro speciální dungeon/lokaci.
 * Neexportují se do `REAL_WORLD_CATALOG` (jiná struktura než CountryData),
 * mají vlastní wizard sekci „Extrémy".
 */

export interface ExtremePreset {
  id: string;
  name: string;
  /** Krátký 1-věta popisek pro UI. */
  description: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  climateZone: KoppenZone;
}

/**
 * Naica — Cueva de los Cristales (Mexiko, Chihuahua).
 *
 * sourceLevel: MEASURED
 * source: García-Ruiz et al. 2007, *Formation of natural gypsum megacrystals in Naica, Mexico*,
 *         Geology 35(4), 327-330. Měření in situ ve výklenku 290 m pod povrchem.
 *
 * Teploty: +45 až +58 °C (stabilní celoročně, geotermální zdroj)
 * Vlhkost: 90-99 % (nasycená pára nad hydrotermálními vodami)
 * Použití: krystalická jeskyně, lethal-without-suit prostředí.
 */
const NAICA: ExtremePreset = {
  id: 'naica',
  name: 'Naica — krystalická jeskyně',
  description: 'Geotermální jeskyně s obřími selenitovými krystaly. Lethal bez ochranného obleku.',
  tempMin: 45,
  tempMax: 58,
  humidityMin: 90,
  humidityMax: 99,
  climateZone: 'EXTRATERRESTRIAL',
};

/**
 * Vostok — sovětská polární stanice (Antarktida, 78°S, 3488 m n.m.).
 *
 * sourceLevel: MEASURED
 * source: Russian Antarctic Expedition, station Vostok, official record -89.2 °C
 *         (21. 7. 1983). NOAA Climate Data Online, Antarctic CRREL records.
 *
 * Teploty: zima -89 až -60 °C, krátké léto -30 až -20 °C
 * Vlhkost: 50-75 % (suchý ledový vzduch)
 * Použití: nejstudenější trvale obydlené místo planety.
 */
const VOSTOK: ExtremePreset = {
  id: 'vostok',
  name: 'Vostok — antarktická stanice',
  description: 'Nejstudenější místo Země. Rekordní -89,2 °C naměřeno 1983.',
  tempMin: -89,
  tempMax: -20,
  humidityMin: 50,
  humidityMax: 75,
  climateZone: 'EF',
};

/**
 * Death Valley — Furnace Creek (Kalifornie, USA).
 *
 * sourceLevel: MEASURED
 * source: NOAA, oficiální rekord 56.7 °C (10. 7. 1913, Furnace Creek).
 *         WMO ARCHIVE OF WEATHER AND CLIMATE EXTREMES.
 *
 * Teploty: léto +40 až +57 °C, zima +5 až +20 °C
 * Vlhkost: 5-30 % (extrémně suchá poušť)
 * Použití: nejteplejší oficiálně naměřené místo planety.
 */
const DEATH_VALLEY: ExtremePreset = {
  id: 'death-valley',
  name: 'Death Valley — Furnace Creek',
  description: 'Nejteplejší místo Země. Oficiální rekord +56,7 °C (NOAA 1913).',
  tempMin: 5,
  tempMax: 57,
  humidityMin: 5,
  humidityMax: 30,
  climateZone: 'BWh',
};

/**
 * Cherrapunji — Meghalaya, Indie.
 *
 * sourceLevel: MEASURED
 * source: IMD India Meteorological Department. Roční rekord srážek 26 471 mm
 *         (1860-61). Průměr 11 871 mm/rok. Holttum & Sundarmoorthy 1969.
 *
 * Teploty: 11-21 °C (vysoká nadmořská výška, monzun)
 * Vlhkost: 80-100 % (téměř stále vysycený vzduch během monzunu)
 * Použití: nejdeštivější obydlené místo planety.
 */
const CHERRAPUNJI: ExtremePreset = {
  id: 'cherrapunji',
  name: 'Cherrapunji — Meghalaya',
  description: 'Nejdeštivější obydlené místo planety. Průměr 11 871 mm srážek ročně.',
  tempMin: 11,
  tempMax: 21,
  humidityMin: 80,
  humidityMax: 100,
  climateZone: 'Cfb',
};

/**
 * McMurdo Dry Valleys (Antarktida, McMurdo Region).
 *
 * sourceLevel: MEASURED
 * source: NASA Antarctic Research, Long-Term Ecological Research Network (McMurdo LTER).
 *         Marchant & Head 2007, *Antarctic Dry Valleys — microclimate zonation*,
 *         Icarus 192(1), 187-222.
 *
 * Teploty: léto -3 až 0 °C, zima -20 až -50 °C
 * Vlhkost: 0-15 % (nejsušší místo planety; katabatické větry odstraňují veškerou vlhkost)
 * Použití: pozemský Mars analog — vědecké základny + NASA testovací lokace.
 */
const DRY_VALLEYS: ExtremePreset = {
  id: 'dry-valleys',
  name: 'McMurdo Dry Valleys',
  description: 'Nejsušší místo Země. Mars analog, žádné srážky 2+ miliony let.',
  tempMin: -50,
  tempMax: 0,
  humidityMin: 0,
  humidityMax: 15,
  climateZone: 'EF',
};

/**
 * Mariana Trench — Challenger Deep (Tichý oceán, 10 994 m hloubka).
 *
 * sourceLevel: MEASURED
 * source: Cameron Deepsea Challenger Expedition 2012 (J. Cameron, National Geographic).
 *         Taira et al. 2005, *Deep CTD profile to bottom of Challenger Deep*,
 *         J. Oceanogr. 61, 447-454.
 *
 * Teploty: konstantní +1 až +4 °C (geotermální gradient minimální)
 * Vlhkost: N/A pod vodou — vodní sloupec, tlak ~1100 atm
 * Použití: hluboce-mořské expedice, podvodní dungeon scénáře.
 */
const MARIANA: ExtremePreset = {
  id: 'mariana-trench',
  name: 'Mariana Trench — Challenger Deep',
  description: 'Nejhlubší místo oceánu. Konstantní +2 °C, tlak ~1100 atm.',
  tempMin: 1,
  tempMax: 4,
  humidityMin: 100,
  humidityMax: 100,
  climateZone: 'EXTRATERRESTRIAL',
};

/**
 * Yellowstone — Grand Prismatic + Old Faithful (Wyoming, USA).
 *
 * sourceLevel: MEASURED
 * source: USGS Yellowstone Volcano Observatory. Grand Prismatic 70 °C okraj,
 *         středový bazén 88 °C. Old Faithful výtrysk 93-95 °C (USGS 2018-2023).
 *
 * Teploty: hot springs +50 až +93 °C, ambient -45 (zima) až +25 (léto) °C
 * Vlhkost: 50-100 % (nad horkými prameny stálá pára)
 * Použití: geotermální oblast — sopečná aktivita, gejzíry.
 */
const YELLOWSTONE: ExtremePreset = {
  id: 'yellowstone',
  name: 'Yellowstone hot springs',
  description: 'Aktivní supersopka. Horké prameny +50 až +93 °C, gejzíry, fumaroly.',
  tempMin: 50,
  tempMax: 93,
  humidityMin: 50,
  humidityMax: 100,
  climateZone: 'EXTRATERRESTRIAL',
};

export const EXTREMES: ReadonlyArray<ExtremePreset> = [
  NAICA,
  VOSTOK,
  DEATH_VALLEY,
  CHERRAPUNJI,
  DRY_VALLEYS,
  MARIANA,
  YELLOWSTONE,
];
