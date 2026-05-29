/**
 * 10.2c-edit-9g — GURPS token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const gurpsTokenSchema = schema as SystemEntitySchema;
