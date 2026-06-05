import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '@/shared/api/client';
import type {
  IkarosGalleryItem,
  GalleryStats,
  ToggleFavoriteResponse,
  TogglePinResponse,
} from '@/shared/types';

const PREFIX = '/ikaros-gallery';
export const GALLERY_KEY = ['gallery'] as const;

// ─── READ ────────────────────────────────────────────────────────────────

/** 3.3c — všechny Published (+ Pending pro admina; anon OK). */
export function useGalleryImages() {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'all'],
    queryFn: () => api.get<IkarosGalleryItem[]>(PREFIX),
    staleTime: 30_000,
  });
}

/** 3.3c — vlastní obrázky přihlášeného (všechny statusy). */
export function useMyGalleryImages(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'my'],
    queryFn: () => api.get<IkarosGalleryItem[]>(`${PREFIX}/my`),
    enabled: options.enabled !== false,
  });
}

/** 3.3d — detail obrázku (anon Published OK, auth vlastník/admin i ostatní). */
export function useGalleryImage(id: string | undefined) {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'detail', id],
    queryFn: () => api.get<IkarosGalleryItem>(`${PREFIX}/${id}`),
    enabled: !!id,
  });
}

/** 3.3c — statistiky autora (mini widget v tabu Moje). */
export function useGalleryStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'stats'],
    queryFn: () => api.get<GalleryStats>(`${PREFIX}/stats`),
    enabled: options.enabled !== false,
  });
}

// ─── WRITE ───────────────────────────────────────────────────────────────

export interface CreateGalleryDto {
  file: File;
  title: string;
  description?: string;
  category?: string;
  /** True → status Pending; jinak Draft. */
  submit?: boolean;
}

/** 3.3c — inline multipart upload (soubor + metadata v jednom requestu). */
export function useCreateGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateGalleryDto): Promise<IkarosGalleryItem> => {
      const form = new FormData();
      form.append('file', dto.file);
      form.append('title', dto.title);
      if (dto.description) form.append('description', dto.description);
      if (dto.category) form.append('category', dto.category);
      form.append('submit', String(dto.submit ?? false));
      const res = await apiClient.post<IkarosGalleryItem>(PREFIX, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GALLERY_KEY }),
  });
}

interface UpdateGalleryDto {
  title?: string;
  description?: string;
  category?: string;
}

export function useUpdateGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGalleryDto }) =>
      api.put<IkarosGalleryItem>(`${PREFIX}/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: GALLERY_KEY }),
  });
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${PREFIX}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: GALLERY_KEY }),
  });
}

// ─── WORKFLOW ────────────────────────────────────────────────────────────

export function useSubmitGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<IkarosGalleryItem>(`${PREFIX}/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: GALLERY_KEY }),
  });
}

export function useApproveGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<IkarosGalleryItem>(`${PREFIX}/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GALLERY_KEY });
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useRejectGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<IkarosGalleryItem>(`${PREFIX}/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GALLERY_KEY });
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  });
}

export function useRateGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      stars,
      text,
    }: {
      id: string;
      stars: number;
      text?: string;
    }) =>
      api.post<{ averageRating: number; totalRatings: number }>(
        `${PREFIX}/${id}/rate`,
        { stars, text },
      ),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [...GALLERY_KEY, 'detail', id] });
      // C-39 — průměr hvězdiček je i na kartách v Galerii přehledu.
      qc.invalidateQueries({ queryKey: GALLERY_KEY });
    },
  });
}

// ─── 3.7 — Oblíbené (záložky) + připnutí ─────────────────────────────────

/** Oblíbené obrázky přihlášeného (sidebar + stránka /ikaros/oblibene). */
export function useMyFavoriteGallery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...GALLERY_KEY, 'favorites'],
    queryFn: () => api.get<IkarosGalleryItem[]>(`${PREFIX}/my-favorites`),
    enabled: options.enabled !== false,
    staleTime: 20_000,
  });
}

/** Invaliduje seznam oblíbených i `users/me` (pinned ids jsou na User). */
function invalidateFavorites(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [...GALLERY_KEY, 'favorites'] });
  qc.invalidateQueries({ queryKey: ['users', 'me'] });
}

export function useToggleFavoriteGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ToggleFavoriteResponse>(`${PREFIX}/${id}/toggle-favorite`),
    onSuccess: () => invalidateFavorites(qc),
  });
}

export function useTogglePinGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<TogglePinResponse>(`${PREFIX}/${id}/toggle-pin`),
    onSuccess: () => invalidateFavorites(qc),
  });
}
