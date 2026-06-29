/**
 * Příběhy Impéria (pi) bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. Stejný generický pattern jako Matrix
 * (HP/Zbroj/Zranění/Pohyb/Init/Abilities).
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const piBestieSchema = schema as SystemEntitySchema;
