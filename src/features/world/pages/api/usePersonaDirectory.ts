import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { PageDirectoryEntry } from './pages.types';

/**
 * 9.1 — Adresář postav a NPC světa (filter na PageType ∈
 * {'Postava hráče', 'NPC'}). Slouží jako náhrada za legacy
 * `useCharacterDirectory` v CharactersPage po sjednocení Character→Page.
 *
 * BE: `GET /worlds/:worldId/pages/directory?type=Postava hráče,NPC`
 *
 * Entry obsahuje `imageUrl` a `ownerUserId` přímo z Page (BE rozšířil
 * directory query projection pro tento případ).
 */
export function usePersonaDirectory(worldId: string) {
  return useQuery({
    queryKey: ['pages', worldId, 'directory', 'persona'] as const,
    queryFn: () =>
      api.get<PageDirectoryEntry[]>(
        `/worlds/${worldId}/pages/directory?type=${encodeURIComponent('Postava hráče')},NPC`,
      ),
    enabled: !!worldId,
    staleTime: 60_000,
    placeholderData: [],
  });
}
