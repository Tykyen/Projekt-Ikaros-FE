import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useSocketEvent, useSocketReconnect } from '@/features/chat';
import type { IkarosNews, IkarosNewsScope, IkarosNewsType } from '@/shared/types';

/** Spec 3.1b — payload polí novinky sdílený create/update mutacemi. */
export interface NewsMutationDto {
  title?: string;
  content?: string;
  type?: IkarosNewsType;
  /** `null` = odebrat obrázek (jen update). */
  imageUrl?: string | null;
}

const NEWS_KEY = ['ikaros-news'] as const;

/**
 * Dashboard 2.1 — public GET /IkarosNews bez query params.
 * BE default `scope='active'`. Beze změny pro BC.
 */
export function useIkarosNews() {
  const qc = useQueryClient();
  // C-47 — BE broadcastuje ikaros:news:changed všem klientům (platform-wide).
  useSocketEvent('ikaros:news:changed', () => {
    void qc.invalidateQueries({ queryKey: NEWS_KEY });
  });
  // S-04 — broadcast vyslaný během výpadku je pryč (re-join nepomůže); po
  // reconnectu refetch, jinak novinky stale až do 5min staleTime.
  useSocketReconnect(() => {
    void qc.invalidateQueries({ queryKey: NEWS_KEY });
  });
  return useQuery({
    queryKey: NEWS_KEY,
    queryFn: () => api.get<IkarosNews[]>('/IkarosNews'),
    staleTime: 5 * 60_000,
    placeholderData: [],
  });
}

interface ListParams {
  scope: IkarosNewsScope;
  limit: number;
  offset: number;
}

/**
 * Spec 3.1 — paginovaný list pro admin page `/ikaros/novinky`. `scope` určuje
 * filter (active|archived|all). Pro archived/all vyžaduje JWT + Admin+ (BE check).
 */
export function useIkarosNewsList(params: ListParams) {
  return useQuery({
    queryKey: [...NEWS_KEY, 'list', params],
    queryFn: () =>
      // RAW params — api.get sám obaluje do {params}. Vnořené {params} by se
      // neodeslalo (scope/limit/offset by BE ignoroval).
      api.get<IkarosNews[]>('/IkarosNews', {
        scope: params.scope,
        limit: params.limit,
        offset: params.offset,
      }),
    placeholderData: [],
  });
}

/**
 * Spec 3.1 — count pro paginační meta + tab badges.
 * `enabled=false` (3.1b) — scope `archived` je Admin-only, pro běžné
 * uživatele dotaz nespouštět (jinak 403).
 */
export function useIkarosNewsCount(scope: IkarosNewsScope, enabled = true) {
  return useQuery({
    queryKey: [...NEWS_KEY, 'count', scope],
    queryFn: () =>
      api.get<{ total: number }>('/IkarosNews/count', { scope }),
    enabled,
  });
}

export function useCreateIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: NewsMutationDto & { title: string; content: string }) =>
      api.post<IkarosNews>('/IkarosNews', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });
}

/** Spec 3.1 — PATCH /:id partial update; 3.1b — i type/imageUrl. */
export function useUpdateIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: NewsMutationDto }) =>
      api.patch<IkarosNews>(`/IkarosNews/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });
}

/** Spec 3.1 — POST /:id/archive (idempotent). */
export function useArchiveIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<IkarosNews>(`/IkarosNews/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });
}

/** Spec 3.1 — POST /:id/unarchive (idempotent). */
export function useUnarchiveIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<IkarosNews>(`/IkarosNews/${id}/unarchive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });
}

/** Spec 3.1 — DELETE /:id (hard delete, nevratné). */
export function useDeleteIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/IkarosNews/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NEWS_KEY });
    },
  });
}
