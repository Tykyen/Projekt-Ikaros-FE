import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { useSocketEvent, useSocketReconnect } from '@/features/chat/api/useSocket';
import { emoteKeys } from './useWorldEmotes';
import type { WorldEmote } from '../lib/types';

/**
 * Krok 6.4b — načte globální emoty (sdílené napříč všemi světy) + WS sync
 * (`emote:created-global`, `emote:deleted-global`).
 *
 * Globální emoty BE filtruje jen na JWT (žádný membership), takže může
 * volat jakákoli přihlášená komponenta.
 */
export function useGlobalEmotes() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: emoteKeys.global,
    queryFn: async (): Promise<WorldEmote[]> => {
      const res = await apiClient.get<WorldEmote[]>('/emotes/global');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const onCreated = useCallback(
    (emote: WorldEmote) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.global, (prev) =>
        prev ? [emote, ...prev.filter((e) => e.id !== emote.id)] : [emote],
      );
    },
    [qc],
  );

  const onDeleted = useCallback(
    ({ emoteId }: { emoteId: string }) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.global, (prev) =>
        prev ? prev.filter((e) => e.id !== emoteId) : prev,
      );
    },
    [qc],
  );

  const onUpdated = useCallback(
    (emote: WorldEmote) => {
      qc.setQueryData<WorldEmote[]>(emoteKeys.global, (prev) =>
        prev ? prev.map((e) => (e.id === emote.id ? emote : e)) : prev,
      );
    },
    [qc],
  );

  useSocketEvent<WorldEmote>('emote:created-global', onCreated);
  useSocketEvent<{ emoteId: string }>('emote:deleted-global', onDeleted);
  useSocketEvent<WorldEmote>('emote:updated-global', onUpdated);

  // FIX-5 — reconnect fallback: `emote:*-global` zmeškané během výpadku jsou
  // pryč → po reconnectu refetch, ať se sada globálních emotů dorovná.
  useSocketReconnect(() => {
    void qc.invalidateQueries({ queryKey: emoteKeys.global });
  });

  return query;
}
