import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ChatMessage, RoomInfo } from '../lib/types';

const CHAT_KEY = ['global-chat'] as const;

/** Počet zpráv načtených z historie při vstupu do místnosti. */
export const HISTORY_LIMIT = 50;

/**
 * Info o místnosti — `channelId` + seznam přítomných.
 * Volá se jednou při mountu; další změny presence řeší WS `chat:presence`.
 */
export function useRoomInfo() {
  return useQuery({
    queryKey: [...CHAT_KEY, 'room-info'],
    queryFn: () => api.get<RoomInfo>('/global-chat/room-info'),
  });
}

/**
 * Historie zpráv (posledních 50, TTL 1 h na BE).
 * Slouží jako počáteční seed — další zprávy přicházejí přes WS `chat:message`.
 */
export function useChatHistory() {
  return useQuery({
    queryKey: [...CHAT_KEY, 'messages'],
    queryFn: () =>
      api.get<ChatMessage[]>('/global-chat/messages', { limit: HISTORY_LIMIT }),
  });
}

export interface SendMessagePayload {
  content: string;
  /** Hex barva textu — chatColor odesílatele. */
  color?: string;
}

/** Odeslání veřejné zprávy. Zpráva se vykreslí až přes WS echo. */
export function useSendMessage() {
  return useMutation({
    mutationFn: (dto: SendMessagePayload) =>
      api.post<ChatMessage>('/global-chat/messages', dto),
  });
}

/** Smazání zprávy (Admin/Superadmin). Propsání všem přes WS `chat:message:deleted`. */
export function useDeleteMessage() {
  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`/global-chat/messages/${messageId}`),
  });
}
