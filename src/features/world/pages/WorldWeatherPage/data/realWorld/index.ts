/**
 * Real-world katalog — hlavní entry point.
 *
 * Struktura: kontinent → země → města. Použito ve wizardu „Vytvořit
 * generátor → Reálný svět" jako 3-úrovňový picker.
 *
 * Extrémy (Naica, Vostok, ...) jsou separátní `EXTREMES` export — mají
 * vlastní wizard sekci a strukturu `ExtremePreset`, ne `CountryData`.
 */

import { AFRICA } from './africa';
import { ASIA } from './asia';
import { CENTRAL_AMERICA, NORTH_AMERICA, SOUTH_AMERICA } from './americas';
import { EUROPE } from './europe';
import { OCEANIA } from './oceania';
import type { RealWorldCatalog } from './types';

export const REAL_WORLD_CATALOG: RealWorldCatalog = {
  Evropa: EUROPE,
  Asie: ASIA,
  Afrika: AFRICA,
  'Severní Amerika': NORTH_AMERICA,
  'Střední Amerika': CENTRAL_AMERICA,
  'Jižní Amerika': SOUTH_AMERICA,
  'Austrálie a Oceánie': OCEANIA,
};

export { EXTREMES } from './extremes';
export type { ExtremePreset } from './extremes';
export type { CityData, CountryData, RealWorldCatalog } from './types';
