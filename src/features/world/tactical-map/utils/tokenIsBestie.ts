/**
 * 10.2e — discriminator pro typ tokenu.
 *
 * Bestie token = spawnnutý z bestiáře (10.2d-prep-B):
 *  - `templateId` set, NEBO
 *  - `characterId.startsWith('bestie:')` (placeholder z 10.2d BestiePalette)
 *
 * PC/NPC postava token = z Character entity (Pages 9.1):
 *  - `templateId` undefined
 *  - `characterId` je real Mongo _id
 *
 * Plán: docs/arch/phase-10/plan-10.2e.md C1.
 */
import type { MapToken } from '../types';

export function tokenIsBestie(
  token: Pick<MapToken, 'characterId' | 'templateId'>,
): boolean {
  if (token.templateId) return true;
  return token.characterId.startsWith('bestie:');
}
