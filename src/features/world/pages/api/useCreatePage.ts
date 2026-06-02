import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { pagesQueryKey } from './usePage';
import type {
  AccessRequirement,
  AkjTab,
  GalleryImage,
  InstructionalVideo,
  MenuItem,
  Page,
  PageSection,
  PageTable,
  PageType,
} from './pages.types';

/**
 * 7.2 — DTO pro create. Zrcadlí BE `CreatePageDto`. Server doplní `id`, `worldId`,
 * `plainText` (extrakce TipTap), `createdAt`, `updatedAt`.
 */
export interface CreatePageInput {
  slug: string;
  type: PageType;
  title: string;
  content?: string;
  imageUrl?: string;
  bigImage?: boolean;
  sections?: PageSection[];
  galleryImages?: GalleryImage[];
  videos?: InstructionalVideo[];
  menu?: MenuItem[];
  isWoodWide?: boolean;
  accessRequirements?: AccessRequirement[];
  table?: PageTable;
  customData?: Record<string, string>;
  order?: number;
  // 9.1 — pro type ∈ {PostavaHrace, NPC}. BE persistuje jen pokud relevantní.
  ownerUserId?: string;
  /** AKJ chráněné záložky (spec-akj-protected-tabs). */
  akjTabs?: AkjTab[];
}

/**
 * 7.2 — `POST /worlds/:worldId/pages`. PomocnyPJ+ guard na BE.
 * Invaliduje directory a optimistic: vrátí Page → routovat na viewer.
 *
 * `worldSlug` se předává explicitně pro invalidaci `['worlds','slug',worldSlug]`
 * cache (favorite slugs se mění až později, ale konzistence cestou).
 */
export function useCreatePage(worldId: string, worldSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePageInput) =>
      api.post<Page>(`/worlds/${worldId}/pages`, input),
    onSuccess: (page) => {
      void qc.invalidateQueries({
        queryKey: pagesQueryKey.directory(worldId),
      });
      void qc.invalidateQueries({
        queryKey: ['worlds', 'slug', worldSlug],
      });
      // Pre-seed detail cache, viewer hned vidí data
      qc.setQueryData(pagesQueryKey.detail(worldId, page.slug), page);
    },
  });
}
