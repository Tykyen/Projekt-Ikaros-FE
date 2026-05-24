/**
 * 7.1 — Typy wiki stránek světa. Zrcadlí BE
 * (`backend/src/modules/pages/interfaces/page.interface.ts`).
 *
 * ⚠️ FE má plný `AccessRequirement.type` včetně `'AKJType'` — BE DTO + repository
 * mapper ho zatím přehlížejí (viz dluh D-072). Pro 7.1 viewer neblokuje, jen
 * čteme z `findBySlugAndWorld` (runtime hodnota je správná, typescript zužuje).
 */

export const PAGE_TYPES = {
  Lokace: 'Lokace',
  Noviny: 'Noviny',
  Seznam: 'Seznam',
  Galerie: 'Galerie',
  Rodokmen: 'Rodokmen',
  Obrazovka: 'Obrazovka',
  Ostatni: 'Ostatní',
  // 9.1 — sjednocení Character → Page. PC = má `ownerUserId`, NPC = bez.
  PostavaHrace: 'Postava hráče',
  NPC: 'NPC',
} as const;

export type PageType = (typeof PAGE_TYPES)[keyof typeof PAGE_TYPES];

export const ALL_PAGE_TYPES: PageType[] = Object.values(PAGE_TYPES);

/**
 * Resolve PageType z URL query parametru. Akceptuje:
 *   - slug-friendly klíč (`PostavaHrace`) — preferováno v URL
 *   - display-name s diakritikou (`Postava hráče`) — zpětná kompatibilita
 *
 * Vrací `undefined` pro neznámý vstup (volající si pak řeší default).
 */
export function resolvePageTypeFromUrl(token: string): PageType | undefined {
  if (!token) return undefined;
  if ((ALL_PAGE_TYPES as readonly string[]).includes(token)) {
    return token as PageType;
  }
  return (PAGE_TYPES as Record<string, PageType>)[token];
}

export interface AccessRequirement {
  type: 'UserId' | 'AKJ' | 'Role' | 'AKJType';
  value: string;
}

/**
 * 9.1 — Label/value pár pro strukturované metadata (info-blocks). Dříve
 * žil v `characters.types.ts`; po sjednocení Character→Page je sdílený.
 */
export interface InfoBlock {
  label: string;
  value: string;
}

export interface PageSectionItem {
  id: string;
  text: string;
  quantity?: number;
  note?: string;
}

export interface PageSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isCollapsed: boolean;
  items: PageSectionItem[];
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

export interface InstructionalVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
}

export interface MenuItem {
  label: string;
  href: string;
  order: number;
}

export interface PageTable {
  hasTable: boolean;
  title?: string;
  /**
   * 8.5 — buňky tabulky (klíče i hodnoty) jsou rich-text HTML stringy.
   * Libovolný úsek textu může být inline odkaz (`<a href>`), v jedné
   * buňce klidně víc odkazů. BE normalizuje starší tvary.
   */
  headers?: string[];
  values?: string[];
}

export interface Page {
  id: string;
  slug: string;
  worldId: string;
  type: PageType;
  title: string;
  content: string;
  imageUrl?: string;
  bigImage?: boolean;
  table?: PageTable;
  sections: PageSection[];
  galleryImages: GalleryImage[];
  videos: InstructionalVideo[];
  menu: MenuItem[];
  plainText: string;
  isWoodWide: boolean;
  accessRequirements: AccessRequirement[];
  customData?: Record<string, string>;
  order: number;
  createdAt: string;
  updatedAt: string;
  // 9.1 — pole pro typ PostavaHrace/NPC. Pro ostatní typy zůstávají undefined.
  /** PJ-only obsah (mirror character.privateBio); BE posílá jen PJ + ownerUserId. */
  privateContent?: string;
  /** PJ-only strukturovaná metadata (rasa, povolání, …); BE posílá jen PJ + ownerUserId. */
  privateInfoBlocks?: InfoBlock[];
  /** Pro type=PostavaHrace: přiřazený hráč. */
  ownerUserId?: string;
  /** Pro type ∈ {PostavaHrace, NPC}: link na character entity (5 subdokumentů — diary/calendar/finance/inventory/notes). */
  characterRef?: { characterId: string };
}

/** Lehká položka pro `GET /worlds/:worldId/pages/directory`. */
export interface PageDirectoryEntry {
  id: string;
  slug: string;
  title: string;
  type: PageType;
  order: number;
  /** 7.4 — pro „poslední editace" sloupec ve správě stránek. */
  updatedAt: string;
  // 9.1 — pro CharactersPage karty (PostavaHrace/NPC).
  imageUrl?: string;
  ownerUserId?: string;
}

/** Backlink karta — `GET /worlds/:worldId/pages/:slug/backlinks` (BE 7.1l). */
export interface PageBacklink {
  slug: string;
  title: string;
  type: PageType;
}
