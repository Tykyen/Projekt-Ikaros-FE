/**
 * 10.2d-prep-B — TanStack Query hook pro list bestií ve světě.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent, useSocketReconnect } from '@/features/chat';
import { listBestie } from '../api/bestiarApi';
import type { BestiarResponse } from '../types';

export const bestiarQueryKey = (worldId: string | null, systemId: string | null) =>
  ['bestiar', worldId ?? 'none', systemId ?? 'none'] as const;

export function useBestiar(
  worldId: string | null,
  systemId: string | null,
  enabled = true,
) {
  const qc = useQueryClient();
  // C-34 — BE bestiar:changed (scope-routed: world/user room nebo broadcast pro
  // system scope). Invaliduj všechny otevřené světy téhož systému (cross-world).
  useSocketEvent<{ systemId: string }>('bestiar:changed', (p) => {
    void qc.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'bestiar' && q.queryKey[2] === p.systemId,
    });
  });
  // FIX-5 — reconnect fallback: `bestiar:changed` zmeškaný během výpadku je
  // pryč → po reconnectu invaliduj TUTO query (worldId+systemId), ať se
  // bestiář dorovná bez čekání na další live event.
  useSocketReconnect(() => {
    void qc.invalidateQueries({ queryKey: bestiarQueryKey(worldId, systemId) });
  });
  return useQuery<BestiarResponse>({
    queryKey: bestiarQueryKey(worldId, systemId),
    queryFn: () => listBestie(systemId!, worldId ?? undefined),
    enabled: enabled && Boolean(worldId && systemId),
    staleTime: 30_000,
  });
}
