import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';

/**
 * D-030 — push zařízení uživatele (bezpečný výřez bez kryptografických klíčů).
 * `createdAt`/`lastUsedAt` přicházejí z JSON jako ISO string.
 */
export interface PushDevice {
  id: string;
  endpoint: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
}

export const pushDeviceKeys = {
  all: ['push', 'subscriptions'] as const,
};

/** Seznam vlastních push zařízení. Enabled jen pro přihlášené. */
export function usePushSubscriptions(enabled = true) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: pushDeviceKeys.all,
    queryFn: () => api.get<PushDevice[]>('/push/subscriptions'),
    enabled: enabled && !!token,
    staleTime: 60_000,
  });
}

/** Odhlášení konkrétního (vzdáleného) zařízení dle id. */
export function useUnsubscribeDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/push/subscriptions/${id}`),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: pushDeviceKeys.all }),
  });
}
