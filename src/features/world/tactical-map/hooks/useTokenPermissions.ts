/**
 * 10.2d — `canDrag(token)` permission gate (klient, mirror BE
 * OperationsAuthorizer; BE je autoritativní).
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C4.
 */
import { useCallback } from 'react';
import type { MapScene, MapToken } from '../types';

interface Args {
  scene: MapScene | null;
  isGlobalAdmin: boolean;
  isPj: boolean;
  mySlugs: string[];
}

export function useTokenPermissions({
  scene,
  isGlobalAdmin,
  isPj,
  mySlugs,
}: Args): (token: MapToken) => boolean {
  return useCallback(
    (token: MapToken) => {
      if (!scene) return false;
      if (scene.isLocked && !isPj && !isGlobalAdmin) return false;
      if (
        scene.combat?.isActive &&
        scene.combat.currentTokenId !== token.id &&
        !isPj &&
        !isGlobalAdmin
      ) {
        return false;
      }
      if (isPj || isGlobalAdmin) return true;
      return mySlugs.includes(token.characterSlug);
    },
    [scene, isGlobalAdmin, isPj, mySlugs],
  );
}
