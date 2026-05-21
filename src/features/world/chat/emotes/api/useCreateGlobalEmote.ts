import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { emoteKeys } from './useWorldEmotes';
import type { CreateEmoteDto, WorldEmote } from '../lib/types';

/** Krok 6.4d — Admin vytvoří globální emote platformy. */
export function useCreateGlobalEmote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateEmoteDto): Promise<WorldEmote> => {
      const res = await apiClient.post<WorldEmote>('/emotes/global', dto);
      return res.data;
    },
    onSuccess: (emote) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.global, (prev) =>
        prev ? [emote, ...prev.filter((e) => e.id !== emote.id)] : [emote],
      );
    },
  });
}
