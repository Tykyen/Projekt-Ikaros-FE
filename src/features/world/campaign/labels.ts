import type {
  CampaignRelationshipStatus,
  CampaignSubjectStatus,
  CampaignSubjectType,
} from './types';

export const TYPE_LABELS: Record<CampaignSubjectType, string> = {
  PC: 'Postava',
  NPC: 'CP',
  FACTION: 'Frakce',
  ORG: 'Organizace',
  STATE: 'Stát',
  LOCATION: 'Lokace',
  OTHER: 'Ostatní',
};

export const SUBJECT_STATUS_LABELS: Record<CampaignSubjectStatus, string> = {
  active: 'Aktivní',
  archived: 'Archivovaný',
};

export const REL_STATUS_LABELS: Record<CampaignRelationshipStatus, string> = {
  active: 'Aktivní',
  dormant: 'Spící',
  crisis: 'Krize',
  closed: 'Uzavřený',
};

export const SUBJECT_TYPES: CampaignSubjectType[] = [
  'PC',
  'NPC',
  'FACTION',
  'ORG',
  'STATE',
  'LOCATION',
  'OTHER',
];

export const REL_STATUSES: CampaignRelationshipStatus[] = [
  'active',
  'dormant',
  'crisis',
  'closed',
];

/** Label hráče pro layer switcher — BE nevrací username, odvodíme z characterPath. */
export function playerLabel(characterPath: string | undefined, userId: string): string {
  if (characterPath) {
    const slug = characterPath.replace(/^\/+/, '').split('/').pop() ?? '';
    if (slug) return slug.replace(/-/g, ' ');
  }
  return `Hráč ${userId.slice(-4)}`;
}
