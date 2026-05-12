import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { PublicUserProfile } from '@/shared/types';

/**
 * Spec 1.4 — public profil (`GET /api/users/profile/:id`). Dostupný každému
 * přihlášenému. 404 pro tombstone/pending-deletion běžnému uživateli,
 * admin výjimka 200 + flag.
 */
export function usePublicUserProfile(id: string | undefined) {
  return useQuery({
    queryKey: ['public-user-profile', id],
    queryFn: () => api.get<PublicUserProfile>(`/users/profile/${id}`),
    enabled: !!id,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      // 404 nesmí být retry (uživatel neexistuje / tombstone)
      const status = (error as { status?: number } | undefined)?.status;
      if (status === 404 || status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
