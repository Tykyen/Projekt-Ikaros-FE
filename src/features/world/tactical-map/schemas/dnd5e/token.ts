/**
 * 10.2c-edit-9g — D&D 5E token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const dnd5eTokenSchema = schema as SystemEntitySchema;
