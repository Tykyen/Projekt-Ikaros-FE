/**
 * Krok 11.1 — Pavučina (FE typy).
 *
 * Zrcadlo BE modulu `campaign`
 * (`backend/src/modules/campaign/interfaces/*`). Datumy přicházejí přes JSON
 * jako ISO stringy.
 *
 * 11.1 emoční model: `RelationshipSide` má navíc `valence` (−3..+3) a
 * `emotionTag` (pojmenovaná emoce) — BE je perzistuje (schemaless side +
 * `toEntity` passthrough, viz spec §4.3 / BE repo spec).
 */

// ── Subjekty ────────────────────────────────────────────────────────────────

export type CampaignSubjectType =
  | 'PC'
  | 'NPC'
  | 'FACTION'
  | 'ORG'
  | 'LOCATION'
  | 'STATE'
  | 'OTHER';

export type CampaignSubjectStatus = 'active' | 'archived';

export interface CampaignSubject {
  id: string;
  worldId: string;
  ownerId: string;
  isShared: boolean;
  type: CampaignSubjectType;
  name: string;
  avatarUrl?: string;
  tags: string[];
  status: CampaignSubjectStatus;
  linkedPageSlug?: string;
  linkedCharacterSlug?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectInput {
  name: string;
  type?: CampaignSubjectType;
  avatarUrl?: string;
  tags?: string[];
  status?: CampaignSubjectStatus;
  linkedPageSlug?: string;
  linkedCharacterSlug?: string;
  notes?: string;
  isShared?: boolean;
}

// ── Vztahy ──────────────────────────────────────────────────────────────────

export type CampaignRelationshipStatus =
  | 'active'
  | 'dormant'
  | 'crisis'
  | 'closed';

export interface RelationshipShared {
  whatHappened?: string;
  /** Tajné — jen PJ. */
  behindTheScenes?: string;
}

export interface RelationshipSide {
  tone?: string;
  behavior?: string;
  /** Tajný PJ záměr — jen PJ. */
  gmIntent?: string;
  /** Síla vztahu 1–10 → tloušťka hrany v grafu. */
  strength?: number;
  /** Kvantita −3 (nenávist/válka) … 0 … +3 (láska/spojenectví) → barva hrany. */
  valence?: number;
  /** Kvalita — pojmenovaná emoce z type-aware palety (viz `emotions.ts`). */
  emotionTag?: string;
}

export interface CampaignRelationship {
  id: string;
  worldId: string;
  ownerId: string;
  isShared: boolean;
  subjectAId: string;
  subjectBId: string;
  shared: RelationshipShared;
  sideA: RelationshipSide;
  sideB: RelationshipSide;
  status: CampaignRelationshipStatus;
  /** 1–5. */
  priority: number;
  storylineIds: string[];
  lastChangeNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRelationshipInput {
  subjectAId: string;
  subjectBId: string;
  shared?: RelationshipShared;
  sideA?: RelationshipSide;
  sideB?: RelationshipSide;
  status?: CampaignRelationshipStatus;
  priority?: number;
  storylineIds?: string[];
  lastChangeNote?: string;
  isShared?: boolean;
}

// ── Příběhové linky (v 11.1 jen čteno — filtr grafu + dashboard) ─────────────

export type CampaignStorylineLevel = 'macro' | 'mid' | 'micro';
export type CampaignStorylineStatus =
  | 'active'
  | 'dormant'
  | 'escalating'
  | 'climax'
  | 'closed';

export interface CampaignStoryline {
  id: string;
  worldId: string;
  ownerId: string;
  isShared: boolean;
  level: CampaignStorylineLevel;
  title: string;
  status: CampaignStorylineStatus;
  summary?: string;
  whatHappened?: string;
  truth?: string;
  playersBelief?: string;
  gmIntent?: string;
  nextStep?: string;
  subjectIds: string[];
  relationshipIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorylineInput {
  title: string;
  level?: CampaignStorylineLevel;
  status?: CampaignStorylineStatus;
  summary?: string;
  whatHappened?: string;
  truth?: string;
  playersBelief?: string;
  gmIntent?: string;
  nextStep?: string;
  subjectIds?: string[];
  relationshipIds?: string[];
  isShared?: boolean;
}

// ── Rychlé poznámky (v 11.1 jen čteno — připnuté v dashboardu) ───────────────

export interface CampaignQuickNote {
  id: string;
  worldId: string;
  ownerId: string;
  isShared: boolean;
  title: string;
  body?: string;
  status: 'open' | 'done';
  pinned: boolean;
  subjectIds: string[];
  storylineIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Changelog & dashboard ────────────────────────────────────────────────────

export type CampaignEntityType =
  | 'subject'
  | 'relationship'
  | 'storyline'
  | 'scenario'
  | 'quicknote'
  | 'shopitem';
export type CampaignChangeType = 'created' | 'updated' | 'deleted';

export interface CampaignChangeLog {
  id: string;
  worldId: string;
  ownerId: string;
  isShared: boolean;
  entityType: CampaignEntityType;
  entityId: string;
  entityName: string;
  changeType: CampaignChangeType;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export interface CampaignDashboard {
  crisisRelationships: CampaignRelationship[];
  activeStorylines: CampaignStoryline[];
  pinnedNotes: CampaignQuickNote[];
  /** Posledních ~20 změn (changelog), ne rozdělené dle entit. */
  recentChanges: CampaignChangeLog[];
}

// ── Hráči (PJ layer switcher) ────────────────────────────────────────────────

export interface CampaignPlayer {
  userId: string;
  /** Slug postavy hráče ve světě (BE nevrací username — label odvodíme odtud). */
  characterPath?: string;
  role: number;
}
