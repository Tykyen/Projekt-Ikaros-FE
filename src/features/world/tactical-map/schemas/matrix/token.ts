/**
 * 10.2c-edit-9g — Matrix token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`. Matrix token = MapToken instance stats v TokenInfoPanel.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const matrixTokenSchema = schema as SystemEntitySchema;
