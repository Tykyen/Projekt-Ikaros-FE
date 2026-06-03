import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api, apiClient } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import { useSocketEvent } from './useSocket';
import { getSocket } from './socket';
import type {
  ChatAttachment,
  ChatMessage,
  RoomEnvironment,
  RoomInfo,
  RoomKey,
  RoomPresenceCounts,
} from '../lib/types';

/** Počet zpráv načtených z historie při vstupu do místnosti. */
export const HISTORY_LIMIT = 50;

/** Query klíče per místnost — sdílené s `ChatRoom` (WS cache mutace). */
export const chatQueryKeys = (room: RoomKey) =>
  ({
    roomInfo: ['global-chat', room, 'room-info'] as const,
    messages: ['global-chat', room, 'messages'] as const,
    environment: ['global-chat', room, 'environment'] as const,
  }) as const;

/**
 * Info o místnosti — `channelId` + seznam přítomných.
 * Volá se jednou při mountu; další změny presence řeší WS `chat:presence`.
 */
export function useRoomInfo(room: RoomKey) {
  return useQuery({
    queryKey: chatQueryKeys(room).roomInfo,
    queryFn: () => api.get<RoomInfo>('/global-chat/room-info', { room }),
  });
}

/**
 * Historie zpráv (posledních 50, TTL 1 h na BE).
 * Slouží jako počáteční seed — další zprávy přicházejí přes WS `chat:message`.
 */
export function useChatHistory(room: RoomKey) {
  return useQuery({
    queryKey: chatQueryKeys(room).messages,
    queryFn: () =>
      api.get<ChatMessage[]>('/global-chat/messages', {
        room,
        limit: HISTORY_LIMIT,
      }),
  });
}

/** Sdílený query klíč pro počty přítomných (REST seed + WS aktualizace). */
const ROOM_PRESENCE_COUNTS_KEY = ['global-chat', 'room-presence-counts'] as const;

/**
 * Počet přítomných v každé místnosti — odznaky v navigaci (4.2c §4).
 * REST seed + živá aktualizace přes WS `chat:rooms:presence`.
 */
export function useRoomPresenceCounts(): RoomPresenceCounts | undefined {
  const qc = useQueryClient();
  // N-30 — endpoint je za JwtAuthGuard; bez tohoto guardu anon (sidebar v public
  // shellu) pálil 401 a badge se nenačetl. Presence počty potřebuje jen logged-in.
  const token = useAtomValue(accessTokenAtom);
  const query = useQuery({
    queryKey: ROOM_PRESENCE_COUNTS_KEY,
    queryFn: () => api.get<RoomPresenceCounts>('/global-chat/rooms/presence'),
    enabled: !!token,
  });
  useSocketEvent<RoomPresenceCounts>('chat:rooms:presence', (counts) => {
    qc.setQueryData(ROOM_PRESENCE_COUNTS_KEY, counts);
  });
  return query.data;
}

export interface SendMessagePayload {
  content: string;
  /** Hex barva textu — chatColor odesílatele. */
  color?: string;
  /** ID zprávy, na kterou se odpovídá (krok 4.3a — reply). */
  replyToId?: string;
  /** Přílohy — obrázky / dokumenty nahrané přes `useUploadAttachment` (4.3b). */
  attachments?: ChatAttachment[];
}

/** Odeslání veřejné zprávy. Zpráva se vykreslí až přes WS echo. */
export function useSendMessage(room: RoomKey) {
  return useMutation({
    mutationFn: (dto: SendMessagePayload) =>
      api.post<ChatMessage>(
        `/global-chat/messages?room=${room}`,
        dto,
      ),
  });
}

/**
 * Nahrání jedné přílohy chatu na Cloudinary (krok 4.3b). Vrací `ChatAttachment`,
 * který se pak posílá v `attachments` zprávy. ChatInput volá per soubor až
 * při odeslání (upload-on-send) — žádné osiřelé soubory z nepoužitého výběru.
 */
export function useUploadAttachment(room: RoomKey) {
  return useMutation({
    mutationFn: async (file: File): Promise<ChatAttachment> => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post<ChatAttachment>(
        `/global-chat/upload?room=${room}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
  });
}

/**
 * Přepnutí emoji reakce na zprávě (krok 4.3a). Žádný REST — reakce je
 * efemérní jako zpráva (TTL 1 h). BE odpoví WS `chat:message:reaction`.
 */
export function useToggleReaction(room: RoomKey) {
  return useCallback(
    (messageId: string, emoji: string) => {
      getSocket().emit('chat:reaction:toggle', { room, messageId, emoji });
    },
    [room],
  );
}

/** Smazání zprávy (Admin/Superadmin). Propsání všem přes WS `chat:message:deleted`. */
export function useDeleteMessage(room: RoomKey) {
  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`/global-chat/messages/${messageId}?room=${room}`),
  });
}

/** Aktuální prostředí Rozcestí (styl + lokace). Pro Hospodu se nevolá. */
export function useRoomEnvironment(room: RoomKey) {
  return useQuery({
    queryKey: chatQueryKeys(room).environment,
    queryFn: () =>
      api.get<RoomEnvironment>(`/global-chat/rooms/${room}/environment`),
    enabled: room !== 'hospoda',
  });
}

/**
 * Změna prostředí Rozcestí — REST endpoint za role guardem (jen platformová
 * funkce). BE po uložení odbroadcastne WS `chat:room:environment`.
 */
export function useSetRoomEnvironment(room: RoomKey) {
  return useMutation({
    mutationFn: (dto: RoomEnvironment) =>
      api.put<RoomEnvironment>(`/global-chat/rooms/${room}/environment`, dto),
  });
}
