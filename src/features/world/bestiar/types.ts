/**
 * 10.2d-prep-B — Bestiar typy (FE mirror BE Bestie interface).
 */

export type BestieScope = 'system' | 'user' | 'world';

export interface Bestie {
  id: string;
  scope: BestieScope;
  systemId: string;
  ownerUserId?: string;
  worldId?: string;
  name: string;
  imageUrl?: string;
  notes: string;
  abilities: Array<{ label: string; value: string }>;
  systemStats: Record<string, unknown>;
  clonedFromId?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BestiarResponse {
  system: Bestie[];
  user: Bestie[];
  world: Bestie[];
}

export interface CreateBestiePayload {
  scope: 'user' | 'world' | 'system';
  systemId: string;
  worldId?: string;
  name: string;
  imageUrl?: string;
  notes?: string;
  abilities?: Array<{ label: string; value: string }>;
  systemStats: Record<string, unknown>;
}

export interface UpdateBestiePayload {
  name?: string;
  imageUrl?: string;
  notes?: string;
  abilities?: Array<{ label: string; value: string }>;
  systemStats?: Record<string, unknown>;
}

export interface CloneBestiePayload {
  scope: 'user' | 'world';
  worldId?: string;
  newName?: string;
}
