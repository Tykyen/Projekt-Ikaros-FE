import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type {
  PublicUsersListResponse,
  PublicUsersQuery,
} from '@/shared/types';

/**
 * Spec 1.4 — public adresář (`GET /api/users`). Vyžaduje role Admin/Superadmin
 * (BE vrátí 403 jinak). FE volá tento hook v tabu Uživatelé (UsersPage).
 */
export function usePublicUsers(query: PublicUsersQuery, enabled = true) {
  const params: Record<string, unknown> = {
    page: query.page ?? 1,
    limit: query.limit ?? 24,
  };
  // N-RUN-01 (plný audit 2026-06-20) — BE GET /users čte ?q= (ne ?search=),
  // jinak hledání uživatelů v tabu Uživatelé nikdy nefiltruje.
  if (query.search) params.q = query.search;
  if (query.sort) params.sort = query.sort;
  if (query.includeDeleted) params.includeDeleted = '1';

  return useQuery({
    queryKey: ['public-users', params],
    queryFn: () => api.get<PublicUsersListResponse>('/users', params),
    enabled,
    staleTime: 30_000,
  });
}
