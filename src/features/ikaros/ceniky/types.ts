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

/**
 * 21.5g — měna ceníku. Uložení je vždy `{gold,silver,copper}` (1:10:100);
 * měna určuje jen zobrazení: gsc = zl/st/md, usd = $ (gold=dolary,
 * copper=centy), credits = kredity (éra Budoucnost — rezervováno).
 */
export const PRICE_LIST_CURRENCIES = ['gsc', 'usd', 'credits'] as const;
export type PriceListCurrency = (typeof PRICE_LIST_CURRENCIES)[number];

/** Popisky měn pro select v editoru a badge v knihovně. */
export const PRICE_LIST_CURRENCY_LABELS: Record<PriceListCurrency, string> = {
  gsc: 'Zlaté / stříbrné / měďáky',
  usd: 'Americké dolary ($)',
  credits: 'Kredity',
};

/**
 * 21.5j R7 — registr ér pro seskupení knihovny (chronologické pořadí).
 * Éra se pozná podle štítku seedu; ceník bez érového štítku patří do
 * PRICE_LIST_ERA_OTHER (volná komunitní tvorba).
 */
export const PRICE_LIST_ERAS: { label: string; tags: string[] }[] = [
  { label: 'Středověk a fantasy', tags: ['morvol', 'fantasy', 'středověk'] },
  { label: 'Divoký západ', tags: ['divoký západ'] },
  { label: '1. světová válka', tags: ['1. světová'] },
  { label: '2. světová válka', tags: ['2. světová'] },
  { label: 'Přítomnost', tags: ['přítomnost'] },
  { label: 'Blízká budoucnost', tags: ['blízká budoucnost'] },
  {
    label: 'Galaktické dobrodružství',
    tags: ['galaxie', 'galaktické dobrodružství'],
  },
];
export const PRICE_LIST_ERA_OTHER = 'Ostatní a komunitní';

/** Éra ceníku dle štítků (první shoda v registru; jinak Ostatní). */
export function eraOf(list: Pick<GlobalPriceList, 'tags'>): string {
  const tags = (list.tags ?? []).map((t) => t.toLowerCase());
  for (const era of PRICE_LIST_ERAS) {
    if (era.tags.some((t) => tags.includes(t))) return era.label;
  }
  return PRICE_LIST_ERA_OTHER;
}

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
  /** 21.5g — měna zobrazení cen (starší dokumenty nemají → gsc). */
  currency?: PriceListCurrency;
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
  /** 21.5g — měna zobrazení cen (default gsc). */
  currency?: PriceListCurrency;
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

/**
 * 21.5g — cena dle měny ceníku. gsc = „2 zl 5 st"; usd = „$1,299.50"
 * (gold=dolary, silver=desetníky, copper=centy; celé dolary bez „.00");
 * credits = „1 234 kr". Vše nula = „zdarma".
 */
export function formatPrice(p: PriceGsc, currency?: PriceListCurrency): string {
  if (!currency || currency === 'gsc') return formatGsc(p);
  if (!p.gold && !p.silver && !p.copper) return 'zdarma';
  if (currency === 'usd') {
    const dollars = p.gold.toLocaleString('en-US');
    const cents = p.silver * 10 + p.copper;
    return cents ? `$${dollars}.${String(cents).padStart(2, '0')}` : `$${dollars}`;
  }
  // credits — éra Budoucnost; centové složky se zatím nezobrazují jinak.
  const whole = p.gold.toLocaleString('cs-CZ');
  const frac = p.silver * 10 + p.copper;
  return frac ? `${whole},${String(frac).padStart(2, '0')} kr` : `${whole} kr`;
}

/** 21.5g — usd editor: desetinná hodnota v dolarech ↔ {gold,silver,copper}. */
export function decimalToGsc(value: number): PriceGsc {
  const cents = Math.max(0, Math.round(value * 100));
  return {
    gold: Math.floor(cents / 100),
    silver: Math.floor((cents % 100) / 10),
    copper: cents % 10,
  };
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
