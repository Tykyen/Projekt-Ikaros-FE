import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { UpcomingEventDto } from '@/shared/types';

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
