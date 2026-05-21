import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { emoteKeys } from './useWorldEmotes';
import type { WorldEmote } from '../lib/types';

export interface UpdateEmoteArgs {
  emoteId: string;
  /** Aspoň jedno pole musí být přítomno. */
  patch: Partial<{
    name: string;
    shortcode: string;
    imageId: string;
    imageUrl: string;
  }>;
}

/** D-NEW-emote-update — PATCH /emotes/:worldId/:id (PJ/PomocnyPJ+). */
export function useUpdateEmote(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      emoteId,
      patch,
    }: UpdateEmoteArgs): Promise<WorldEmote> => {
      const res = await apiClient.patch<WorldEmote>(
        `/emotes/${worldId}/${emoteId}`,
        patch,
      );
      return res.data;
    },
    onSuccess: (emote) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.world(worldId), (prev) =>
        prev ? prev.map((e) => (e.id === emote.id ? emote : e)) : prev,
      );
    },
  });
}
