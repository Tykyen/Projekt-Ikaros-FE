import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { IkarosArticle, ArticleStats } from '@/shared/types';

const PREFIX = '/ikaros-articles';
export const ARTICLES_KEY = ['articles'] as const;

// ─── READ ────────────────────────────────────────────────────────────────

/** 3.2c — všechny Published (+ Pending pro admina; anon OK). */
export function useArticles() {
  return useQuery({
    queryKey: [...ARTICLES_KEY, 'all'],
    queryFn: () => api.get<IkarosArticle[]>(PREFIX),
    staleTime: 30_000,
  });
}

/** 3.2c — vlastní články přihlášeného (Draft/Pending/Published/Rejected). */
export function useMyArticles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...ARTICLES_KEY, 'my'],
    queryFn: () => api.get<IkarosArticle[]>(`${PREFIX}/my`),
    enabled: options.enabled !== false,
  });
}

/** 3.2c — detail článku (anon Published OK, auth Draft/Pending pro vlastníka/admina). */
export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: [...ARTICLES_KEY, 'detail', id],
    queryFn: () => api.get<IkarosArticle>(`${PREFIX}/${id}`),
    enabled: !!id,
  });
}

/** 3.2c — autor stats (6 metrik, mini widget v tabu Moje). */
export function useArticleStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...ARTICLES_KEY, 'stats'],
    queryFn: () => api.get<ArticleStats>(`${PREFIX}/stats`),
    enabled: options.enabled !== false,
  });
}

// ─── WRITE ───────────────────────────────────────────────────────────────

interface CreateDto {
  title: string;
  content: string;
  category?: string;
  /** True → status Pending; jinak Draft. */
  submit?: boolean;
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDto) => api.post<IkarosArticle>(PREFIX, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ARTICLES_KEY }),
  });
}

interface UpdateDto {
  title?: string;
  content?: string;
  category?: string;
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDto }) =>
      api.put<IkarosArticle>(`${PREFIX}/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ARTICLES_KEY }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${PREFIX}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ARTICLES_KEY }),
  });
}

// ─── WORKFLOW ────────────────────────────────────────────────────────────

export function useSubmitArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<IkarosArticle>(`${PREFIX}/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ARTICLES_KEY }),
  });
}

export function useApproveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<IkarosArticle>(`${PREFIX}/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ARTICLES_KEY });
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useRejectArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<IkarosArticle>(`${PREFIX}/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ARTICLES_KEY });
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useRateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stars }: { id: string; stars: number }) =>
      api.post<{ averageRating: number; totalRatings: number }>(
        `${PREFIX}/${id}/rate`,
        { stars },
      ),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: [...ARTICLES_KEY, 'detail', id] }),
  });
}

// ─── 3.2e — Read tracking (mark-as-read) ────────────────────────────────

/** Status zda uživatel článek dočetl. Volá `GET /:id/read-status`. */
export function useArticleReadStatus(
  articleId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled !== false && !!articleId;
  return useQuery({
    queryKey: ['article-reads', 'status', articleId],
    queryFn: () =>
      api.get<{ read: boolean }>(`${PREFIX}/${articleId}/read-status`),
    enabled,
    staleTime: 60_000,
  });
}

/** Počet nepřečtených Published článků (badge v pravém panelu). */
export function useUnreadCount(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['article-reads', 'unread-count'],
    queryFn: () => api.get<{ count: number }>(`${PREFIX}/unread-count`),
    enabled: options.enabled !== false,
    staleTime: 30_000,
  });
}

/** Označit článek jako přečtený (idempotent). */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`${PREFIX}/${id}/mark-read`),
    onSuccess: (_, id) => {
      qc.setQueryData(['article-reads', 'status', id], { read: true });
      qc.invalidateQueries({ queryKey: ['article-reads', 'unread-count'] });
    },
  });
}
