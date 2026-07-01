/**
 * 16b bestie — barrel export Dračí Hlídka (drdh) schémat.
 * Zatím jen bestie + token pro taktickou mapu / chat bestie panel.
 */
import type { SystemEntitySchema } from '../types';
import { drdhBestieSchema } from './bestie';
import { drdhTokenSchema } from './token';

export { drdhBestieSchema, drdhTokenSchema };

export const drdhSchemas: SystemEntitySchema[] = [
  drdhBestieSchema,
  drdhTokenSchema,
];
