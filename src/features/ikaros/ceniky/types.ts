/**
 * 21.5f — Komunitní knihovna ceníků: FE typy (mirror BE PriceList).
 * Ceník = jeden dokument s vnořenými položkami (max 200); cena položky
 * strukturovaně zlaté/stříbrné/měďáky (pevný poměr 1 zl = 10 st = 100 md).
 * Per-systém staty zbraní/zbrojí řeší link na Předměty (`linkedItemId`).
 */
import type { ImageFit } from '@/shared/lib/imageStyle';

export type PriceListStatus = 'draft' | 'approved';

/** Max položek jednoho ceníku (= limit bulk dávky obchodu). */
export const PRICE_LIST_MAX_ITEMS = 200;

/** Strukturovaná cena zlaté/stříbrné/měďáky. */
export interface PriceGsc {
  gold: number;
  silver: number;
  copper: number;
}

/** Jedna položka ceníku (pořadí = pořadí v poli). */
export interface PriceListItem {
  id: string;
  name: string;
  description?: string;
  /** Sekce uvnitř ceníku („V hospodě", region…) — detail seskupuje. */
  section?: string;
  imageUrl?: string;
  imageBytes?: number;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  /** Atribuce převzatého obrázku (autor · zdroj · licence). */
  imageCredit?: string;
  gold: number;
  silver: number;
  copper: number;
  /** Link na komunitní předmět (staty per systém v katalogu Předmětů). */
  linkedItemId?: string;
}

/** Globální (komunitní) ceník. */
export interface GlobalPriceList {
  id: string;
  scope: 'community';
  name: string;
  description?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  tags?: string[];
  items: PriceListItem[];
  /** 'draft' = knihovna návrhů, 'approved' = schválená knihovna. */
  status: PriceListStatus;
  authorId: string;
  approvedAt?: string | null;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Komentář k ceníku (jedna úroveň — celý ceník). */
export interface PriceListComment {
  id: string;
  priceListId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloady ──

/** Položka v payloadu — `id` volitelné (nové položce ho doplní BE). */
export type PriceListItemPayload = Omit<PriceListItem, 'id'> & { id?: string };

export interface CreatePriceListPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: ImageFit | null;
  tags?: string[];
  items?: PriceListItemPayload[];
}

/** Úprava — partial; `items` = plná náhrada pole položek. */
export type UpdatePriceListPayload = Partial<CreatePriceListPayload>;

export interface CreatePriceListCommentPayload {
  content: string;
}

export interface CenikyLibraryFilter {
  status?: PriceListStatus;
  tag?: string;
}

// ── Helpery ceny ──

/** „2 zl 5 st" — nenulové složky; vše nula = „zdarma". */
export function formatGsc(p: PriceGsc): string {
  const parts: string[] = [];
  if (p.gold) parts.push(`${p.gold} zl`);
  if (p.silver) parts.push(`${p.silver} st`);
  if (p.copper) parts.push(`${p.copper} md`);
  return parts.length ? parts.join(' ') : 'zdarma';
}

/** Cena ve zlatých jako desetinné číslo (1 zl = 10 st = 100 md). */
export function gscToGoldDecimal(p: PriceGsc): number {
  return Math.round((p.gold + p.silver / 10 + p.copper / 100) * 10000) / 10000;
}

/** Unikátní sekce v pořadí prvního výskytu ('' = bez sekce). */
export function sectionsOf(items: PriceListItem[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.section?.trim() ?? '';
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}
