/**
 * Barrel export Příběhy Impéria (pi) schémat (bestie + token).
 * Bootstrap registruje `piSchemas` jednou hromadně.
 * Stejný generický statblok jako Matrix.
 */
import type { SystemEntitySchema } from '../types';
import { piBestieSchema } from './bestie';
import { piTokenSchema } from './token';

export { piBestieSchema, piTokenSchema };

/** Všechna pi schémata pro hromadnou registraci v bootstrap. */
export const piSchemas: SystemEntitySchema[] = [piBestieSchema, piTokenSchema];
