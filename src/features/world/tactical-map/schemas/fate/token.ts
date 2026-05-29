/**
 * 10.2c-edit-9g — Fate token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const fateTokenSchema = schema as SystemEntitySchema;
