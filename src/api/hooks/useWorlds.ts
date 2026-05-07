import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '../client';
import { accessTokenAtom } from '../../store/authStore';
import type { World } from '../../types';

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
