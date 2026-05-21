import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { emoteKeys } from './useWorldEmotes';
import type { CreateEmoteDto, WorldEmote } from '../lib/types';

/** Krok 6.4c — PJ vytvoří per-svět emote. WS event `emote:created` doplní cache. */
export function useCreateEmote(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateEmoteDto): Promise<WorldEmote> => {
      const res = await apiClient.post<WorldEmote>(`/emotes/${worldId}`, dto);
      return res.data;
    },
    onSuccess: (emote) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.world(worldId), (prev) =>
        prev ? [emote, ...prev.filter((e) => e.id !== emote.id)] : [emote],
      );
    },
  });
}
