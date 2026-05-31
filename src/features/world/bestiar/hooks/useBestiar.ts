/**
 * 10.2d-prep-B — TanStack Query hook pro list bestií ve světě.
 */
import { useQuery } from '@tanstack/react-query';
import { listBestie } from '../api/bestiarApi';
import type { BestiarResponse } from '../types';

export const bestiarQueryKey = (worldId: string | null, systemId: string | null) =>
  ['bestiar', worldId ?? 'none', systemId ?? 'none'] as const;

export function useBestiar(
  worldId: string | null,
  systemId: string | null,
  enabled = true,
) {
  return useQuery<BestiarResponse>({
    queryKey: bestiarQueryKey(worldId, systemId),
    queryFn: () => listBestie(systemId!, worldId ?? undefined),
    enabled: enabled && Boolean(worldId && systemId),
    staleTime: 30_000,
  });
}
