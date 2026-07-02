/**
 * 10.2c-edit-9d — generic token schéma (fallback pro libovolný systemId,
 * který nemá vlastní per-system schémata).
 *
 * Konzument: `systemEntitySchemaRegistry.get(unknownSystem, 'token')` →
 * fallback path na `generic:token` (viz registry.ts).
 *
 * 5 univerzálních fields: HP / max HP / Zbroj / Zranění / Pohyb / Iniciativa.
 * Stačí jako baseline pro libovolný RPG systém — per-system extra (Únava,
 * Vesta, Body osudu, ...) přijdou jako dedikovaná schémata.
 */
import tokenJson from './token.json';
import bestieJson from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const genericTokenSchema = tokenJson as SystemEntitySchema;
// 16.2g F2 — generic bestie schéma (fallback, když svět nemá vlastní šablonu
// bestie). Dřív chybělo → `registry.get('generic','bestie')` vracelo null a
// editor/spawn bestie u „Vlastního Systému" hlásil „schéma není registrované".
export const genericBestieSchema = bestieJson as SystemEntitySchema;

export const genericSchemas: SystemEntitySchema[] = [
  genericTokenSchema,
  genericBestieSchema,
];
