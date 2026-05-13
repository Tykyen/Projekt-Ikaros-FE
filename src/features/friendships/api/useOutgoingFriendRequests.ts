import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { FriendRequestsListResponse } from '@/shared/types';

/** Spec 1.8 — pending žádosti, které current user odeslal. */
export function useOutgoingFriendRequests(enabled = true) {
  return useQuery({
    queryKey: ['friends', 'outgoing'],
    queryFn: () =>
      api.get<FriendRequestsListResponse>('/friends/requests/outgoing', {
        page: 1,
        limit: 100,
      }),
    enabled,
    staleTime: 30_000,
  });
}
