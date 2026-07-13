/**
 * 7.1 — Typy wiki stránek světa. Zrcadlí BE
 * (`backend/src/modules/pages/interfaces/page.interface.ts`).
 *
 * ⚠️ FE má plný `AccessRequirement.type` včetně `'AKJType'` — BE DTO + repository
 * mapper ho zatím přehlížejí (viz dluh D-072). Pro 7.1 viewer neblokuje, jen
 * čteme z `findBySlugAndWorld` (runtime hodnota je správná, typescript zužuje).
 */
import type { ShieldedRequirement } from './usePageMeta';

export const PAGE_TYPES = {
  Lokace: 'Lokace',
  Noviny: 'Noviny',
  Seznam: 'Seznam',
  Galerie: 'Galerie',
  // „Zoom" = velký zoomovatelný obrázek (dříve „Rodokmen"). BE mapuje legacy
  // dokumenty type='Rodokmen' BEZ familyTree na 'Zoom' při čtení.
  Zoom: 'Zoom',
  // 17.7 — vizuální strom rodiny. Sdílí jméno se starým typem, odlišen polem
  // `familyTree` (BE normalizePageType). Legacy velký obrázek → Zoom.
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
  // Pozn.: „Rodokmen" je od 17.7 zase platný typ (strom rodiny), takže projde
  // běžnou cestou níže. Legacy velký-obrázek data řeší BE normalizePageType.
  if ((ALL_PAGE_TYPES as readonly string[]).includes(token)) {
    return token as PageType;
  }
  return (PAGE_TYPES as Record<string, PageType>)[token];
}

/**
 * Lidský název odvozený ze slugu — pro předvyplnění pole NÁZEV při tvorbě
 * stránky z 404 („Vytvořit" s `?slug=`). Pomlčky → mezery, první písmeno velké.
 *
 * ⚠️ Slug nenese diakritiku (slugify ji odstraní), takže výsledek je bez háčků
 * (`kralovna-vil` → „Kralovna vil") — uživatel ji v editoru doladí. Round-trip
 * přes `slugify` dá zpět původní slug.
 */
export function slugToTitle(slug: string): string {
  const words = slug.replace(/-+/g, ' ').trim();
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
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

/**
 * 17.7 — uzel vizuálního rodokmenu. Volná data (jméno/foto/datum) + volitelný
 * odkaz na stránku postavy (`pageSlug`; klik → navigace). Datum je volný text
 * („1502" i „3. 4. 1502"). Pozice `x,y` je tažená / srovnaná auto-layoutem.
 */
export interface FamilyPerson {
  id: string;
  name: string;
  sub?: string;
  born?: string;
  died?: string;
  imageUrl?: string;
  color?: string;
  pageSlug?: string;
  x: number;
  y: number;
}

/** 17.7 — svazek: partneři A(+B) a jejich potomci. `bId` prázdné = samoživitel. */
export interface FamilyUnion {
  id: string;
  aId: string;
  bId?: string;
  childIds: string[];
}

export interface FamilyTree {
  people: FamilyPerson[];
  unions: FamilyUnion[];
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
  /** Volitelný obrázek dlaždice (sub-hub kapitol, např. typy magie). */
  imageUrl?: string;
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

/**
 * AKJ chráněná záložka stránky (spec-akj-protected-tabs.md). Zobrazí se v liště
 * vedle Profil/Kalendář jen tomu, kdo splní `access` (OR logika). Obsah dědí ze
 * základní stránky; `contentOverride` je sparse — vyplněné pole přepíše základ.
 * BE záložky filtruje — FE dostane jen ty, na které má viewer přístup.
 */
export interface AkjTabContentOverride {
  imageUrl?: string;
  content?: string;
  /** Atributy & metadata (sidebar „boxy"). Záložka dědí ze základu, nebo přepíše. */
  table?: PageTable;
}

export interface AkjTab {
  id: string;
  name: string;
  order: number;
  /** Podmínky viditelnosti (OR). Clearance = { type:'AKJ', value }, konkrétní
   *  hráč = { type:'UserId' }, role práh = { type:'Role' }. Prázdné = jen PJ. */
  access: AccessRequirement[];
  /** Skryje záložku i vlastníkovi postavy (page.ownerUserId). Default/undefined
   *  = false = vlastník PC ji vidí i bez grantu. Mimo PC bez efektu. */
  ownerHidden?: boolean;
  contentOverride?: AkjTabContentOverride;
  /** Runtime-only z BE (per viewer, NEukládá se). `true` = viewer nemá přístup
   *  → vidí jen zamčenou záložku (jméno + úroveň, `access` má jen AKJ, obsah
   *  chybí). `false`/`undefined` = plný přístup. Viz spec-akj-locked-tabs-visible. */
  locked?: boolean;
}

export interface Page {
  id: string;
  slug: string;
  worldId: string;
  type: PageType;
  title: string;
  content: string;
  /** Pravidlová kniha — taháková rekapitulace pro HUD „Rychlý přehled". */
  quickRef?: string;
  imageUrl?: string;
  bigImage?: boolean;
  // Parita s GameEvent — výřez hlavního obrázku. null = default (focal 50/50,
  // zoom 100, fit cover); render řeší getImageStyle().
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: 'cover' | 'contain' | null;
  table?: PageTable;
  /** 17.7 — vizuální rodokmen. Přítomnost odlišuje nový typ „Rodokmen" od
   *  legacy (velký obrázek → Zoom). */
  familyTree?: FamilyTree;
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
  /** Pro type=PostavaHrace: přiřazený hráč. */
  ownerUserId?: string;
  /** Pro type ∈ {PostavaHrace, NPC}: link na character entity (5 subdokumentů — diary/calendar/finance/inventory/notes). */
  characterRef?: { characterId: string };
  /** AKJ chráněné záložky — BE-filtrované (viewer dostane jen dostupné). */
  akjTabs?: AkjTab[];
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
  // Parita s GameEvent — focal/zoom/fit pro výřez avataru v kartě adresáře.
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: 'cover' | 'contain' | null;
  ownerUserId?: string;
  /**
   * D-DATA-SYNC-ZBYTKY a — ID Character entity (typy Postava hráče/NPC/Lokace
   * mají `characterRef`; čistá stránka → null). ⚠️ `entry.id` je PAGE ID —
   * pro finance/subdoc API vždy použij `characterId` (past `directory_id`).
   * Optional kvůli starším BE odpovědím v cache.
   */
  characterId?: string | null;
  /**
   * D-062c — pokud má current user nesplněné AKJ/Role requirementy, listing
   * renderuje stub kartu „🔒 AKJ: N — Název" místo normální. Prázdné/undefined =
   * má přístup. Raw accessRequirements se nevrací (privacy).
   */
  shieldedBy?: ShieldedRequirement[];
}

/** Backlink karta — `GET /worlds/:worldId/pages/:slug/backlinks` (BE 7.1l). */
export interface PageBacklink {
  slug: string;
  title: string;
  type: PageType;
}
