import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldMembership } from '@/shared/types';

/**
 * 5.3c — členové světa. `GET /worlds/:id/members` vrací membershipy
 * s populovaným `user` summary (username, avatar účtu).
 */
export function useWorldMembers(worldId: string) {
  return useQuery({
    queryKey: ['worlds', worldId, 'members'],
    queryFn: () => api.get<WorldMembership[]>(`/worlds/${worldId}/members`),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}
