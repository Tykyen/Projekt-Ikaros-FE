/**
 * 10.2d — `canDrag(token)` permission gate (klient, mirror BE
 * OperationsAuthorizer; BE je autoritativní).
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C4.
 */
import { useCallback } from 'react';
import { effectiveLocked } from '../utils/sceneAccess';
import type { MapScene, MapToken } from '../types';

interface Args {
  scene: MapScene | null;
  isGlobalAdmin: boolean;
  isPj: boolean;
  mySlugs: string[];
  /** 10.2n — current user ID pro efektivní per-hráč zámek. */
  userId: string;
}

export function useTokenPermissions({
  scene,
  isGlobalAdmin,
  isPj,
  mySlugs,
  userId,
}: Args): (token: MapToken) => boolean {
  return useCallback(
    (token: MapToken) => {
      if (!scene) return false;
      // 10.2n — efektivní zámek (per-hráč override ?? per-scéna default).
      if (effectiveLocked(scene, userId) && !isPj && !isGlobalAdmin)
        return false;
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
    [scene, isGlobalAdmin, isPj, mySlugs, userId],
  );
}
