import { useMemo } from 'react';
import {
  useUnread,
  useUnreadSync,
} from '@/features/world/chat/api/useWorldChat';

/**
 * Chat světa — švový hook pro dashboard dlaždici „Chat".
 *
 * Počet nepřečtených zpráv chatu světa — souhrn napříč konverzacemi.
 * Krok 6.1e — napojeno na reálný BE unread tracking
 * (`GET /worlds/:id/chat/unread` + živá synchronizace přes WS `chat:unread`).
 */
export function useWorldChatUnread(worldId: string): number {
  const unread = useUnread(worldId);
  useUnreadSync(worldId);
  return useMemo(
    () => (unread.data ?? []).reduce((sum, u) => sum + u.count, 0),
    [unread.data],
  );
}
