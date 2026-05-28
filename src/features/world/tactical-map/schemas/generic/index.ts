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
import type { SystemEntitySchema } from '../types';

export const genericTokenSchema = tokenJson as SystemEntitySchema;

export const genericSchemas: SystemEntitySchema[] = [genericTokenSchema];
