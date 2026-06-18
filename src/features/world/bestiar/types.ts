/**
 * 10.2d-prep-B — Bestiar typy (FE mirror BE Bestie interface).
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type BestieScope = 'system' | 'user' | 'world';

export interface Bestie {
  id: string;
  scope: BestieScope;
  systemId: string;
  ownerUserId?: string;
  worldId?: string;
  name: string;
  imageUrl?: string;
  /** Výřez obrázku — parity s Page/GameEvent/WorldNews (focal point + zoom + fit). */
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
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
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  notes?: string;
  abilities?: Array<{ label: string; value: string }>;
  systemStats: Record<string, unknown>;
}

export interface UpdateBestiePayload {
  name?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  notes?: string;
  abilities?: Array<{ label: string; value: string }>;
  systemStats?: Record<string, unknown>;
}

export interface CloneBestiePayload {
  scope: 'user' | 'world';
  worldId?: string;
  newName?: string;
}
