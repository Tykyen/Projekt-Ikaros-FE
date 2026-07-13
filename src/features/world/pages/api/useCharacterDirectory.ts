import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  charactersQueryKey,
  type CharacterDirectoryEntry,
} from './characters.types';
import { PAGE_TYPES, type PageDirectoryEntry } from './pages.types';

/**
 * D-DATA-SYNC-ZBYTKY a — adapter Pages directory → legacy
 * `CharacterDirectoryEntry` shape. ⚠️ Past `directory_id`: `p.id` je PAGE ID,
 * konzumenti (finance selecty v `SettingsAccountSection`, resolve
 * `ownerCharacterIds`) potřebují CHARACTER ID → mapujeme `p.characterId`
 * (BE ho čte z `Page.characterRef`). Fallback na page ID jen pro stale BE
 * odpověď bez pole (nemá nastat po společném deployi; drží aspoň React keys).
 */
export function pageEntryToCharacterDirectoryEntry(
  p: PageDirectoryEntry,
): CharacterDirectoryEntry {
  return {
    id: p.characterId ?? p.id,
    slug: p.slug,
    name: p.title,
    isNpc: p.type === PAGE_TYPES.NPC,
    kind: p.type === PAGE_TYPES.Lokace ? 'location' : 'persona',
    imageUrl: p.imageUrl,
    imageFocalX: p.imageFocalX,
    imageFocalY: p.imageFocalY,
    imageZoom: p.imageZoom,
    imageFit: p.imageFit,
    // Legacy BE `userId` NEvracel (mrtvá sekce „Tvé postavy" v MapEmptyState);
    // Pages `ownerUserId` ji oživuje.
    userId: p.ownerUserId,
  };
}

/**
 * Parita s legacy `/characters/directory`: PC + NPC + Lokace (Lokace má taky
 * Character s kind='location' — např. „Vedeno u" v nastavení účtu ji nabízí).
 */
const DIRECTORY_TYPES_PARAM = [
  PAGE_TYPES.PostavaHrace,
  PAGE_TYPES.NPC,
  PAGE_TYPES.Lokace,
]
  .map(encodeURIComponent)
  .join(',');

/**
 * 8.2 → D-DATA-SYNC-ZBYTKY a — Adresář postav světa, nyní nad Pages directory
 * (`GET /worlds/:worldId/pages/directory?type=Postava hráče,NPC,Lokace`).
 * Legacy BE `GET /worlds/:worldId/characters/directory` už FE nevolá — smaže
 * se v BE kroku po ověření na živém webu (interní `chat.service` enrich na
 * service metodě zůstává tak jako tak).
 *
 * Výstupní tvar zůstává `CharacterDirectoryEntry` (adapter výše) a queryKey
 * zůstává `charactersQueryKey.directory` — na něj míří existující invalidace
 * (useCreatePage/useUpdatePage/useDeletePage C-15, useCharacterMutations,
 * broad `['characters', worldId]` z accounts/shop/diary-schema).
 *
 * Bez `placeholderData`: `MyCharacterPage` rozlišuje „directory se načítá"
 * (spinner) od „postava v adresáři není" (stale hláška) přes `isLoading` —
 * placeholder [] by přepnul status na success a hlášku probliknul.
 */
export function useCharacterDirectory(worldId: string) {
  return useQuery({
    queryKey: charactersQueryKey.directory(worldId),
    queryFn: async () => {
      const pages = await api.get<PageDirectoryEntry[]>(
        `/worlds/${worldId}/pages/directory?type=${DIRECTORY_TYPES_PARAM}`,
      );
      return pages.map(pageEntryToCharacterDirectoryEntry);
    },
    enabled: !!worldId,
    staleTime: 30_000,
  });
}
