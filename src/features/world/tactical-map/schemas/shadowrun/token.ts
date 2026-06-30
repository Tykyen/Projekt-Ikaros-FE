/**
 * Shadowrun 6e — token schéma (typed wrapper kolem JSON).
 * Canonical = `token.json`. Superset bestie + health.current/initiative.current
 * (BE token.update = REPLACE systemStats + strict validace neznámých klíčů).
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const shadowrunTokenSchema = schema as SystemEntitySchema;
