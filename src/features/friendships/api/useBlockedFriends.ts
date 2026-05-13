import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { BlocksListResponse } from '@/shared/types';

/** Spec D-055 — seznam zablokovaných uživatelů (current user jako blokující). */
export function useBlockedFriends(enabled = true) {
  return useQuery({
    queryKey: ['friends', 'blocked'],
    queryFn: () =>
      api.get<BlocksListResponse>('/friends/blocks', { page: 1, limit: 100 }),
    enabled,
    staleTime: 30_000,
  });
}
