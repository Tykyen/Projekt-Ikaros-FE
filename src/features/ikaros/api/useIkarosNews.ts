import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { IkarosNews } from '@/shared/types';

export function useIkarosNews() {
  return useQuery({
    queryKey: ['ikaros-news'],
    queryFn: () => api.get<IkarosNews[]>('/IkarosNews'),
    staleTime: 5 * 60_000,
  });
}
