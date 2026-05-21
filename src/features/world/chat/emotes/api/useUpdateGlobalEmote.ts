import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { emoteKeys } from './useWorldEmotes';
import type { UpdateEmoteArgs } from './useUpdateEmote';
import type { WorldEmote } from '../lib/types';

/** D-NEW-emote-update — PATCH /emotes/global/:id (Admin+). */
export function useUpdateGlobalEmote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      emoteId,
      patch,
    }: UpdateEmoteArgs): Promise<WorldEmote> => {
      const res = await apiClient.patch<WorldEmote>(
        `/emotes/global/${emoteId}`,
        patch,
      );
      return res.data;
    },
    onSuccess: (emote) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.global, (prev) =>
        prev ? prev.map((e) => (e.id === emote.id ? emote : e)) : prev,
      );
    },
  });
}
