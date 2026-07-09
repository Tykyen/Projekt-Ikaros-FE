/**
 * 16.2b-2 — Komunitní (globální) bestiář: FE typy (mirror BE Bestie community
 * scope + BestieComment). Spec: docs/arch/phase-16/spec-16.2b-2-bestiar-komunitni.md
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type BestieStatus = 'draft' | 'approved';

/** Jedna pravidlová verze (statblok) — klíč v `statblocks` = systemId. */
export interface BestieStatblockEntry {
  systemStats: Record<string, unknown>;
  status: BestieStatus;
  authorId: string;
  createdAt: string;
}

/** Globální (komunitní) bytost: sdílený lore + mapa systém→statblok. */
export interface GlobalBestie {
  id: string;
  scope: 'community';
  /** Primární systém (bytost vznikla pro něj); reálné verze jsou ve `statblocks`. */
  systemId: string;
  name: string;
  latin?: string;
  kind?: string;
  tags?: string[];
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  description: string;
  /** 'draft' = knihovna návrhů, 'approved' = schválená knihovna. */
  status?: BestieStatus;
  authorId?: string;
  approvedAt?: string | null;
  approvedBy?: string;
  statblocks?: Record<string, BestieStatblockEntry>;
  createdAt: string;
  updatedAt: string;
}

/** Komentář — dvě úrovně: 'beast' (lore) / 'statblock' (staty systému). */
export interface BestieComment {
  id: string;
  bestieId: string;
  targetType: 'beast' | 'statblock';
  systemId?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──
export interface CreateCommunityBestiePayload {
  systemId: string;
  name: string;
  latin?: string;
  kind?: string;
  tags?: string[];
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  description?: string;
  systemStats: Record<string, unknown>;
}

/** Úprava lore — BEZ statů (staty jen přes návrh, spec §2a). */
export interface UpdateLorePayload {
  name?: string;
  latin?: string;
  kind?: string;
  tags?: string[];
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  description?: string;
}

export interface ProposeStatblockPayload {
  systemId: string;
  systemStats: Record<string, unknown>;
}

export interface CloneCommunityPayload {
  scope: 'user' | 'world';
  systemId: string;
  worldId?: string;
  newName?: string;
}

export interface CreateBestieCommentPayload {
  targetType: 'beast' | 'statblock';
  systemId?: string;
  content: string;
}

export interface CommunityLibraryFilter {
  status?: BestieStatus;
  kind?: string;
  systemId?: string;
}
