/**
 * Barrel export Fate Accelerated (fae) schémat (bestie + token).
 */
import type { SystemEntitySchema } from '../types';
import { faeBestieSchema } from './bestie';
import { faeTokenSchema } from './token';

export { faeBestieSchema, faeTokenSchema };

/** Všechna fae schémata pro hromadnou registraci v bootstrap. */
export const faeSchemas: SystemEntitySchema[] = [faeBestieSchema, faeTokenSchema];
