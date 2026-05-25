import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { WorldNewsItem, WorldNewsScope, WorldNewsType } from '@/shared/types';

/**
 * 5.2 — oznámení světa. `GET /world-news?worldId=` vrací oznámení světa
 * **i** globální (BE union). Veřejný endpoint. Použito v dashboard sloupci.
 */
export function useWorldNews(worldId: string, limit = 20) {
  return useQuery({
    queryKey: ['world-news', worldId],
    queryFn: () =>
      api.get<WorldNewsItem[]>('/world-news', {
        params: { worldId, limit },
      }),
    enabled: !!worldId,
    staleTime: 60_000,
  });
}

interface WorldNewsListParams {
  worldId: string;
  scope: WorldNewsScope;
  limit: number;
  offset: number;
}

/**
 * 5.5d — paginovaný list pro stránku `/svet/:worldSlug/novinky`. `scope`
 * archived/all vyžaduje PomocnyPJ+ světa / Admin (BE check).
 */
export function useWorldNewsList(params: WorldNewsListParams) {
  return useQuery({
    queryKey: ['world-news', params.worldId, 'list', params],
    queryFn: () =>
      api.get<WorldNewsItem[]>('/world-news', {
        params: {
          worldId: params.worldId,
          scope: params.scope,
          limit: params.limit,
          offset: params.offset,
        },
      }),
    enabled: !!params.worldId,
    placeholderData: [],
  });
}

/**
 * 5.5d — count pro paginační meta + tab badges. `enabled=false` pro
 * archived/all u neoprávněných (jinak 403).
 */
export function useWorldNewsCount(
  worldId: string,
  scope: WorldNewsScope,
  enabled = true,
) {
  return useQuery({
    queryKey: ['world-news', worldId, 'count', scope],
    queryFn: () =>
      api.get<{ total: number }>('/world-news/count', {
        params: { worldId, scope },
      }),
    enabled: enabled && !!worldId,
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
  /** 9.5 — interní link na wiki stránku světa (priorita před `link`). */
  linkPageSlug?: string;
  /** 9.5 — hero obrázek + focal point (parita s GameEvent). */
  imageUrl?: string;
  imageFocalX?: number;
  imageFocalY?: number;
  imageZoom?: number;
  imageFit?: 'cover' | 'contain';
  /** 9.2e — fantasy datum (slug + structured object). */
  calendarConfigId?: string;
  calendarDate?: {
    year: number;
    monthIndex: number;
    day: number;
    hour?: number;
    minute?: number;
  };
}

/**
 * Vstup pro editaci — `worldId` BE v body zakazuje, proto vyloučen.
 * 9.5 — nullable fields pro explicit clear (`imageUrl: null` smaže obrázek).
 */
export interface UpdateWorldNewsInput {
  title?: string;
  content?: string;
  date?: string;
  type?: WorldNewsType;
  link?: string | null;
  linkPageSlug?: string | null;
  imageUrl?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: 'cover' | 'contain' | null;
  /** 9.2e — fantasy datum, null = reset na real-world display. */
  calendarConfigId?: string | null;
  calendarDate?: {
    year: number;
    monthIndex: number;
    day: number;
    hour?: number;
    minute?: number;
  } | null;
}

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

/** 5.5b — POST /world-news/:id/archive (idempotentní). */
export function useArchiveWorldNews(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<WorldNewsItem>(`/world-news/${id}/archive`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['world-news', worldId] }),
  });
}

/** 5.5b — POST /world-news/:id/unarchive (idempotentní). */
export function useUnarchiveWorldNews(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<WorldNewsItem>(`/world-news/${id}/unarchive`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['world-news', worldId] }),
  });
}
