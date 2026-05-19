import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import type { ChatMessage, ChatAttachment } from '@/features/chat/lib/types';
import type {
  GroupWithChannels,
  ChannelUnread,
  ChatSearchResult,
} from '../lib/types';

/** Počet zpráv načtených z historie při otevření konverzace. */
export const HISTORY_LIMIT = 50;

const base = (worldId: string) => `/worlds/${worldId}/chat`;

/** Query klíče světového chatu — sdílené s WS cache mutacemi. */
export const worldChatKeys = (worldId: string) =>
  ({
    groups: ['world-chat', worldId, 'groups'] as const,
    unread: ['world-chat', worldId, 'unread'] as const,
    messages: (channelId: string) =>
      ['world-chat', worldId, 'messages', channelId] as const,
  }) as const;

/** Kanály světa s vnořenými konverzacemi (BE filtruje dle přístupu). */
export function useChatGroups(worldId: string) {
  return useQuery({
    queryKey: worldChatKeys(worldId).groups,
    queryFn: () => api.get<GroupWithChannels[]>(`${base(worldId)}/groups`),
    enabled: !!worldId,
  });
}

/** Historie zpráv konverzace (posledních 50) — seed, dál přes WS. */
export function useChannelMessages(
  worldId: string,
  channelId: string | null,
) {
  return useQuery({
    queryKey: worldChatKeys(worldId).messages(channelId ?? ''),
    queryFn: () =>
      api.get<ChatMessage[]>(
        `${base(worldId)}/channels/${channelId}/messages`,
        { limit: HISTORY_LIMIT },
      ),
    enabled: !!worldId && !!channelId,
  });
}

export interface SendWorldMessagePayload {
  content: string;
  /** Hex barva textu — chatColor odesílatele. */
  color?: string;
  attachments?: ChatAttachment[];
}

/** Odeslání zprávy do konverzace. Vykreslí se až přes WS echo. */
export function useSendMessage(worldId: string, channelId: string) {
  return useMutation({
    mutationFn: (dto: SendWorldMessagePayload) =>
      api.post<ChatMessage>(
        `${base(worldId)}/channels/${channelId}/messages`,
        dto,
      ),
  });
}

/** Smazání zprávy (PJ/Admin). Propsání všem přes WS `chat:message:deleted`. */
export function useDeleteMessage(worldId: string) {
  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`${base(worldId)}/messages/${messageId}`),
  });
}

/** Označí konverzaci jako přečtenou — vynuluje unread. */
export function useMarkRead(worldId: string) {
  return useMutation({
    mutationFn: (channelId: string) =>
      api.post(`${base(worldId)}/channels/${channelId}/read`, {}),
  });
}

/** Nepřečtené počty per konverzace — seed, dál přes WS `chat:unread`. */
export function useUnread(worldId: string) {
  return useQuery({
    queryKey: worldChatKeys(worldId).unread,
    queryFn: () => api.get<ChannelUnread[]>(`${base(worldId)}/unread`),
    enabled: !!worldId,
  });
}

/**
 * Hledání ve zprávách světa (krok 6.6) — substring v `content` napříč
 * konverzacemi, kam uživatel vidí; volitelně zúženo na jednu konverzaci.
 * Spustí se až od 2 znaků dotazu.
 */
export function useSearchMessages(
  worldId: string,
  query: string,
  channelId: string | null,
) {
  const q = query.trim();
  return useQuery({
    queryKey: ['world-chat', worldId, 'search', q, channelId ?? ''],
    queryFn: () =>
      api.get<ChatSearchResult[]>(`${base(worldId)}/search`, {
        q,
        ...(channelId ? { channelId } : {}),
      }),
    enabled: !!worldId && q.length >= 2,
  });
}

/**
 * Živá synchronizace unread cache přes WS `chat:unread`. Volá se kdekoli,
 * kde se zobrazují unread počty (chat sám i dashboard dlaždice) — sdílená
 * React Query cache → jeden zdroj pravdy.
 */
export function useUnreadSync(worldId: string): void {
  const qc = useQueryClient();
  useSocketEvent<ChannelUnread>('chat:unread', (e) => {
    qc.setQueryData<ChannelUnread[]>(
      worldChatKeys(worldId).unread,
      (old) => {
        const list = old ?? [];
        const i = list.findIndex((u) => u.channelId === e.channelId);
        if (i === -1) return [...list, e];
        const next = [...list];
        next[i] = e;
        return next;
      },
    );
  });
}
