import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { GameEvent, UpcomingEventDto } from '@/shared/types';

export function useUpcomingEventsMine(opts: { limit?: number } = {}) {
  const token = useAtomValue(accessTokenAtom);
  const limit = opts.limit ?? 5;
  return useQuery({
    queryKey: ['game-events', 'upcoming-mine', limit],
    queryFn: () =>
      api.get<UpcomingEventDto[]>(`/game-events/upcoming/mine?limit=${limit}`),
    enabled: !!token,
    staleTime: 60_000,
    placeholderData: [],
  });
}

/**
 * 5.2 — nadcházející herní akce světa (`GET /game-events?worldId=`).
 * `fromDate` = dnešní půlnoc → vrací jen budoucí akce.
 */
export function useWorldGameEvents(worldId: string, limit = 10) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['game-events', 'world', worldId, limit],
    queryFn: () => {
      const now = new Date();
      const fromDate =
        `${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, '0')}-` +
        `${String(now.getDate()).padStart(2, '0')}T00:00`;
      return api.get<GameEvent[]>(
        `/game-events?worldId=${worldId}&limit=${limit}&fromDate=${fromDate}`,
      );
    },
    enabled: !!token && !!worldId,
    staleTime: 60_000,
    placeholderData: [],
  });
}

export function useToggleRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      api.post<void>(`/game-events/${eventId}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['game-events', 'upcoming-mine'] });
    },
  });
}
