import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api, apiClient } from '@/shared/api/client';
import { currentUserAtom } from '@/shared/store/authStore';
import { socketGenerationAtom } from '@/features/chat/store/socketStore';
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
  unread: ['admin-chat', 'unread'] as const,
};

/** Nepřečtené per konverzace (BE `GET /admin-chat/unread`). */
export interface AdminChatUnread {
  channelId: string;
  count: number;
}

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
 * 20.5b — nepřečtené per konverzace (BE seed, přežije reload). Enabled jen
 * pro adminy (ne-admin by dostal 403). Živý tik + reset řeší
 * `useAdminChatUnreadTotal` / mark-read mutace, které tuto cache invalidují.
 */
export function useAdminChatUnread(enabled = true) {
  return useQuery({
    queryKey: adminChatKeys.unread,
    queryFn: () => api.get<AdminChatUnread[]>(`${BASE}/unread`),
    enabled,
  });
}

/**
 * 20.5b — celkový počet nepřečtených pro badge „Chat správy" (součet přes
 * konverzace). Jen čte cache (seedovanou/živě drženou `useAdminChatLive` v root
 * layoutu) — žádný vlastní WS listener, ať badge nezávisí na (na)mountování
 * sidebaru. Dedupe query se sdílí se seedem.
 */
export function useAdminChatUnreadTotal(isAdmin: boolean): number {
  const { data } = useAdminChatUnread(isAdmin);
  return (data ?? []).reduce((sum, u) => sum + u.count, 0);
}

/** 20.5b — označit konverzaci přečtenou (BE `POST .../read`), pak refetch unread. */
export function useMarkAdminChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      api.post(`${BASE}/channels/${channelId}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminChatKeys.unread }),
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

  // D-AUDIT-2026-07-11 — `socketGenerationAtom` v deps: po swapu instance
  // (reconnectSocket / re-auth) se effect re-bindne na živý socket; bez toho
  // by `leave` při unmountu mířil na mrtvou instanci a živý socket by zůstal
  // v platform-chat roomu (stejný vzor jako useWorldSocket/useMapSocket).
  const socketGeneration = useAtomValue(socketGenerationAtom);
  useEffect(() => {
    if (!channelId) return;
    socket.emit('platform-chat:join', { channelId });
    return () => {
      socket.emit('platform-chat:leave', { channelId });
    };
  }, [socket, channelId, socketGeneration]);

  // Po reconnectu Socket.IO zahodí rooms → re-join.
  // FIX-4 — re-join sám nedoplní zprávy zmeškané BĚHEM výpadku (žádný replay
  // po WS reconnectu) → invaliduj historii dané konverzace (vzor `ChatRoom` C-05).
  useSocketReconnect(() => {
    if (!channelId) return;
    socket.emit('platform-chat:join', { channelId });
    void qc.invalidateQueries({ queryKey: adminChatKeys.messages(channelId) });
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
