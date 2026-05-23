import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { MyCharacterEntry } from '@/shared/types';

/**
 * 8.3 / D-075 — cross-world přehled „mých postav" pro sekci v `/ikaros/profil`.
 * BE: `GET /api/users/me/characters` — agregátor přes všechny memberships
 * uživatele, vrací entry jen pro `characterPath != null` + existující postavu.
 */
export function useMyCharactersGlobal() {
  const accessToken = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['users', 'me', 'characters'],
    queryFn: () => api.get<MyCharacterEntry[]>('/users/me/characters'),
    enabled: !!accessToken,
    staleTime: 60_000,
  });
}
