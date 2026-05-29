/**
 * 10.2c-edit-9g — Call of Cthulhu token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const cocTokenSchema = schema as SystemEntitySchema;
