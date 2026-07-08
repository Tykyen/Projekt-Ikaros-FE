import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { SupporterListItem } from '@/shared/types';

/**
 * 19.4 — veřejná zeď podporovatelů (`GET /users/supporters`). BEZ auth
 * (marketing i pro anon), leak-safe odpověď (username/avatar/supporterSince).
 */
export function useSupporters() {
  return useQuery({
    queryKey: ['supporters'],
    queryFn: () => api.get<SupporterListItem[]>('/users/supporters'),
    staleTime: 60_000,
  });
}
