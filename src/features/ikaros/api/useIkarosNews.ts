import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { IkarosNews } from '@/shared/types';

export function useIkarosNews() {
  return useQuery({
    queryKey: ['ikaros-news'],
    queryFn: () => api.get<IkarosNews[]>('/IkarosNews'),
    staleTime: 5 * 60_000,
    placeholderData: [],
  });
}

export function useCreateIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string; content: string }) =>
      api.post<IkarosNews>('/IkarosNews', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ikaros-news'] });
    },
  });
}
