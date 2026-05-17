import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldNewsItem, WorldNewsType } from '@/shared/types';

/**
 * 5.2 — oznámení světa. `GET /world-news?worldId=` vrací oznámení světa
 * **i** globální (BE union). Veřejný endpoint.
 */
export function useWorldNews(worldId: string, limit = 20) {
  return useQuery({
    queryKey: ['world-news', worldId],
    queryFn: () =>
      api.get<WorldNewsItem[]>(
        `/world-news?worldId=${worldId}&limit=${limit}`,
      ),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

/** Vstup pro tvorbu oznámení. `worldId: null` = globální. */
export interface CreateWorldNewsInput {
  worldId: string | null;
  title: string;
  content: string;
  date: string;
  type: WorldNewsType;
  link?: string;
}

/** Vstup pro editaci — `worldId` BE v body zakazuje, proto vyloučen. */
export type UpdateWorldNewsInput = Partial<
  Omit<CreateWorldNewsInput, 'worldId'>
>;

export function useCreateWorldNews(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorldNewsInput) =>
      api.post<WorldNewsItem>('/world-news', input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['world-news', worldId] }),
  });
}

export function useUpdateWorldNews(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateWorldNewsInput }) =>
      api.put<WorldNewsItem>(`/world-news/${id}`, patch),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['world-news', worldId] }),
  });
}

export function useDeleteWorldNews(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/world-news/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['world-news', worldId] }),
  });
}
