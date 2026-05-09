import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '../../store/authStore';
import type { World } from '@/shared/types';

export function useMyWorlds() {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['worlds', 'my'],
    queryFn: () => api.get<World[]>('/worlds/my'),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useWorld(worldId: string) {
  return useQuery({
    queryKey: ['worlds', worldId],
    queryFn: () => api.get<World>(`/worlds/${worldId}`),
    enabled: !!worldId,
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
