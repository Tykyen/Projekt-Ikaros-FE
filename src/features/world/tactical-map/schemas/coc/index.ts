/**
 * 10.2c-edit-9g — barrel export Call of Cthulhu schémat (bestie + token).
 */
import type { SystemEntitySchema } from '../types';
import { cocBestieSchema } from './bestie';
import { cocTokenSchema } from './token';

export { cocBestieSchema, cocTokenSchema };

/** Všechna CoC schémata pro hromadnou registraci v bootstrap. */
export const cocSchemas: SystemEntitySchema[] = [
  cocBestieSchema,
  cocTokenSchema,
];
