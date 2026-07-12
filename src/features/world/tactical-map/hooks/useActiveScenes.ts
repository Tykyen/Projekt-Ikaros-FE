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
import { useAtomValue } from 'jotai';
import {
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { getSocket } from '@/features/chat/api/socket';
import { socketGenerationAtom } from '@/features/chat/store/socketStore';
import {
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';
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

  // Join/leave PJ world-ops roomu. D-AUDIT-2026-07-11 — `socketGenerationAtom`
  // v deps: po swapu instance (reconnectSocket / re-auth) se effect re-bindne,
  // takže unmount `map:leave-world` odejde na ŽIVÝ socket (dřív mířil na
  // mrtvou instanci a nový socket zůstal v roomu navždy).
  const socketGeneration = useAtomValue(socketGenerationAtom);
  useEffect(() => {
    if (!worldId || !enabled) return;
    const socket = getSocket();
    socket.emit('map:join-world', worldId);
    return () => {
      socket.emit('map:leave-world', worldId);
    };
  }, [worldId, enabled, socketGeneration]);

  // WS: invalidate na world:operation pokud op.type začíná 'member.'
  // Swap-safe přes `useSocketEvent` (dřív ruční listener na mrtvé instanci).
  useSocketEvent<WorldOperationBroadcast>('world:operation', (payload) => {
    if (!worldId || !enabled) return;
    if (payload.worldId !== worldId) return;
    if (!payload.op.type.startsWith('member.')) return;
    void queryClient.invalidateQueries({
      queryKey: activeScenesQueryKey(worldId),
    });
  });

  // W-7 — re-join world scenes roomu po reconnectu. Bez toho PJ orchestrátor po
  // výpadku přestane dostávat member operace a seznam aktivních scén zamrzne.
  useSocketReconnect(() => {
    if (worldId && enabled) getSocket().emit('map:join-world', worldId);
  });

  return {
    scenes: query.data ?? [],
    isLoading: query.isLoading,
    refetch: () => void query.refetch(),
  };
}
