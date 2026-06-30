/**
 * Shadowrun 6e — barrel export schémat (bestie + token).
 */
import type { SystemEntitySchema } from '../types';
import { shadowrunBestieSchema } from './bestie';
import { shadowrunTokenSchema } from './token';

export { shadowrunBestieSchema, shadowrunTokenSchema };

/** Všechna Shadowrun schémata pro hromadnou registraci v bootstrap. */
export const shadowrunSchemas: SystemEntitySchema[] = [
  shadowrunBestieSchema,
  shadowrunTokenSchema,
];
