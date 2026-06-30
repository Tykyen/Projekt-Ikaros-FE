/**
 * Fate Accelerated (fae) token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const faeTokenSchema = schema as SystemEntitySchema;
