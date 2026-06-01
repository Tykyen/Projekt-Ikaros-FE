import type {
  CampaignRelationshipStatus,
  CampaignStorylineLevel,
  CampaignStorylineStatus,
  CampaignSubjectStatus,
  CampaignSubjectType,
} from './types';

export const TYPE_LABELS: Record<CampaignSubjectType, string> = {
  PC: 'Postava',
  NPC: 'NPC',
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

export const STORYLINE_LEVEL_LABELS: Record<CampaignStorylineLevel, string> = {
  macro: 'Makro',
  mid: 'Střední',
  micro: 'Mikro',
};

export const STORYLINE_STATUS_LABELS: Record<CampaignStorylineStatus, string> = {
  active: 'Aktivní',
  dormant: 'Spící',
  escalating: 'Eskalace',
  climax: 'Vyvrcholení',
  closed: 'Uzavřená',
};

export const STORYLINE_LEVELS: CampaignStorylineLevel[] = [
  'macro',
  'mid',
  'micro',
];

export const STORYLINE_STATUSES: CampaignStorylineStatus[] = [
  'active',
  'dormant',
  'escalating',
  'climax',
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
