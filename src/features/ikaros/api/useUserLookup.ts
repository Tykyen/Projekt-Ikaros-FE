import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface UserLookupItem {
  id: string;
  username: string;
}

/**
 * Spec 3.4 — lookup uživatelů pro pickery (pozvánky / správci diskuze).
 * BE `GET /users/lookup?q=` — dostupné každému přihlášenému, min. 2 znaky.
 */
export function useUserLookup(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: ['user-lookup', query],
    queryFn: () => api.get<UserLookupItem[]>('/users/lookup', { q: query }),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
