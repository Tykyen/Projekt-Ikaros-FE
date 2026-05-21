import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { emoteKeys } from './useWorldEmotes';
import type { CopyEmoteDto, WorldEmote } from '../lib/types';

interface CopyEmoteArgs {
  emoteId: string;
  targetWorldId: string;
}

/**
 * Krok 6.4c — PJ zkopíruje emote ze svého světa do cílového světa
 * (kde má taky PomocnyPJ+). Cílový svět dostane WS `emote:created`
 * automaticky přes BE event.
 */
export function useCopyEmote(sourceWorldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      emoteId,
      targetWorldId,
    }: CopyEmoteArgs): Promise<WorldEmote> => {
      const dto: CopyEmoteDto = { targetWorldId };
      const res = await apiClient.post<WorldEmote>(
        `/emotes/${sourceWorldId}/${emoteId}/copy`,
        dto,
      );
      return res.data;
    },
    onSuccess: (emote) => {
      // Pokud má klient cíl loaded, doplnit cache; jinak WS event obstará.
      qc.setQueryData<WorldEmote[]>(
        emoteKeys.world(emote.worldId as string),
        (prev) =>
          prev ? [emote, ...prev.filter((e) => e.id !== emote.id)] : prev,
      );
    },
  });
}
