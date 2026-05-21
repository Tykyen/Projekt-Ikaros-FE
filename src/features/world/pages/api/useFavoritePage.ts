import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { World } from '@/shared/types';

/**
 * 7.1d — Toggle favorite stránky světa. BE: POST / DELETE
 * `/worlds/:worldId/pages/:slug/favorite`. Cache updatuje `world.favoritePageSlugs`
 * v `['worlds', 'slug', worldSlug]` query (kterou plní `useWorld(worldSlug)` ve
 * [WorldLayout]) — optimistic update + rollback při chybě.
 *
 * Pozor: hooku předáváme `worldSlug` (ne worldId) — query key v useWorld používá
 * vždy slug, viz `useWorlds.ts:29-32`. Pro ObjectId varianty se favorite endpoint
 * zatím nepoužívá (route `/svet/:worldSlug/:slug` má jen slug).
 */
export function useFavoritePage(worldId: string, worldSlug: string) {
  const qc = useQueryClient();
  const worldQueryKey = ['worlds', 'slug', worldSlug] as const;

  return useMutation<
    void,
    Error,
    { slug: string; nextState: boolean },
    { previousWorld?: World }
  >({
    mutationFn: ({ slug, nextState }) => {
      const path = `/worlds/${worldId}/pages/${slug}/favorite`;
      return nextState
        ? api.post<void>(path)
        : api.delete<void>(path);
    },
    onMutate: async ({ slug, nextState }) => {
      await qc.cancelQueries({ queryKey: worldQueryKey });
      const previousWorld = qc.getQueryData<World>(worldQueryKey);
      if (previousWorld) {
        const currentSlugs = previousWorld.favoritePageSlugs ?? [];
        const nextSlugs = nextState
          ? Array.from(new Set([...currentSlugs, slug]))
          : currentSlugs.filter((s) => s !== slug);
        qc.setQueryData<World>(worldQueryKey, {
          ...previousWorld,
          favoritePageSlugs: nextSlugs,
        });
      }
      return { previousWorld };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousWorld) {
        qc.setQueryData(worldQueryKey, ctx.previousWorld);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: worldQueryKey });
    },
  });
}

/** Helper — vrací `true` pokud slug je v aktuálním seznamu oblíbených. */
export function isPageFavorite(
  favoriteSlugs: string[] | undefined,
  slug: string,
): boolean {
  return (favoriteSlugs ?? []).includes(slug);
}
