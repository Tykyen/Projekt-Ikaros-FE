/**
 * 8.7r — JaD token schéma (typed wrapper kolem JSON).
 * Token = runtime instance bestie na mapě (snapshot statbloku + health.current).
 */
import schema from './token.json';
import type { SystemEntitySchema } from '../types';

export const jadTokenSchema = schema as SystemEntitySchema;
