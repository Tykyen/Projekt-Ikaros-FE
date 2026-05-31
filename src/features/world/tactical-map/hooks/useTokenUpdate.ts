/**
 * 10.2e C4 — token.update mutation hook.
 *
 * Optimistic apply + invalidate scene query po success.
 *
 * Plán: docs/arch/phase-10/plan-10.2e.md C4.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postMapOperation } from '../api/mapApi';
import { applyOperationToScene } from '../utils/applyOperationToScene';
import { mapSceneQueryKey } from './useMapScene';
import type { MapScene, MapToken } from '../types';

export function useTokenUpdate(sceneId: string, worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      tokenId: string;
      patch: Partial<MapToken>;
      /**
       * 10.2j — přeskočí `invalidateQueries` po úspěchu. Použij když běží
       * paralelně jiná optimistická operace na téže scéně (typicky `dice.roll`
       * u iniciativního hodu) — invalidate refetch by jinak sestřelil ještě
       * nepersistovaný hod z logu. Optimistic patch + WS broadcast stačí.
       */
      skipInvalidate?: boolean;
    }) =>
      postMapOperation(sceneId, {
        type: 'token.update',
        tokenId: payload.tokenId,
        patch: payload.patch,
      }),
    onMutate: ({ tokenId, patch }) => {
      const key = mapSceneQueryKey(worldId);
      const prev = qc.getQueryData<MapScene | null>(key);
      if (prev) {
        qc.setQueryData(
          key,
          applyOperationToScene(prev, {
            type: 'token.update',
            tokenId,
            patch,
          }),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(mapSceneQueryKey(worldId), ctx.prev);
      }
    },
    onSuccess: (_data, vars) => {
      if (vars.skipInvalidate) return;
      void qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
    },
  });
}
