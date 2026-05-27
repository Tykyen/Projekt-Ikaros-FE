/**
 * 10.2c — list aktivních scén ve světě pro PJ orchestrator panel.
 *
 * Per 10.2-prep-1 uvolněnou semantiku `isActive`: víc scén může být active
 * paralelně (Matrixář na boji, družina na hospůdce, atd.). PJ vidí list,
 * kliká na řádek → switch self přes `member.assignToScene { userId: self,
 * sceneId }`.
 *
 * Auto-invalidate na `world:operation` event s `op.type` typu `member.*`
 * — jiný PJ může změnit svět, list se obnoví live.
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.1 (PJ panel), §3.2 (WS sync).
 */
import { useEffect } from 'react';
import {
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { getSocket } from '@/features/chat/api/socket';
import { listActiveMapScenes } from '../api/mapApi';
import type { MapScene, WorldOperationBroadcast } from '../types';

export const activeScenesQueryKey = (worldId: string): QueryKey => [
  'map',
  'world-active-scenes',
  worldId,
];

interface UseActiveScenesResult {
  scenes: MapScene[];
  isLoading: boolean;
  refetch: () => void;
}

export function useActiveScenes(
  worldId: string | null,
  enabled = true,
): UseActiveScenesResult {
  const queryClient = useQueryClient();

  const query = useQuery<MapScene[]>({
    queryKey: worldId
      ? activeScenesQueryKey(worldId)
      : ['map', 'world-active-scenes', 'none'],
    enabled: Boolean(worldId) && enabled,
    queryFn: () => listActiveMapScenes(worldId!),
    staleTime: 60_000,
  });

  // WS: invalidate na world:operation pokud op.type začíná 'member.'
  useEffect(() => {
    if (!worldId || !enabled) return;
    const socket = getSocket();

    socket.emit('map:join-world', worldId);

    const handler = (payload: WorldOperationBroadcast): void => {
      if (payload.worldId !== worldId) return;
      if (!payload.op.type.startsWith('member.')) return;
      void queryClient.invalidateQueries({
        queryKey: activeScenesQueryKey(worldId),
      });
    };
    socket.on('world:operation', handler);

    return () => {
      socket.off('world:operation', handler);
      socket.emit('map:leave-world', worldId);
    };
  }, [worldId, enabled, queryClient]);

  return {
    scenes: query.data ?? [],
    isLoading: query.isLoading,
    refetch: () => void query.refetch(),
  };
}
