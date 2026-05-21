import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { emoteKeys } from './useWorldEmotes';
import type { WorldEmote } from '../lib/types';

/** Krok 6.4d — Admin smaže globální emote. */
export function useDeleteGlobalEmote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emoteId: string): Promise<void> => {
      await apiClient.delete(`/emotes/global/${emoteId}`);
    },
    onSuccess: (_, emoteId) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.global, (prev) =>
        prev ? prev.filter((e) => e.id !== emoteId) : prev,
      );
    },
  });
}
