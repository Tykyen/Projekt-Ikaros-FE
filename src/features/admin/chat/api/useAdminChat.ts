import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api, apiClient } from '@/shared/api/client';
import { currentUserAtom } from '@/shared/store/authStore';
import {
  useSocket,
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';
import type { ChatAttachment, ChatMessage } from '@/features/chat/lib/types';
import type { AdminChatChannel } from '../lib/types';

/** TTL typing badge — po tolika ms bez re-emitu „píše" zmizí (odpojení apod.). */
const TYPING_TTL_MS = 5000;

/** WS `platform-chat:typing` (server→klient) — kdo v konverzaci právě píše. */
interface AdminTypingEvent {
  channelId: string;
  username: string;
  isTyping: boolean;
}

/** WS `platform-chat:message:deleted` — zpráva smazána (Sa nebo odesílatel). */
interface AdminMessageDeletedEvent {
  messageId: string;
  channelId: string;
}

/** Payload odeslání zprávy admin chatu (BE `POST /channels/:id/messages`). */
export interface SendAdminMessagePayload {
  content?: string;
  replyToId?: string;
  attachments?: ChatAttachment[];
}

const BASE = '/admin-chat';

export const adminChatKeys = {
  channels: ['admin-chat', 'channels'] as const,
  messages: (channelId: string) =>
    ['admin-chat', 'messages', channelId] as const,
};

/** Konverzace admin chatu dostupné aktuálnímu uživateli (BE filtruje dle členství). */
export function useAdminChatChannels() {
  return useQuery({
    queryKey: adminChatKeys.channels,
    queryFn: () => api.get<AdminChatChannel[]>(`${BASE}/channels`),
  });
}

/** Historie zpráv konverzace (posledních 50) — seed, dál přes WS. */
export function useAdminChatMessages(channelId: string | null) {
  return useQuery({
    queryKey: adminChatKeys.messages(channelId ?? ''),
    queryFn: () =>
      api.get<ChatMessage[]>(`${BASE}/channels/${channelId}/messages`, {
        limit: 50,
      }),
    enabled: !!channelId,
  });
}

/**
 * Odeslání zprávy (text, reply, přílohy). Zobrazí se přes WS echo + fallback
 * z odpovědi mutace.
 */
export function useSendAdminMessage(channelId: string) {
  return useMutation({
    mutationFn: (payload: SendAdminMessagePayload) =>
      api.post<ChatMessage>(`${BASE}/channels/${channelId}/messages`, payload),
  });
}

/**
 * Smazání zprávy. BE povolí Superadminovi NEBO odesílateli (204). Optimisticky
 * označíme zprávu jako smazanou; WS `platform-chat:message:deleted` to potvrdí
 * (idempotentní).
 */
export function useDeleteAdminMessage(channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`${BASE}/channels/${channelId}/messages/${messageId}`),
    onSuccess: (_res, messageId) => {
      qc.setQueryData<ChatMessage[]>(
        adminChatKeys.messages(channelId),
        (old) =>
          old
            ? old.map((m) =>
                m.id === messageId
                  ? { ...m, isDeleted: true, content: null }
                  : m,
              )
            : old,
      );
    },
  });
}

/**
 * Upload jedné přílohy admin chatu (`POST /channels/:id/upload`, multipart
 * `file`). Vzor `useUploadWorldAttachment` — composer volá per soubor až při
 * odeslání (upload-on-send), žádné osiřelé soubory.
 */
export function useUploadAdminAttachment(channelId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<ChatAttachment> => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post<ChatAttachment>(
        `${BASE}/channels/${channelId}/upload`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
  });
}

/**
 * Přepnutí emoji reakce na zprávě (`PUT .../reactions/:emoji`). Vrací celou
 * aktualizovanou zprávu; WS `platform-chat:message:updated` ji propíše všem
 * (i odesílateli, takže optimistic není potřeba).
 */
export function useToggleAdminReaction(channelId: string) {
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.put<ChatMessage>(
        `${BASE}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(
          emoji,
        )}`,
      ),
  });
}

/**
 * Real-time aktivní konverzace + join/leave room. Room
 * `platform-chat:{channelId}` (BE gate ověří admin roli + členství). Vrací
 * jména právě píšících (mimo aktuálního uživatele) pro `TypingIndicator`.
 */
export function useAdminChatRealtime(channelId: string | null): {
  typingNames: string[];
} {
  const qc = useQueryClient();
  const socket = useSocket();
  const currentUsername = useAtomValue(currentUserAtom)?.username;
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const typingTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  useEffect(() => {
    if (!channelId) return;
    socket.emit('platform-chat:join', { channelId });
    return () => {
      socket.emit('platform-chat:leave', { channelId });
    };
  }, [socket, channelId]);

  // Po reconnectu Socket.IO zahodí rooms → re-join.
  useSocketReconnect(() => {
    if (channelId) socket.emit('platform-chat:join', { channelId });
  });

  useSocketEvent<ChatMessage>('platform-chat:message', (msg) => {
    qc.setQueryData<ChatMessage[]>(
      adminChatKeys.messages(msg.channelId),
      (old) => {
        if (!old) return old;
        if (old.some((m) => m.id === msg.id)) return old; // dedupe echo
        return [...old, msg];
      },
    );
    // Preview poslední zprávy v sidebaru.
    void qc.invalidateQueries({ queryKey: adminChatKeys.channels });
  });

  // Smazání zprávy (Sa nebo odesílatel) — označ jako smazanou v cache dané
  // konverzace. Guard `old ? … : old` nevytvoří prázdný seznam pro nenačtené
  // konverzace (jinak by `(undefined ?? []).map()` cache přepsala na []).
  useSocketEvent<AdminMessageDeletedEvent>(
    'platform-chat:message:deleted',
    (e) => {
      qc.setQueryData<ChatMessage[]>(
        adminChatKeys.messages(e.channelId),
        (old) =>
          old
            ? old.map((m) =>
                m.id === e.messageId
                  ? { ...m, isDeleted: true, content: null }
                  : m,
              )
            : old,
      );
    },
  );

  // Změna zprávy (reakce / edit) — server pošle celou aktualizovanou zprávu,
  // nahradíme ji v cache (guard `old ? … : old` nevytvoří prázdný seznam).
  useSocketEvent<ChatMessage>('platform-chat:message:updated', (m) => {
    qc.setQueryData<ChatMessage[]>(adminChatKeys.messages(m.channelId), (old) =>
      old ? old.map((x) => (x.id === m.id ? m : x)) : old,
    );
  });

  // Typing indikátor — per-username timer s TTL (re-emit „píše" ho prodlouží,
  // `isTyping:false` / vypršení ho odebere). Vlastní psaní ignorujeme.
  const handleTyping = useCallback(
    (e: AdminTypingEvent) => {
      if (e.channelId !== channelId) return;
      if (currentUsername && e.username === currentUsername) return;
      const timers = typingTimers.current;
      const existing = timers.get(e.username);
      if (existing) clearTimeout(existing);
      if (e.isTyping) {
        timers.set(
          e.username,
          setTimeout(() => {
            timers.delete(e.username);
            setTypingNames(Array.from(timers.keys()));
          }, TYPING_TTL_MS),
        );
      } else {
        timers.delete(e.username);
      }
      setTypingNames(Array.from(timers.keys()));
    },
    [channelId, currentUsername],
  );
  useSocketEvent<AdminTypingEvent>('platform-chat:typing', handleTyping);

  // Přepnutí konverzace / unmount → zahoď běžící timery i seznam píšících.
  useEffect(() => {
    const timers = typingTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      setTypingNames([]);
    };
  }, [channelId]);

  return { typingNames };
}

// ── Správa konverzací (jen Superadmin — BE gate) ──────────────────────────

export function useCreateAdminChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      name: string;
      allMembers?: boolean;
      memberIds?: string[];
    }) => api.post<AdminChatChannel>(`${BASE}/channels`, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminChatKeys.channels }),
  });
}

export function useUpdateAdminChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      ...dto
    }: {
      channelId: string;
      name?: string;
      allMembers?: boolean;
      memberIds?: string[];
    }) => api.patch<AdminChatChannel>(`${BASE}/channels/${channelId}`, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminChatKeys.channels }),
  });
}

export function useDeleteAdminChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      api.delete(`${BASE}/channels/${channelId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminChatKeys.channels }),
  });
}
