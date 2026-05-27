/**
 * 10.2d-prep-A — DrD2 token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const drd2TokenSchema = schema as SystemEntitySchema;
