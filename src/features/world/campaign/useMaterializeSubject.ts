import { useCreatePage } from '@/features/world/pages/api/useCreatePage';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import type { PageType } from '@/features/world/pages/api/pages.types';
import { slugifyWithFallback, uniqueSlug } from '@/features/world/pages/PageEditor/lib/slugify';
import { useUpdateSubject } from './api';
import type { CampaignSubject, CampaignSubjectType } from './types';

/**
 * 11.5 — „materializace" subjektu Pavučiny na reálnou stránku (Page) světa.
 *
 * Typ subjektu → typ stránky; ostatní typy (OTHER) reálnou entitu nemají.
 * PC/NPC/Lokace BE navíc auto-vytvoří Character; Frakce/Organizace/Stát jsou
 * čisté wiki Page (viz spec 11.5 B2). Po vytvoření napojíme slug zpět do
 * subjektu (`linkedPageSlug`, u person i `linkedCharacterSlug`), aby šel „vyvolat".
 *
 * Oprávnění řeší BE (`resolveCreateMode`): PJ+ → živě, hráč → pending (NPC/Lokace/
 * Frakce/Org/Stát jsou v `PLAYER_PROPOSABLE`); PC hráč nesmí (BE vrátí 403).
 */
export const SUBJECT_TO_PAGE_TYPE: Partial<Record<CampaignSubjectType, PageType>> = {
  PC: 'Postava hráče',
  NPC: 'NPC',
  LOCATION: 'Lokace',
  FACTION: 'Frakce',
  ORG: 'Organizace',
  STATE: 'Stát',
};

/** Lze subjekt materializovat? (má reálný Page-typ a ještě není napojený.) */
export function isMaterializable(subject: CampaignSubject): boolean {
  if (subject.linkedPageSlug || subject.linkedCharacterSlug) return false;
  return !!SUBJECT_TO_PAGE_TYPE[subject.type];
}

export function useMaterializeSubject(worldId: string, worldSlug: string) {
  const createPage = useCreatePage(worldId, worldSlug);
  const updateSubject = useUpdateSubject(worldId);
  const { data: directory } = usePagesDirectory(worldId);

  async function materialize(subject: CampaignSubject) {
    const pageType = SUBJECT_TO_PAGE_TYPE[subject.type];
    if (!pageType) {
      throw new Error('Tento typ subjektu nelze převést na stránku.');
    }
    // Vyhni se kolizi slugu proti existujícím stránkám (zbytek řeší BE 409).
    const existing = new Set((directory ?? []).map((e) => e.slug));
    const slug = uniqueSlug(slugifyWithFallback(subject.name, 'subjekt'), existing);

    const page = await createPage.mutateAsync({
      slug,
      type: pageType,
      title: subject.name,
    });

    const isPersona = pageType === 'Postava hráče' || pageType === 'NPC';
    // Full-replace update — pošli všechna pole subjektu + novou vazbu.
    await updateSubject.mutateAsync({
      id: subject.id,
      input: {
        name: subject.name,
        type: subject.type,
        status: subject.status,
        tags: subject.tags,
        notes: subject.notes,
        avatarUrl: subject.avatarUrl,
        isShared: subject.isShared,
        linkedPageSlug: page.slug,
        linkedCharacterSlug: isPersona ? page.slug : subject.linkedCharacterSlug,
      },
    });

    return page;
  }

  return {
    materialize,
    isPending: createPage.isPending || updateSubject.isPending,
  };
}
