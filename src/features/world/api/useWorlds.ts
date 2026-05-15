import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { MyWorldEntry, World } from '@/shared/types';

export function useMyWorlds() {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['worlds', 'my'],
    queryFn: () => api.get<MyWorldEntry[]>('/worlds/my'),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

/** Mongo ObjectId má pevný tvar 24 hex znaků — odlišení od slugu. */
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Načte svět podle klíče z URL. `worldKey` je buď slug (`matrix` —
 * `/svet/matrix`), nebo ObjectId (zpětná kompatibilita se starými odkazy).
 * Tvar rozhodne, jestli se volá `GET /worlds/:id` nebo `/worlds/slug/:slug`.
 */
export function useWorld(worldKey: string) {
  const isObjectId = OBJECT_ID_RE.test(worldKey);
  return useQuery({
    queryKey: ['worlds', isObjectId ? 'id' : 'slug', worldKey],
    queryFn: () =>
      api.get<World>(
        isObjectId ? `/worlds/${worldKey}` : `/worlds/slug/${worldKey}`,
      ),
    enabled: !!worldKey,
    staleTime: 5 * 60_000,
  });
}

/**
 * Veřejný přehled světů — pro logged-out sidebar. BE `GET /api/worlds`
 * je veřejný (bez auth guardu). Pokud BE filtruje vlastní viditelnost
 * podle accessMode, dostaneme jen public + open světy automaticky.
 */
export function usePublicWorlds() {
  return useQuery({
    queryKey: ['worlds', 'public'],
    queryFn: () => api.get<World[]>('/worlds'),
    staleTime: 5 * 60_000,
  });
}
