import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  useSocket,
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';
import type { ChatMessage } from '@/features/chat/lib/types';
import type { AdminChatChannel } from '../lib/types';

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

/** Odeslání zprávy. Zobrazí se přes WS echo + fallback z odpovědi mutace. */
export function useSendAdminMessage(channelId: string) {
  return useMutation({
    mutationFn: (content: string) =>
      api.post<ChatMessage>(`${BASE}/channels/${channelId}/messages`, {
        content,
      }),
  });
}

/**
 * Real-time příjem zpráv aktivní konverzace + join/leave room. Room
 * `platform-chat:{channelId}` (BE gate ověří admin roli + členství).
 */
export function useAdminChatRealtime(channelId: string | null) {
  const qc = useQueryClient();
  const socket = useSocket();

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
