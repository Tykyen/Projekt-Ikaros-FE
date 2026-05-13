import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, parseApiError, parseApiErrorCode } from '@/shared/api/client';
import type {
  AdminFriendshipByPairResponse,
  AdminFriendshipsListResponse,
  AdminFriendshipView,
} from '@/shared/types';

/**
 * D-056 — Hook pro admin lookup friendship páru.
 *
 * Enabled jen pokud máme obě user IDs (jinak by BE vracel null pro chybějící
 * search query).
 */
export function useAdminFriendshipByPair(
  userA: string | null,
  userB: string | null,
) {
  const enabled = !!userA && !!userB && userA !== userB;
  return useQuery({
    queryKey: ['admin', 'friendships', 'by-pair', userA, userB],
    queryFn: () =>
      api.get<AdminFriendshipByPairResponse>('/admin/friendships/by-pair', {
        userA: userA!,
        userB: userB!,
      }),
    enabled,
    staleTime: 15_000,
  });
}

/** D-056 — Seznam friendships konkrétního usera. */
export function useAdminFriendshipsByUser(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'friendships', 'by-user', userId],
    queryFn: () =>
      api.get<AdminFriendshipsListResponse>('/admin/friendships', {
        userId: userId!,
        page: 1,
        limit: 50,
      }),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

/** D-056 — Reset cooldown pro konkrétní friendship. */
export function useAdminResetCooldown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      api.post<{ friendship: AdminFriendshipView }>(
        `/admin/friendships/${friendshipId}/reset-cooldown`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'friendships'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit-log'] });
      toast.success('Cooldown resetován');
    },
    onError: (err) => {
      const code = parseApiErrorCode(err);
      if (code === 'NO_COOLDOWN') {
        toast.error('Tento friendship nemá aktivní cooldown.');
        return;
      }
      toast.error(parseApiError(err));
    },
  });
}
