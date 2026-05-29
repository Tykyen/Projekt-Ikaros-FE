/**
 * 10.2c-edit-9g — barrel export Matrix schémat (bestie + token).
 * Bootstrap registruje `matrixSchemas` jednou hromadně.
 */
import type { SystemEntitySchema } from '../types';
import { matrixBestieSchema } from './bestie';
import { matrixTokenSchema } from './token';

export { matrixBestieSchema, matrixTokenSchema };

/** Všechna Matrix schémata pro hromadnou registraci v bootstrap. */
export const matrixSchemas: SystemEntitySchema[] = [
  matrixBestieSchema,
  matrixTokenSchema,
];
