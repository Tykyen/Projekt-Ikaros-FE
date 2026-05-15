import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ArticleCategory } from '@/shared/types';

const KEY = ['article-categories'] as const;

/** 3.2a — public read (cache 5 min). */
export function useArticleCategories() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<ArticleCategory[]>('/article-categories'),
    staleTime: 5 * 60_000,
    placeholderData: [],
  });
}

interface CreateDto {
  key: string;
  label: string;
  color: string;
  order: number;
}

export function useCreateArticleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDto) =>
      api.post<ArticleCategory>('/article-categories', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

interface UpdateDto {
  label?: string;
  color?: string;
  order?: number;
}

export function useUpdateArticleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, dto }: { key: string; dto: UpdateDto }) =>
      api.patch<ArticleCategory>(`/article-categories/${key}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteArticleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => api.delete(`/article-categories/${key}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
