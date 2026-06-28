/**
 * 8.7r — barrel export JaD schémat (bestie + token).
 */
import type { SystemEntitySchema } from '../types';
import { jadBestieSchema } from './bestie';
import { jadTokenSchema } from './token';

export { jadBestieSchema, jadTokenSchema };

/** Všechna JaD schémata pro hromadnou registraci v bootstrap. */
export const jadSchemas: SystemEntitySchema[] = [
  jadBestieSchema,
  jadTokenSchema,
];
