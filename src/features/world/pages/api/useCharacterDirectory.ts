import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  charactersQueryKey,
  type CharacterDirectoryEntry,
} from './characters.types';

/**
 * 8.2 — Adresář postav světa. BE: `GET /worlds/:worldId/characters/directory`.
 * Lehký seznam (bez bio a subdokumentů) pro grid adresáře i pro select postav
 * při přiřazení hráči.
 */
export function useCharacterDirectory(worldId: string) {
  return useQuery({
    queryKey: charactersQueryKey.directory(worldId),
    queryFn: () =>
      api.get<CharacterDirectoryEntry[]>(
        `/worlds/${worldId}/characters/directory`,
      ),
    enabled: !!worldId,
    staleTime: 30_000,
  });
}
