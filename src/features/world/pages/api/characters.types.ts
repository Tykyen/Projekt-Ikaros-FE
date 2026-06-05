/**
 * 9.1 (cleanup) — Character po sjednocení Character → Page drží JEN
 * subdoc data (diary/calendar/finance/inventory/notes). Bio data
 * (publicBio, publicInfoBlocks, privateBio, privateInfoBlocks, imageUrl,
 * accessRequirements, isLocation) jsou v Page entity přes `Page.characterRef`.
 *
 * Skript `cleanup-character-duplicates-9.1` (BE) smazal duplicitní pole
 * z `characters` collection.
 */
import type { InfoBlock, PageSection } from './pages.types';

export type { InfoBlock };

/** Blok dynamického schématu (deník / extra bloky). */
export interface SchemaBlock {
  key: string;
  label: string;
  type: string;
  config?: Record<string, unknown>;
  order: number;
}

export interface Character {
  id: string;
  slug: string;
  name: string;
  worldId: string;
  /** Přiřazený hráč (jen PC) — pro permission filter v subdoc API. */
  userId?: string;
  isNpc: boolean;
  /** Spec 9.2 — `'persona'` (postavy) / `'location'` (Lokace, jen kalendář). */
  kind: 'persona' | 'location';
  diaryData: Record<string, unknown>;
  extraBlocks: SchemaBlock[];
  campaignSubjectId?: string;
  customData?: Record<string, unknown>;
  createdAt: string;
  /** D-073 (2026-05-23) — optimistic concurrency token (ISO string). */
  updatedAt?: string;
}

/**
 * Karta postavy v adresáři. Po sjednocení 9.1 se data plní mapperem
 * `pageEntryToCharacterEntry` z `PageDirectoryEntry` (PageEntry drží
 * `imageUrl` a `ownerUserId` — viz `usePersonaDirectory`). BE legacy
 * `/characters/directory` vrací zúžený tvar bez avatara, ale tento FE
 * type drží pole pro CharacterCard rendering.
 */
export interface CharacterDirectoryEntry {
  id: string;
  slug: string;
  name: string;
  isNpc: boolean;
  /** Spec 9.2 — 'location' (Lokace) / 'persona'. Lokace se nenabízí jako postava hráče. */
  kind: 'persona' | 'location';
  imageUrl?: string;
  /** Přiřazený hráč (jen PC) — pro zobrazení jména hráče na kartě. */
  userId?: string;
}

/** 8.2 — Vstup convertu (`PATCH .../convert`). `userId` → PC, prázdné → NPC. */
export interface ConvertCharacterInput {
  userId?: string;
}

// ── Subdokumenty ──────────────────────────────────────────────────

/** Dynamický blok osobního schématu deníku (stat / bar / list / text / image). */
export interface CustomDiaryBlock {
  id: string;
  type: string;
  label: string;
  description?: string;
  maxValue?: number;
  minValue?: number;
  color?: string;
  options?: string[];
  order: number;
  layoutArea?: string;
  /** D-DIARY-3 — defaultní URL pro `image` blok. Per-postava může override
   *  přes `customData[id]` (uložené jako string URL). */
  imageUrl?: string;
  /** D-DIARY-3 — formula expression (např. `HP_current / HP_max * 100`).
   *  Evaluovaný safe parserem v `DiaryBlockView`. */
  expression?: string;
}

export interface CharacterDiary {
  id: string;
  characterId: string;
  worldId: string;
  sections: PageSection[];
  personalDiarySchema?: CustomDiaryBlock[];
  customData: Record<string, unknown>;
}

/**
 * 9.2c — Fantasy datum. Mirror engine `@/shared/lib/calendarEngine/types`.
 * monthIndex je 0-based.
 */
export interface FantasyDate {
  year: number;
  monthIndex: number;
  day: number;
  hour?: number;
  minute?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  /** 9.2c — slug kalendáře (nullable → world default fallback). */
  calendarConfigId?: string;
  /** 9.2c — refactor ze stringu 'YYYY-MM-DD' na FantasyDate object. */
  start?: FantasyDate;
  end?: FantasyDate;
  allDay?: boolean;
  hourStart?: string;
  hourEnd?: string;
  description?: string;
  /**
   * 9.2-FIX — volný emoji/symbol per event (barva je per entita).
   */
  symbol?: string;
}

export interface CharacterCalendar {
  id: string;
  characterId: string;
  worldId: string;
  color: string;
  displaySettings: {
    defaultView?: 'month' | 'week' | 'day';
    isHiddenInAggregate?: boolean;
  };
  events: CalendarEvent[];
}

export interface FinanceEntry {
  id: string;
  label: string;
  amount: number;
}

/**
 * Spec 8.x-prep §4.4 (B4) — herní datum transakce. Strukturně zrcadlí
 * `FantasyDate` z `@/shared/lib/calendarEngine` (nedefinujeme tu závislost
 * v types souboru kvůli cyklickým importům).
 */
export interface FantasyDateLike {
  year: number;
  monthIndex: number;
  day: number;
  hour?: number;
  minute?: number;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  /**
   * Spec 8.x-prep §4.4 — herní datum transakce. Optional pro backward compat
   * (legacy transakce → render fallbackne na real-world `date`).
   */
  inGameDate?: FantasyDateLike | null;
  delta: number;
  description: string;
  /** 8.6 — Pokud transakce vznikla transferem, drží druhou stranu. */
  transferRef?: {
    counterpartyAccountId: string;
    counterpartyCharacterId: string;
    direction: 'in' | 'out';
  };
  /** 8.6 — User ID, který akci provedl (audit pro shared účty). */
  performedByUserId?: string;
}

/**
 * 8.6 — Finanční účet postavy. Postava může mít 1..20 účtů.
 * Sdílené účty: `ownerCharacterIds.length > 1`.
 */
export interface CharacterAccount {
  id: string;
  worldId: string;
  label: string;
  ownerCharacterIds: string[];
  primaryOwnerId: string;
  accountType: string;
  accessLocation: { type: 'character'; characterId: string } | null;
  currency: string;
  balance: number;
  incomeEntries: FinanceEntry[];
  expenseEntries: FinanceEntry[];
  transactions: FinanceTransaction[];
  notes: string;
  /**
   * Spec 8.x-prep §4.3 (B3) — pokud true, hráč-vlastník smí volat adjust
   * (vklad i výběr). Default false (jen PJ+).
   */
  allowPlayerSelfAdjust?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharacterFinance {
  id: string;
  characterId: string;
  isHidden: boolean;
  accountType: string;
  accessLocation: string;
  currency: string;
  lastSyncDate?: string;
  balance: number;
  entries: FinanceEntry[];
  transactions: FinanceTransaction[];
  /** 8.1-FIR — RichText „Rozepsané" Matrix-style. */
  notes: string;
  /** D-073 — optimistic concurrency token. */
  updatedAt?: string;
}

export interface CharacterInventory {
  id: string;
  characterId: string;
  isHidden: boolean;
  sections: PageSection[];
  /** 8.1-FIR — RichText „Rozepsané" Matrix-style. */
  notes: string;
  /** D-073 — optimistic concurrency token. */
  updatedAt?: string;
}

export interface CharacterNotes {
  id: string;
  characterId: string;
  content: string;
}

/** Query key factory pro postavy a jejich subdokumenty. */
export const charactersQueryKey = {
  all: (worldId: string) => ['characters', worldId] as const,
  directory: (worldId: string) =>
    ['characters', worldId, 'directory'] as const,
  detail: (worldId: string, slug: string) =>
    ['characters', worldId, 'detail', slug] as const,
  subdoc: (worldId: string, slug: string, kind: string) =>
    ['characters', worldId, 'detail', slug, kind] as const,
  // 8.6 — multi-account: per-postava list účtů + per-account detail.
  accountsByCharacter: (worldId: string, slug: string) =>
    ['characters', worldId, 'detail', slug, 'accounts'] as const,
  accountDetail: (worldId: string, accountId: string) =>
    ['accounts', worldId, accountId] as const,
};

/** 8.6 — Klíč pro seznam měn světa (z `world-currencies` modulu). */
export const worldCurrenciesQueryKey = (worldId: string) =>
  ['worlds', worldId, 'currencies'] as const;

export interface WorldCurrencyItem {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export interface WorldCurrencies {
  id: string;
  worldId: string;
  items: WorldCurrencyItem[];
  updatedAt: string;
}
