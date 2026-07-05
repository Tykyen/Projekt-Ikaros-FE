import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import {
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { useAdminChatUnread, adminChatKeys } from './useAdminChat';

/**
 * 20.5b — root-level: drží unread badge admin chatu živý i **persistentní**.
 * Volat **jednou** v root layoutu (běží i mimo /admin/chat).
 *
 * BE seed (`GET /admin-chat/unread`) → badge přežije reload i offline zprávy.
 * WS `platform-chat:activity` (BE posílá jen příjemcům mimo odesílatele) →
 * invalidace = refetch (admin chat má nízkou frekvenci, optimistic reducer
 * netřeba). Reset per konverzace řeší mark-read v `AdminChatPage`, ne tady.
 */
export function useAdminChatLive(): void {
  const qc = useQueryClient();
  const currentUser = useAtomValue(currentUserAtom);
  const isAdmin =
    currentUser?.role === UserRole.Superadmin ||
    currentUser?.role === UserRole.Admin;

  // Seed + drží query naživu (enabled jen pro adminy; ne-admin dostane 403).
  useAdminChatUnread(isAdmin);

  const refetch = useCallback(() => {
    if (isAdmin) void qc.invalidateQueries({ queryKey: adminChatKeys.unread });
  }, [qc, isAdmin]);

  useSocketEvent('platform-chat:activity', refetch);
  useSocketReconnect(refetch);
}
