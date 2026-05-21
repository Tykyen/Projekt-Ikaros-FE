import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import type { WorldEmote } from '../lib/types';

/** Cache klíče pro custom emoty. Sjednoceno, ať lze invalidovat zvenčí. */
export const emoteKeys = {
  world: (worldId: string) => ['world-emotes', worldId] as const,
  global: ['global-emotes'] as const,
};

/**
 * Krok 6.4b — načte per-svět emoty (jen pro členy světa) + WS sync
 * (`emote:created`, `emote:deleted`).
 *
 * WS události jdou do roomu `world:<worldId>` — `WorldChatRoom` se k němu
 * připojuje skrze `room:join`, takže když je hook používán uvnitř chatu,
 * eventy přicházejí. Mimo chat (např. v admin stránce) musí konzument sám
 * `room:join` zařídit — viz `WorldEmotesAdminPage`.
 */
export function useWorldEmotes(worldId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    enabled: !!worldId,
    queryKey: worldId ? emoteKeys.world(worldId) : ['world-emotes', 'noop'],
    queryFn: async (): Promise<WorldEmote[]> => {
      const res = await apiClient.get<WorldEmote[]>(`/emotes/${worldId}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const onCreated = useCallback(
    (emote: WorldEmote) => {
      if (!worldId || emote.worldId !== worldId) return;
      qc.setQueryData<WorldEmote[]>(emoteKeys.world(worldId), (prev) =>
        prev ? [emote, ...prev.filter((e) => e.id !== emote.id)] : [emote],
      );
    },
    [qc, worldId],
  );

  const onDeleted = useCallback(
    ({ emoteId }: { emoteId: string }) => {
      if (!worldId) return;
      qc.setQueryData<WorldEmote[]>(emoteKeys.world(worldId), (prev) =>
        prev ? prev.filter((e) => e.id !== emoteId) : prev,
      );
    },
    [qc, worldId],
  );

  const onUpdated = useCallback(
    (emote: WorldEmote) => {
      if (!worldId || emote.worldId !== worldId) return;
      qc.setQueryData<WorldEmote[]>(emoteKeys.world(worldId), (prev) =>
        prev ? prev.map((e) => (e.id === emote.id ? emote : e)) : prev,
      );
    },
    [qc, worldId],
  );

  useSocketEvent<WorldEmote>('emote:created', onCreated);
  useSocketEvent<{ emoteId: string }>('emote:deleted', onDeleted);
  useSocketEvent<WorldEmote>('emote:updated', onUpdated);

  // Připojení k world room — pokud konzument není uvnitř WorldChatRoom,
  // musí si zařídit `room:join` sám (admin stránka). Nech to na konzumentovi
  // pro flexibilitu (chat už spojení drží).
  useEffect(() => {
    // no-op marker — chat orchestrator drží room:join
  }, [worldId]);

  return query;
}
