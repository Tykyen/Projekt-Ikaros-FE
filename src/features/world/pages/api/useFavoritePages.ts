import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { useMyProfile } from '@/features/auth/api/useAuth';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User } from '@/shared/types';

/**
 * 5.2-followup — osobní oblíbené STRÁNKY per (user × world).
 *
 * **Persistence:** BE `User.favoritePageSlugs: Record<worldId, slug[]>` (sdílené
 * napříč zařízeními), **pořadí významné** (reorder). Čte z `useMyProfile()` cache,
 * mutuje přes `PUT /users/me/favorite-pages/:worldId` (replace-all) s optimistic
 * update. Nahrazuje zrušený sdílený `world.favoritePageSlugs` (PJ kurátorství).
 *
 * Toggle i reorder jdou stejnou cestou (FE pošle celé upravené/přeskládané pole).
 * Cap: 100 položek per svět (zdvojení s BE validací).
 */
export const MAX_FAVORITE_PAGES = 100;

export interface UseFavoritePagesResult {
  /** Oblíbené slugy v uživatelově pořadí. */
  order: string[];
  isFavorite: (slug: string) => boolean;
  /** Přidá slug (na konec) / odebere. */
  toggle: (slug: string) => void;
  /** Uloží nové pořadí (po drag&drop). */
  reorder: (next: string[]) => void;
}

export function useFavoritePages(worldId: string): UseFavoritePagesResult {
  const currentUser = useAtomValue(currentUserAtom);
  const userId = currentUser?.id ?? '';
  const enabled = !!worldId && !!userId;
  const qc = useQueryClient();
  const { data: profile } = useMyProfile();

  const order = useMemo<string[]>(() => {
    if (!enabled) return [];
    return profile?.favoritePageSlugs?.[worldId] ?? [];
  }, [enabled, profile, worldId]);

  const favSet = useMemo(() => new Set(order), [order]);

  // Replace-all mutace — optimistic na ['users','me'] (vzor useFavoriteCharacters).
  const setMut = useMutation({
    mutationFn: (slugs: string[]) =>
      api.put<{ favoritePageSlugs: Record<string, string[]> }>(
        `/users/me/favorite-pages/${worldId}`,
        { slugs },
      ),
    onMutate: async (slugs) => {
      await qc.cancelQueries({ queryKey: ['users', 'me'] });
      const prev = qc.getQueryData<User>(['users', 'me']);
      if (prev) {
        const nextMap = { ...(prev.favoritePageSlugs ?? {}) };
        if (slugs.length === 0) delete nextMap[worldId];
        else nextMap[worldId] = slugs;
        qc.setQueryData<User>(['users', 'me'], {
          ...prev,
          favoritePageSlugs: nextMap,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['users', 'me'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });

  const toggle = (slug: string) => {
    if (!enabled) return;
    const next = favSet.has(slug)
      ? order.filter((s) => s !== slug)
      : [...order, slug].slice(0, MAX_FAVORITE_PAGES);
    setMut.mutate(next);
  };

  const reorder = (next: string[]) => {
    if (!enabled) return;
    setMut.mutate(next.slice(0, MAX_FAVORITE_PAGES));
  };

  const isFavorite = (slug: string) => favSet.has(slug);

  return { order, isFavorite, toggle, reorder };
}
