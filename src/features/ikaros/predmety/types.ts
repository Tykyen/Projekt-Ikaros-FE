/**
 * 21.5e — Komunitní katalog předmětů: FE typy (mirror BE Item + ItemComment).
 * Předmět = jádro (druh — řídí variantu polí — + „oznámení" + obrázek + cena)
 * + mapa systém→statblok (vzor kouzla/lektvary). Šablony:
 * `systems/itemTemplates.ts`.
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type CatalogItemStatus = 'draft' | 'approved';

/** Jedna pravidlová verze (statblok) — klíč v `statblocks` = systemId. */
export interface ItemStatblockEntry {
  systemStats: Record<string, unknown>;
  /** 'draft' = návrh, 'approved' = kurátorem přijaté jako balancnuté. */
  status: CatalogItemStatus;
  authorId: string;
  createdAt: string;
}

/** Globální (komunitní) předmět: jádro + mapa systém→statblok. */
export interface GlobalItem {
  id: string;
  scope: 'community';
  /** Primární systém (předmět vznikl pro něj); reálné verze ve `statblocks`. */
  systemId: string;
  name: string;
  /** Alternativní/lidová jména (volný text). */
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  /** Druh předmětu (zbraň/zbroj/…) — filtr + volba varianty polí. */
  kind: string;
  /** „Oznámení" — popis / lore. */
  description: string;
  tags?: string[];
  /** Navrhovaná cena (bez měny) — předvyplní vklad do obchodu. */
  suggestedPrice?: number | null;
  /** 'draft' = knihovna návrhů, 'approved' = schválená knihovna. */
  status: CatalogItemStatus;
  authorId?: string;
  approvedAt?: string | null;
  approvedBy?: string;
  statblocks?: Record<string, ItemStatblockEntry>;
  createdAt: string;
  updatedAt: string;
}

/** Komentář — dvě úrovně: 'item' (lore) / 'statblock' (staty systému). */
export interface ItemComment {
  id: string;
  itemId: string;
  targetType: 'item' | 'statblock';
  systemId?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──
export interface CreateCommunityItemPayload {
  systemId: string;
  name: string;
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  kind: string;
  description?: string;
  tags?: string[];
  suggestedPrice?: number | null;
  systemStats: Record<string, unknown>;
}

/** Úprava jádra — BEZ statů (staty jen přes návrh statbloku). */
export interface UpdateItemLorePayload {
  name?: string;
  aliases?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  kind?: string;
  description?: string;
  tags?: string[];
  suggestedPrice?: number | null;
}

export interface ProposeItemStatblockPayload {
  systemId: string;
  systemStats: Record<string, unknown>;
}

export interface CreateItemCommentPayload {
  targetType: 'item' | 'statblock';
  systemId?: string;
  content: string;
}

export interface ItemLibraryFilter {
  status?: CatalogItemStatus;
  systemId?: string;
  kind?: string;
  tag?: string;
}
