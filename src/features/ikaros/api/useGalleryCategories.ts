import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { GalleryCategory } from '@/shared/types';

const KEY = ['gallery-categories'] as const;

/** 3.3a — public read (cache 5 min). */
export function useGalleryCategories() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<GalleryCategory[]>('/gallery-categories'),
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

export function useCreateGalleryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDto) =>
      api.post<GalleryCategory>('/gallery-categories', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

interface UpdateDto {
  label?: string;
  color?: string;
  order?: number;
}

export function useUpdateGalleryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, dto }: { key: string; dto: UpdateDto }) =>
      api.patch<GalleryCategory>(`/gallery-categories/${key}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGalleryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => api.delete(`/gallery-categories/${key}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
