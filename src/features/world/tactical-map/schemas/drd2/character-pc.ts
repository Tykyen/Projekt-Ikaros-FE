/**
 * 10.2d-prep-A — DrD2 character-pc schéma (typed wrapper kolem JSON).
 * Kostra — plný impl s 8.x reload.
 */
import schema from './character-pc.json';
import type { SystemEntitySchema } from '../types';

export const drd2CharacterPcSchema = schema as SystemEntitySchema;
