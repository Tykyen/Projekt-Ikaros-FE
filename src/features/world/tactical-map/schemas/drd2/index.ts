/**
 * 10.2d-prep-A — barrel export DrD2 schémat.
 *
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C3.
 */
import type { SystemEntitySchema } from '../types';
import { drd2BestieSchema } from './bestie';
import { drd2TokenSchema } from './token';
import { drd2CharacterPcSchema } from './character-pc';
import { drd2CharacterNpcSchema } from './character-npc';
import { drd2DiaryPcSchema } from './diary-pc';
import { drd2DiaryNpcSchema } from './diary-npc';

export {
  drd2BestieSchema,
  drd2TokenSchema,
  drd2CharacterPcSchema,
  drd2CharacterNpcSchema,
  drd2DiaryPcSchema,
  drd2DiaryNpcSchema,
};

/** Všechna DrD2 schémata pro hromadnou registraci v bootstrap. */
export const drd2Schemas: SystemEntitySchema[] = [
  drd2BestieSchema,
  drd2TokenSchema,
  drd2CharacterPcSchema,
  drd2CharacterNpcSchema,
  drd2DiaryPcSchema,
  drd2DiaryNpcSchema,
];
