/**
 * 16.2c — Registr skinů deníku (vizuální „kabát" nad jedním layoutem).
 *
 * Skin = `data-diary-skin="<id>"` na společném předku deníku
 * (`DiarySystemProvider`). CSS sady žijí v `../styles/diary-skins.css`,
 * tokeny `--mx-*` je přepisují. 7 stylů musí ladit s BE whitelistem
 * (`UpdateMemberThemeDto.diarySkin`): scifi · fantasy · horror · steampunk
 * · nature · minimal · retro.
 *
 * Volba je per uživatel × svět (`WorldMembership.diarySkin`); pokud člen
 * volbu nemá, padá na default dle `world.system` (`resolveDefaultSkin`).
 */

/** ID skinu — sjednocené s BE whitelistem (`update-member.dto.ts`). */
export type DiarySkinId =
  | 'scifi'
  | 'fantasy'
  | 'horror'
  | 'steampunk'
  | 'nature'
  | 'minimal'
  | 'retro'
  | 'anime';

export interface DiarySkinMeta {
  id: DiarySkinId;
  /** Lidský název do selectoru. */
  label: string;
  /** Emoji do selectoru (vizuální zkratka). */
  emoji: string;
}

/** 8 skinů v pořadí pro selector. */
export const DIARY_SKINS: readonly DiarySkinMeta[] = [
  { id: 'scifi', label: 'Sci-fi', emoji: '🛸' },
  { id: 'fantasy', label: 'Fantasy', emoji: '⚔️' },
  { id: 'horror', label: 'Horor', emoji: '🦇' },
  { id: 'steampunk', label: 'Steampunk', emoji: '🕰️' },
  { id: 'nature', label: 'Příroda', emoji: '🌿' },
  { id: 'minimal', label: 'Minimal', emoji: '📜' },
  { id: 'retro', label: 'Retro', emoji: '🎮' },
  { id: 'anime', label: 'MLP', emoji: '🦄' },
] as const;

/** Default = sci-fi (= dnešní HUD), pokud systém nemá vlastní mapování. */
export const DEFAULT_SKIN: DiarySkinId = 'scifi';

/** Set platných ID — pro validaci hodnoty z BE (cizí string → fallback). */
const SKIN_IDS = new Set<string>(DIARY_SKINS.map((s) => s.id));

/** True, pokud `value` je známý skin ID. */
export function isDiarySkin(value: string | null | undefined): value is DiarySkinId {
  return !!value && SKIN_IDS.has(value);
}

/**
 * Výchozí skin dle herního systému světa (`world.system`), když člen nemá
 * vlastní volbu. Klíče jsou canonical `SystemId` (po aliasech v
 * diary-systems/registry). Neznámé → `scifi`.
 */
export const DEFAULT_SKIN_BY_SYSTEM: Record<string, DiarySkinId> = {
  matrix: 'scifi',
  drd16: 'fantasy',
  drdplus: 'fantasy',
  drd2: 'fantasy',
  jad: 'fantasy',
  dnd5e: 'fantasy',
  drdh: 'fantasy', // Dračí hlídka
  pi: 'scifi', // Příběhy impéria — osekaný derivát Matrixu (sci-fi HUD)
  coc: 'horror', // Call of Cthulhu
  gurps: 'scifi',
  fate: 'scifi',
  shadowrun: 'scifi',
  generic: 'minimal', // „vlastní" / custom systém
};

/**
 * Vrátí výchozí skin pro `world.system`. Normalizuje case; neznámý/prázdný
 * systém → `scifi`. (Aliasy `world.system` řeší až caller přes diary
 * registry; sem chodí buď canonical id, nebo libovolný string → default.)
 */
export function resolveDefaultSkin(system: string | null | undefined): DiarySkinId {
  if (!system) return DEFAULT_SKIN;
  return DEFAULT_SKIN_BY_SYSTEM[system.toLowerCase()] ?? DEFAULT_SKIN;
}
