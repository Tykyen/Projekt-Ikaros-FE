/**
 * 10.2c-edit-9g — barrel export Fate schémat (bestie + token).
 */
import type { SystemEntitySchema } from '../types';
import { fateBestieSchema } from './bestie';
import { fateTokenSchema } from './token';

export { fateBestieSchema, fateTokenSchema };

/** Všechna Fate schémata pro hromadnou registraci v bootstrap. */
export const fateSchemas: SystemEntitySchema[] = [
  fateBestieSchema,
  fateTokenSchema,
];
