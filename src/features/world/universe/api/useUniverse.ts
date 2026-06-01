// 10.1 — TanStack Query vrstva nad `universe` API.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { accessTokenAtom } from '@/shared/store/authStore';
import {
  getUniverse,
  putUniverse,
  patchNodeVisibility,
} from './universeApi';
import type {
  UniverseMap,
  UpdateUniverseInput,
  UpdateNodeVisibilityInput,
} from '../types';

export const universeQueryKey = (worldId: string) =>
  ['universe', worldId] as const;

/** GET filtrovaná mapa světa (hráč dostane jen viditelné uzly — filtruje BE). */
export function useUniverse(worldId: string) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: universeQueryKey(worldId),
    queryFn: () => getUniverse(worldId),
    enabled: !!token && !!worldId,
    staleTime: 30_000,
  });
}

/** PUT full replace (PJ). BE emituje `universe:updated` → ostatní klienti. */
export function useUpdateUniverse(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUniverseInput) => putUniverse(worldId, input),
    onSuccess: (map) => qc.setQueryData(universeQueryKey(worldId), map),
  });
}

/** PATCH per-node visibility (PJ). Atomic — nepřepíše souběžné strukturální změny. */
export function useUpdateNodeVisibility(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { nodeId: string } & UpdateNodeVisibilityInput) =>
      patchNodeVisibility(worldId, vars.nodeId, {
        isPublic: vars.isPublic,
        visibleToPlayerIds: vars.visibleToPlayerIds,
      }),
    onSuccess: (map: UniverseMap) =>
      qc.setQueryData(universeQueryKey(worldId), map),
  });
}
