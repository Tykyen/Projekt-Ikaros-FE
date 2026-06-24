/**
 * 16.1d — Registr skinů chatu. Skin chatu = **motiv světa** (žánr).
 *
 * `data-chat-skin="<themeId>"` na kořeni chatu (`WorldChatRoom .room`).
 * Paleta+font se vlévají scoped přepsáním `--theme-*` (engine `useChatSkin`);
 * ornamenty žijí scoped `[data-chat-skin]` v chat modulech. Identita id =
 * SVĚTOVÉ `ThemeId` (žádný nový namespace). BE kopie whitelistu =
 * `WORLD_THEME_IDS` (`theme-ids.ts`).
 */
import type { ThemeId } from '@/themes/types';
import { getTheme } from '@/themes/registry';

/** 12 světových motivů v pořadí pro selektor. Canonical; BE mirroruje. */
export const CHAT_SKIN_IDS = [
  'ikaros',
  'fantasy',
  'dark-fantasy',
  'vesmir',
  'cyberpunk',
  'steampunk',
  'apokalypsa',
  'horor',
  'mystery',
  'historie',
  'moderni',
  'western',
] as const satisfies readonly ThemeId[];

export type ChatSkinId = (typeof CHAT_SKIN_IDS)[number];

/** Emoji do selektoru (motiv registr emoji nemá). */
const EMOJI: Record<ChatSkinId, string> = {
  ikaros: '🟣',
  fantasy: '⚔️',
  'dark-fantasy': '🩸',
  vesmir: '🛸',
  cyberpunk: '☣️',
  steampunk: '⚙️',
  apokalypsa: '☢️',
  horor: '🕯️',
  mystery: '🌧️',
  historie: '📜',
  moderni: '📰',
  western: '🤠',
};

export interface ChatSkinMeta {
  id: ChatSkinId;
  /** Lidský název ze theme registru (`theme.name`). */
  label: string;
  emoji: string;
}

export const CHAT_SKINS: readonly ChatSkinMeta[] = CHAT_SKIN_IDS.map((id) => ({
  id,
  label: getTheme(id).name,
  emoji: EMOJI[id],
}));

const SKIN_SET = new Set<string>(CHAT_SKIN_IDS);

/** True, pokud `value` je platný skin chatu (světový ThemeId). */
export function isChatSkin(value: string | null | undefined): value is ChatSkinId {
  return !!value && SKIN_SET.has(value);
}
