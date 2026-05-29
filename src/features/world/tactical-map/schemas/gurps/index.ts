/**
 * 10.2c-edit-9g — barrel export GURPS schémat (bestie + token).
 */
import type { SystemEntitySchema } from '../types';
import { gurpsBestieSchema } from './bestie';
import { gurpsTokenSchema } from './token';

export { gurpsBestieSchema, gurpsTokenSchema };

/** Všechna GURPS schémata pro hromadnou registraci v bootstrap. */
export const gurpsSchemas: SystemEntitySchema[] = [
  gurpsBestieSchema,
  gurpsTokenSchema,
];
