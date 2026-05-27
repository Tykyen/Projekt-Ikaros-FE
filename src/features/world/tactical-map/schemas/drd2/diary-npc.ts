/**
 * 10.2d-prep-A — DrD2 diary-npc schéma (typed wrapper kolem JSON).
 * Kostra — plný impl s 8.5 reload.
 */
import schema from './diary-npc.json';
import type { SystemEntitySchema } from '../types';

export const drd2DiaryNpcSchema = schema as SystemEntitySchema;
