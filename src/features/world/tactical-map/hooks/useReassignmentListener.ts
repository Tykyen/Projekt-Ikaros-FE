/**
 * 10.2c — listener pro private `map:reassigned` event.
 *
 * Server emit `map:reassigned { newSceneId }` na `user:{userId}` room (private),
 * když PJ provede `member.assignToScene` / `.unassign` na current usera.
 *
 * 10.2c-edit-1 — `newSceneId === null` znamená cascade unassign (např. po
 * `scene.deactivate` PJem). Listener invaliduje stejně — `GET /maps/active`
 * vrátí 404 → MapEmptyState se zobrazí.
 *
 * Klient: invalidate `useMapScene` query → automatický refetch nové scény
 * (per-user resolve teď vrátí novou `currentSceneId` nebo 404).
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.5,
 *       docs/arch/maps/scene-assignment-ux/api.md (deactivate cascade).
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/features/chat/api/socket';
import { mapSceneQueryKey } from './useMapScene';
import type { MapReassignedBroadcast } from '../types';

export function useReassignmentListener(worldId: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!worldId) return;
    const socket = getSocket();

    const handler = (_payload: MapReassignedBroadcast): void => {
      // Invalidate cache → useMapScene queryFn refire:
      //  - newSceneId !== null → GET /maps/active vrátí novou scénu (BE
      //    update membership.currentSceneId)
      //  - newSceneId === null → 404 MAP_NO_ACTIVE_SCENE → MapEmptyState
      void queryClient.invalidateQueries({
        queryKey: mapSceneQueryKey(worldId),
      });
    };

    socket.on('map:reassigned', handler);
    return () => {
      socket.off('map:reassigned', handler);
    };
  }, [worldId, queryClient]);
}
