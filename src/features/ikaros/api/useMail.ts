import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import { useSocketEvent } from '@/features/chat';
import type { IkarosMessage, UnreadCountResponse } from '@/shared/types';

const PAGE_SIZE = 50;

export const mailKeys = {
  unread: ['mail', 'unread'] as const,
  inbox: ['mail', 'inbox'] as const,
  sent: ['mail', 'sent'] as const,
  detail: (id: string) => ['mail', 'detail', id] as const,
  conversation: (id: string) => ['mail', 'conversation', id] as const,
};

/**
 * Počet nepřečtených zpráv (badge v headeru).
 * 3.5 — přesunuto z `chat/api/useMessages` do pošty (dluh A).
 */
export function useUnreadCount() {
  const token = useAtomValue(accessTokenAtom);
  const qc = useQueryClient();

  useSocketEvent('ikaros:new-message', () => {
    void qc.invalidateQueries({ queryKey: mailKeys.unread });
    void qc.invalidateQueries({ queryKey: mailKeys.inbox });
  });

  return useQuery({
    queryKey: mailKeys.unread,
    queryFn: () =>
      api.get<UnreadCountResponse>('/ikaros-messages/unread-count'),
    enabled: !!token,
    staleTime: 60_000,
    refetchInterval: 60_000, // fallback — socket je primární
  });
}

export function useMailFolder(folder: 'inbox' | 'sent') {
  const token = useAtomValue(accessTokenAtom);
  return useInfiniteQuery({
    queryKey: folder === 'inbox' ? mailKeys.inbox : mailKeys.sent,
    queryFn: ({ pageParam }) =>
      api.get<IkarosMessage[]>(`/ikaros-messages/${folder}`, {
        limit: PAGE_SIZE,
        ...(pageParam ? { before: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.length === PAGE_SIZE ? last[last.length - 1]?.id : undefined,
    enabled: !!token,
    staleTime: 30_000,
  });
}

export const useInbox = () => useMailFolder('inbox');
export const useSentMail = () => useMailFolder('sent');

/** Detail zprávy — GET označí zprávu jako přečtenou (BE), proto invaliduje badge. */
export function useMessageDetail(id: string | null) {
  const token = useAtomValue(accessTokenAtom);
  const qc = useQueryClient();
  return useQuery({
    queryKey: mailKeys.detail(id ?? ''),
    queryFn: async () => {
      const msg = await api.get<IkarosMessage>(`/ikaros-messages/${id}`);
      void qc.invalidateQueries({ queryKey: mailKeys.unread });
      void qc.invalidateQueries({ queryKey: mailKeys.inbox });
      return msg;
    },
    enabled: !!token && !!id,
  });
}

/** Celé vlákno konverzace, vzestupně. */
export function useConversation(conversationId: string | null) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: mailKeys.conversation(conversationId ?? ''),
    queryFn: () =>
      api.get<IkarosMessage[]>(
        `/ikaros-messages/conversation/${conversationId}`,
      ),
    enabled: !!token && !!conversationId,
  });
}

export interface SendMessagePayload {
  subject: string;
  body: string;
  recipientId: string;
  recipientName: string;
  /** Vyplněno → odpověď ve vlákně. */
  replyToId?: string;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SendMessagePayload) =>
      api.post<IkarosMessage>('/ikaros-messages', dto),
    onSuccess: (msg) => {
      void qc.invalidateQueries({ queryKey: mailKeys.inbox });
      void qc.invalidateQueries({ queryKey: mailKeys.sent });
      void qc.invalidateQueries({ queryKey: mailKeys.unread });
      void qc.invalidateQueries({
        queryKey: mailKeys.conversation(msg.conversationId),
      });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/ikaros-messages/${id}`),
    onSuccess: (_data, id) => {
      // C-08 — surgical removal z infinite cache (zachová scroll pozici místo
      // refetch všech stránek). Unread badge dál invalidujeme (počet z BE).
      const removeFromPages = (
        old: InfiniteData<IkarosMessage[]> | undefined,
      ): InfiniteData<IkarosMessage[]> | undefined =>
        old
          ? { ...old, pages: old.pages.map((p) => p.filter((m) => m.id !== id)) }
          : old;
      qc.setQueryData(mailKeys.inbox, removeFromPages);
      qc.setQueryData(mailKeys.sent, removeFromPages);
      void qc.invalidateQueries({ queryKey: mailKeys.unread });
      // FIX-5 — bez tohohle zůstává smazaná zpráva „duch" v otevřeném vlákně
      // (`useConversation` cache). Prefix match invaliduje bez ohledu na
      // konkrétní conversationId (tady po smazání nemáme).
      void qc.invalidateQueries({ queryKey: ['mail', 'conversation'] });
    },
  });
}
