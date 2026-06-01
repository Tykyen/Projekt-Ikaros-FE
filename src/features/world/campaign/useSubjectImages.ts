import { useMemo } from 'react';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import type { CampaignSubject } from './types';

type ImageableSubject = Pick<
  CampaignSubject,
  'avatarUrl' | 'linkedCharacterSlug' | 'linkedPageSlug'
>;

/**
 * Krok 11.1 — resolve avataru subjektu z napojené stránky/postavy.
 *
 * Subjekt sám obrázek nedrží (vyjma ručního `avatarUrl`), ale je navázaný na
 * stránku přes slug — obrázek bereme z adresáře (persona + pages, `imageUrl` je
 * už použitelná URL). Resolve je živý (funguje i pro starší subjekty).
 */
export function useSubjectImages(
  worldId: string,
): (subject: ImageableSubject) => string | undefined {
  const { data: persona } = usePersonaDirectory(worldId);
  const { data: pages } = usePagesDirectory(worldId);

  const imageBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of pages ?? []) if (e.imageUrl) m.set(e.slug, e.imageUrl);
    for (const e of persona ?? []) if (e.imageUrl) m.set(e.slug, e.imageUrl);
    return m;
  }, [persona, pages]);

  return useMemo(
    () => (subject: ImageableSubject) =>
      subject.avatarUrl ||
      (subject.linkedCharacterSlug
        ? imageBySlug.get(subject.linkedCharacterSlug)
        : undefined) ||
      (subject.linkedPageSlug
        ? imageBySlug.get(subject.linkedPageSlug)
        : undefined) ||
      undefined,
    [imageBySlug],
  );
}
