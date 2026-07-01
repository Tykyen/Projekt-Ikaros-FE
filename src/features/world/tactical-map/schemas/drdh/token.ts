/**
 * 16b bestie — Dračí Hlídka (drdh) token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`. Token je superset bestie fields (BE strict
 * validace při token.update REPLACE systemStats).
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const drdhTokenSchema = schema as SystemEntitySchema;
