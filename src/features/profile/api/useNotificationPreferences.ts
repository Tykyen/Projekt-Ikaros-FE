import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { currentUserAtom } from '@/shared/store/authStore';
import type { NotificationPreferences, User } from '@/shared/types';

/**
 * 15.9 — delta merge notifikačních preferencí (PATCH /users/me/notification-preferences).
 * Po úspěchu zapíše updated User do query cache i atomu (bez toastu — toggle
 * je tichý, ať uživatele nespamujeme; chyba se hlásí).
 */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<NotificationPreferences>) =>
      api.patch<User>('/users/me/notification-preferences', dto),
    onSuccess: (data) => {
      qc.setQueryData(['users', 'me'], data);
      getDefaultStore().set(currentUserAtom, data);
    },
    onError: (err) => toast.error(`Uložení selhalo: ${parseApiError(err)}`),
  });
}
