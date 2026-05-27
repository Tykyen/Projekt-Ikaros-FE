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
    mutationFn: (payload: { tokenId: string; patch: Partial<MapToken> }) =>
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
    },
  });
}
