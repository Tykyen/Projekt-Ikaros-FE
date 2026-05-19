import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import type {
  ChannelPresenceUser,
  ChannelPresenceEvent,
} from '../lib/types';

/**
 * Živá presence konverzace (krok 6.1d). REST seed při otevření konverzace +
 * průběžná aktualizace přes WS `chat:presence`. React Query cache je jediný
 * zdroj pravdy — WS event ji přímo mutuje (žádný lokální `useState`).
 * Volá se jen pro PJ/Pomocný PJ — `enabled` to gatuje.
 */
export function useChannelPresence(
  worldId: string,
  channelId: string | null,
  enabled: boolean,
): ChannelPresenceUser[] {
  const qc = useQueryClient();
  const key = ['world-chat', worldId, 'presence', channelId ?? ''] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      api.get<ChannelPresenceUser[]>(
        `/worlds/${worldId}/chat/channels/${channelId}/presence`,
      ),
    enabled: enabled && !!worldId && !!channelId,
  });

  useSocketEvent<ChannelPresenceEvent>('chat:presence', (e) => {
    if (e.channelId !== channelId) return;
    qc.setQueryData<ChannelPresenceUser[]>(key, (old) => {
      const without = (old ?? []).filter((u) => u.userId !== e.userId);
      if (e.action === 'leave') return without;
      return [
        ...without,
        {
          userId: e.userId,
          username: e.username,
          avatarUrl: e.avatarUrl,
          worldRole: e.worldRole,
        },
      ];
    });
  });

  return query.data ?? [];
}
