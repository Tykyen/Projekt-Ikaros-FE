import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { api } from '@/shared/api/client';
import { useMyProfile } from '@/features/auth/api/useAuth';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User } from '@/shared/types';

/**
 * 8.3 / D-074 — oblíbené postavy per (user × world).
 *
 * **Persistence:** BE field `User.favoriteCharacters: Record<worldId, slug[]>`
 * (sdílené napříč zařízeními). Hook čte z `useMyProfile()` cache, mutuje přes
 * `PUT /users/me/favorite-characters/:worldId` s optimistic update.
 *
 * **Migrace z localStorage:** Při prvním načtení v session, pokud BE nemá pro
 * tento svět žádné oblíbené a localStorage má, jednorázově je pushne do BE
 * a vymaže lokální klíč. Po migraci se localStorage už nečte.
 *
 * **Cap:** 200 položek per svět (BE validace).
 */
const MAX_FAVORITES = 200;

function legacyStorageKey(worldId: string, userId: string): string {
  return `ikaros.world.${worldId}.favCharacters.${userId}`;
}

function readLegacyFavorites(worldId: string, userId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(legacyStorageKey(worldId, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    return [];
  }
}

function clearLegacyFavorites(worldId: string, userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(legacyStorageKey(worldId, userId));
  } catch {
    // no-op
  }
}

export interface UseFavoriteCharactersResult {
  favorites: Set<string>;
  toggle: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
}

export function useFavoriteCharacters(worldId: string): UseFavoriteCharactersResult {
  const currentUser = useAtomValue(currentUserAtom);
  const userId = currentUser?.id ?? '';
  const enabled = !!worldId && !!userId;
  const qc = useQueryClient();
  const { data: profile } = useMyProfile();

  const serverSlugs = useMemo<string[]>(() => {
    if (!enabled) return [];
    return profile?.favoriteCharacters?.[worldId] ?? [];
  }, [enabled, profile, worldId]);

  const favorites = useMemo(() => new Set(serverSlugs), [serverSlugs]);

  // Mutation — replace-all sémantika.
  const setMut = useMutation({
    mutationFn: (slugs: string[]) =>
      api.put<{ favoriteCharacters: Record<string, string[]> }>(
        `/users/me/favorite-characters/${worldId}`,
        { slugs },
      ),
    onMutate: async (slugs) => {
      await qc.cancelQueries({ queryKey: ['users', 'me'] });
      const prev = qc.getQueryData<User>(['users', 'me']);
      if (prev) {
        const nextMap = { ...(prev.favoriteCharacters ?? {}) };
        if (slugs.length === 0) delete nextMap[worldId];
        else nextMap[worldId] = slugs;
        qc.setQueryData<User>(['users', 'me'], {
          ...prev,
          favoriteCharacters: nextMap,
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
    const has = favorites.has(slug);
    const next = has
      ? Array.from(favorites).filter((s) => s !== slug)
      : [...Array.from(favorites), slug].slice(0, MAX_FAVORITES);
    setMut.mutate(next);
  };

  const isFavorite = (slug: string) => favorites.has(slug);

  // ── Jednorázová migrace z localStorage ────────────────────────────
  const migratedRef = useRef(false);
  useEffect(() => {
    if (!enabled || migratedRef.current) return;
    // Migraci spustíme až když máme jistotu o serverovém stavu (profile fetched).
    if (!profile) return;
    const legacy = readLegacyFavorites(worldId, userId);
    if (legacy.length === 0 || serverSlugs.length > 0) {
      // Nic k migraci nebo BE už něco má → jen vymaž legacy klíč (cleanup).
      if (legacy.length > 0) clearLegacyFavorites(worldId, userId);
      migratedRef.current = true;
      return;
    }
    migratedRef.current = true;
    setMut.mutate(legacy.slice(0, MAX_FAVORITES));
    clearLegacyFavorites(worldId, userId);
    // setMut záměrně mimo deps — mutate je stabilní, useEffect se nemá restartovat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, profile, worldId, userId, serverSlugs.length]);

  return { favorites, toggle, isFavorite };
}
