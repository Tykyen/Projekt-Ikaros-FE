/**
 * 21.5c — Komunitní katalog kouzel: FE typy (mirror BE Spell + SpellComment).
 * Kouzlo = sdílené jádro („oznámení" + obrázek) + mapa systém→statblok
 * (vzor komunitní bestie). Šablony statbloků: `systems/spellTemplates.ts`.
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type SpellStatus = 'draft' | 'approved';

/** Jedna pravidlová verze (statblok) — klíč v `statblocks` = systemId. */
export interface SpellStatblockEntry {
  systemStats: Record<string, unknown>;
  /** 'draft' = návrh, 'approved' = kurátorem přijaté jako balancnuté. */
  status: SpellStatus;
  authorId: string;
  createdAt: string;
}

/** Globální (komunitní) kouzlo: sdílené jádro + mapa systém→statblok. */
export interface GlobalSpell {
  id: string;
  scope: 'community';
  /** Primární systém (kouzlo vzniklo pro něj); reálné verze ve `statblocks`. */
  systemId: string;
  name: string;
  /** Alternativní/lidová jména (volný text). */
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  /** „Oznámení" — lore/popis účinku kouzla. */
  description: string;
  tags?: string[];
  /** 'draft' = knihovna návrhů, 'approved' = schválená knihovna. */
  status: SpellStatus;
  authorId?: string;
  approvedAt?: string | null;
  approvedBy?: string;
  statblocks?: Record<string, SpellStatblockEntry>;
  createdAt: string;
  updatedAt: string;
}

/** Komentář — dvě úrovně: 'spell' (lore) / 'statblock' (staty systému). */
export interface SpellComment {
  id: string;
  spellId: string;
  targetType: 'spell' | 'statblock';
  systemId?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──
export interface CreateCommunitySpellPayload {
  systemId: string;
  name: string;
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  description?: string;
  tags?: string[];
  systemStats: Record<string, unknown>;
}

/** Úprava lore (jádra) — BEZ statů (staty jen přes návrh statbloku). */
export interface UpdateSpellLorePayload {
  name?: string;
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  description?: string;
  tags?: string[];
}

export interface ProposeSpellStatblockPayload {
  systemId: string;
  systemStats: Record<string, unknown>;
}

export interface CreateSpellCommentPayload {
  targetType: 'spell' | 'statblock';
  systemId?: string;
  content: string;
}

export interface SpellLibraryFilter {
  status?: SpellStatus;
  systemId?: string;
  tag?: string;
}
