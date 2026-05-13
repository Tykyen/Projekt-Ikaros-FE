import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { FriendshipStatusResponse } from '@/shared/types';

/** Spec 1.8 — driver pro tlačítko ve veřejném profilu (5 stavů + cooldown). */
export function useFriendshipStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['friendship-status', userId],
    queryFn: () =>
      api.get<FriendshipStatusResponse>(`/friends/status/${userId}`),
    enabled: !!userId,
    staleTime: 15_000,
  });
}
