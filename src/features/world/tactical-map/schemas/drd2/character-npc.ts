/**
 * 10.2d-prep-A — DrD2 character-npc schéma (typed wrapper kolem JSON).
 * Kostra — plný impl s 8.x reload.
 */
import schema from './character-npc.json';
import type { SystemEntitySchema } from '../types';

export const drd2CharacterNpcSchema = schema as SystemEntitySchema;
