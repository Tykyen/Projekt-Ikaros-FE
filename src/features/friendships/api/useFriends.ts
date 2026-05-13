import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { FriendsListResponse } from '@/shared/types';

/** Spec 1.8 — seznam přijatých přátel current usera. */
export function useFriends(enabled = true) {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () =>
      api.get<FriendsListResponse>('/friends', { page: 1, limit: 100 }),
    enabled,
    staleTime: 30_000,
  });
}
