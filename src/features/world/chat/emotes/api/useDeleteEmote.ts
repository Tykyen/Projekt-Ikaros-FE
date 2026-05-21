import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { emoteKeys } from './useWorldEmotes';
import type { WorldEmote } from '../lib/types';

/** Krok 6.4c — PJ smaže emote světa. WS event `emote:deleted` doplní cache. */
export function useDeleteEmote(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emoteId: string): Promise<void> => {
      await apiClient.delete(`/emotes/${worldId}/${emoteId}`);
    },
    onSuccess: (_, emoteId) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.world(worldId), (prev) =>
        prev ? prev.filter((e) => e.id !== emoteId) : prev,
      );
    },
  });
}
