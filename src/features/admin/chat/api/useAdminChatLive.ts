import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { useSocketEvent } from '@/features/chat';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { adminChatUnseenAtom } from '../model/adminChatStore';

/**
 * 20.5 — globální live badge admin chatu. Volat **jednou** v root layoutu
 * (běží i mimo /admin/chat). Na WS `platform-chat:activity` (BE signál posílá
 * jen příjemcům mimo odesílatele) tiká badge, když právě nejsem na /admin/chat;
 * při vstupu na /admin/chat se badge vynuluje. Efemérní — po reloadu se resetuje.
 */
export function useAdminChatLive(): void {
  const currentUser = useAtomValue(currentUserAtom);
  const isAdmin =
    currentUser?.role === UserRole.Superadmin ||
    currentUser?.role === UserRole.Admin;
  const onAdminChat = useLocation().pathname.startsWith('/admin/chat');
  const setUnseen = useSetAtom(adminChatUnseenAtom);

  useSocketEvent('platform-chat:activity', () => {
    if (isAdmin && !onAdminChat) setUnseen((n) => n + 1);
  });

  useEffect(() => {
    if (onAdminChat) setUnseen(0);
  }, [onAdminChat, setUnseen]);
}
