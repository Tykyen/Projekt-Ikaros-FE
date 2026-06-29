/**
 * Příběhy Impéria (pi) token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`. MapToken instance stats v TokenInfoPanel.
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const piTokenSchema = schema as SystemEntitySchema;
