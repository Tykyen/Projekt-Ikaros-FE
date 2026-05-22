import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  charactersQueryKey,
  type CharacterDiary,
  type CharacterCalendar,
  type CharacterFinance,
  type CharacterInventory,
  type CharacterNotes,
} from './characters.types';

/**
 * 8.1 — GET hooky pro 5 subdokumentů postavy. Každý subdoc má vlastní
 * endpoint `/worlds/:worldId/characters/:slug/{kind}`.
 *
 * `finance`, `inventory` mohou mít `isHidden=true`; `notes`/`privateBio`
 * jsou citlivé — BE vrací data jen oprávněným (PJ/vlastník).
 */
function subdocOptions(worldId: string, slug: string) {
  return {
    enabled: !!worldId && !!slug,
    staleTime: 30_000,
  };
}

export function useCharacterDiary(worldId: string, slug: string) {
  return useQuery({
    queryKey: charactersQueryKey.subdoc(worldId, slug, 'diary'),
    queryFn: () =>
      api.get<CharacterDiary>(
        `/worlds/${worldId}/characters/${slug}/diary`,
      ),
    ...subdocOptions(worldId, slug),
  });
}

export function useCharacterCalendar(worldId: string, slug: string) {
  return useQuery({
    queryKey: charactersQueryKey.subdoc(worldId, slug, 'calendar'),
    queryFn: () =>
      api.get<CharacterCalendar>(
        `/worlds/${worldId}/characters/${slug}/calendar`,
      ),
    ...subdocOptions(worldId, slug),
  });
}

export function useCharacterFinance(worldId: string, slug: string) {
  return useQuery({
    queryKey: charactersQueryKey.subdoc(worldId, slug, 'finance'),
    queryFn: () =>
      api.get<CharacterFinance>(
        `/worlds/${worldId}/characters/${slug}/finance`,
      ),
    ...subdocOptions(worldId, slug),
  });
}

export function useCharacterInventory(worldId: string, slug: string) {
  return useQuery({
    queryKey: charactersQueryKey.subdoc(worldId, slug, 'inventory'),
    queryFn: () =>
      api.get<CharacterInventory>(
        `/worlds/${worldId}/characters/${slug}/inventory`,
      ),
    ...subdocOptions(worldId, slug),
  });
}

export function useCharacterNotes(worldId: string, slug: string) {
  return useQuery({
    queryKey: charactersQueryKey.subdoc(worldId, slug, 'notes'),
    queryFn: () =>
      api.get<CharacterNotes>(
        `/worlds/${worldId}/characters/${slug}/notes`,
      ),
    ...subdocOptions(worldId, slug),
  });
}
