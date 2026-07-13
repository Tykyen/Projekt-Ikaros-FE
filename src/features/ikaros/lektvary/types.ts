/**
 * 21.5b — Komunitní katalog lektvarů: FE typy (mirror BE Potion + PotionComment).
 * Lektvar = jádro (druh + suroviny s množstvím + „oznámení" + obrázek + cena)
 * + mapa systém→statblok (vzor kouzla 21.5c). Šablony: `systems/potionTemplates.ts`.
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type PotionStatus = 'draft' | 'approved';

/** Surovina receptu — co a volitelně kolik (spec R3, min. 1 na lektvar). */
export interface PotionIngredient {
  name: string;
  amount?: string;
}

/** Jedna pravidlová verze (statblok) — klíč v `statblocks` = systemId. */
export interface PotionStatblockEntry {
  systemStats: Record<string, unknown>;
  /** 'draft' = návrh, 'approved' = kurátorem přijaté jako balancnuté. */
  status: PotionStatus;
  authorId: string;
  createdAt: string;
}

/** Globální (komunitní) lektvar: jádro + mapa systém→statblok. */
export interface GlobalPotion {
  id: string;
  scope: 'community';
  /** Primární systém (lektvar vznikl pro něj); reálné verze ve `statblocks`. */
  systemId: string;
  name: string;
  /** Alternativní/lidová jména (volný text). */
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  /** Druh lektvaru (léčivý/jed/…) — systémově neutrální filtr. */
  kind: string;
  /** Suroviny s množstvím (min. 1). */
  ingredients: PotionIngredient[];
  /** „Oznámení" — popis účinku / lore. */
  description: string;
  tags?: string[];
  /** Navrhovaná cena (bez měny) — předvyplní vklad do obchodu. */
  suggestedPrice?: number | null;
  /** 'draft' = knihovna návrhů, 'approved' = schválená knihovna. */
  status: PotionStatus;
  authorId?: string;
  approvedAt?: string | null;
  approvedBy?: string;
  statblocks?: Record<string, PotionStatblockEntry>;
  createdAt: string;
  updatedAt: string;
}

/** Komentář — dvě úrovně: 'potion' (lore) / 'statblock' (staty systému). */
export interface PotionComment {
  id: string;
  potionId: string;
  targetType: 'potion' | 'statblock';
  systemId?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──
export interface CreateCommunityPotionPayload {
  systemId: string;
  name: string;
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  kind: string;
  ingredients: PotionIngredient[];
  description?: string;
  tags?: string[];
  suggestedPrice?: number | null;
  systemStats: Record<string, unknown>;
}

/** Úprava jádra — BEZ statů (staty jen přes návrh statbloku). */
export interface UpdatePotionLorePayload {
  name?: string;
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  kind?: string;
  ingredients?: PotionIngredient[];
  description?: string;
  tags?: string[];
  suggestedPrice?: number | null;
}

export interface ProposePotionStatblockPayload {
  systemId: string;
  systemStats: Record<string, unknown>;
}

export interface CreatePotionCommentPayload {
  targetType: 'potion' | 'statblock';
  systemId?: string;
  content: string;
}

export interface PotionLibraryFilter {
  status?: PotionStatus;
  systemId?: string;
  kind?: string;
  tag?: string;
}
