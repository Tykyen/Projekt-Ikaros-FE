import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import { useSocketEvent, useSocketReconnect } from '@/features/chat';
import { centerOpenAtom, chatFeedUnseenAtom } from '../model/centerStore';
import type { ChatFeedItem } from '../types';

const PAGE_SIZE = 50;

export const chatFeedKeys = {
  all: ['chat-feed'] as const,
};

/**
 * Spec 13.2a — „Souhrn chatů": zprávy napříč všemi mými světy (cursor paginace
 * přes `before`). Access-safe data dodává BE `GET /chat/feed`.
 */
export function useChatFeed(enabled = true) {
  const token = useAtomValue(accessTokenAtom);
  return useInfiniteQuery({
    queryKey: chatFeedKeys.all,
    queryFn: ({ pageParam }) =>
      api.get<ChatFeedItem[]>('/chat/feed', {
        limit: PAGE_SIZE,
        ...(pageParam ? { before: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.length === PAGE_SIZE ? last[last.length - 1]?.id : undefined,
    enabled: !!token && enabled,
    staleTime: 30_000,
  });
}

/**
 * Globální live listener — volat **jednou** v root layoutu. Na `chat:feed:bump`
 * (leak-safe signál z BE) invaliduje feed a tiká badge u zvonku, i když je
 * centrum zavřené. Vlastní zprávy badge netikají (BE posílá signál jen
 * příjemcům, ne odesílateli).
 */
export function useChatFeedLive() {
  const qc = useQueryClient();
  const open = useAtomValue(centerOpenAtom);
  const setUnseen = useSetAtom(chatFeedUnseenAtom);

  useSocketEvent('chat:feed:bump', () => {
    void qc.invalidateQueries({ queryKey: chatFeedKeys.all });
    if (!open) setUnseen((n) => n + 1);
  });
  // C-46 — po reconnectu refetch feed (WS mohl během výpadku zmeškat bumpy).
  useSocketReconnect(() => {
    void qc.invalidateQueries({ queryKey: chatFeedKeys.all });
  });
}
