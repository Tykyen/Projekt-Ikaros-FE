/**
 * 10.2c-edit-9g — Matrix bestie schéma (typed wrapper kolem JSON).
 * Canonical = `bestie.json`. Matrix = generický pattern (HP/Zbroj/Pohyb/Init/Abilities).
 */
import schema from './bestie.json';
import type { SystemEntitySchema } from '../types';

export const matrixBestieSchema = schema as SystemEntitySchema;
