/**
 * Typy světového chatu (fáze 6). Názvosloví: **kanál** = `ChatGroup`
 * (sbalovací kontejner v sidebaru), **konverzace** = `ChatChannel`
 * (chatovací místnost). Viz `docs/arch/phase-6/spec-6.1.md` §0.
 *
 * Zprávy reuse z fáze 4 — `ChatMessage` / `ChatItem` / `ChatAttachment`.
 */
export type {
  ChatMessage,
  ChatAttachment,
  ChatItem,
} from '@/features/chat/lib/types';

/** Přístupový režim konverzace — zrcadlí BE `ChatChannel.accessMode`. */
export type ChannelAccessMode = 'all' | 'roles' | 'members';

/** Kanál — sbalovací kontejner konverzací v sidebaru (BE `ChatGroup`). */
export interface ChatGroup {
  id: string;
  worldId: string;
  name: string;
  order: number;
  /** Obrázek kanálu (Cloudinary URL) — mini-thumb v hlavičce. */
  imageUrl?: string;
  /** Krok 6.5c — PJ volba barvy: slot `'0'..'11'`. `undefined` = auto (hash z id). */
  color?: string;
  /** Krok 6.5c — PJ ikona: klíč z mapy `GROUP_ICONS`. `undefined` = bez ikony. */
  iconKey?: string;
  /** N-21 — slug navázané světové družiny (auto-kanál); BE pole, FE ho dříve
   *  nedeklaroval → tiše se zahazovalo při destructuringu. `undefined` = ruční. */
  linkedWorldGroup?: string;
}

/** Konverzace — chatovací místnost uvnitř kanálu (BE `ChatChannel`). */
export interface ChatChannel {
  id: string;
  groupId: string | null;
  worldId: string | null;
  name: string;
  isGlobal: boolean;
  accessMode: ChannelAccessMode;
  allowedRoles: number[];
  allowedMemberIds: string[];
  lastMessageAt?: string;
  /** Zkrácený text poslední zprávy — náhled v sidebaru. */
  lastMessagePreview?: string;
  order: number;
  type: string;
  /** Obrázek konverzace (Cloudinary URL) — thumbnail v sidebaru. */
  imageUrl?: string;
}

/** Položka z `GET /worlds/:id/chat/groups` — kanál se svými konverzacemi. */
export interface GroupWithChannels {
  group: ChatGroup;
  channels: ChatChannel[];
}

// ─── 16.1e — combat roster konverzace (type-sync s BE chat-channel.interface) ──

export interface ChatCombatantBase {
  id: string;
  /** Řazení v liště (desc). */
  initiative: number;
  /** V boji (lišta) vs. mimo boj (bench). */
  inCombat: boolean;
  /** U `character` rozlišuje PC/NPC → visibility flag (R3). */
  isNpc?: boolean;
  createdAt: string;
}

/** PC/NPC v rosteru — jen reference; HP/staty žijí v DENÍKU (single source). */
export interface ChatCharacterCombatant extends ChatCombatantBase {
  kind: 'character';
  characterSlug: string;
}

/** Bestie v rosteru — perzistentní instance se snapshotem (nemá deník). */
export interface ChatBestieCombatant extends ChatCombatantBase {
  kind: 'bestie';
  bestieId: string;
  name: string;
  imageUrl?: string;
  systemStats: Record<string, unknown>;
  abilities: { name: string; description: string }[];
  notes: string;
}

export type ChatCombatant = ChatCharacterCombatant | ChatBestieCombatant;

/** Stav boje konverzace (R6) — před `active` jen roster, žádné kolo/pointer. */
export interface ChatCombatState {
  active: boolean;
  round: number;
  currentCombatantId?: string;
}

/** Resolvovaná viditelnost HP per typ (R3) — z GET, hráč ji respektuje. */
export interface ChatCombatConfig {
  showHpPc: boolean;
  showHpNpc: boolean;
  showHpBestie: boolean;
}

/** `GET /worlds/:id/chat/channels/:cid/combatants` — server-filtrovaný dle role. */
export interface ChannelCombatRoster {
  combatants: ChatCombatant[];
  combat: ChatCombatState;
  config: ChatCombatConfig;
}

/** Přítomný uživatel v konverzaci (presence panel, jen PJ+). */
export interface ChannelPresenceUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  /** World role — grupování presence panelu (Vypravěči/Korektoři/Ostatní). */
  worldRole: number;
}

/** WS `chat:presence` — příchod/odchod uživatele v konverzaci. */
export interface ChannelPresenceEvent extends ChannelPresenceUser {
  channelId: string;
  action: 'join' | 'leave';
}

/** Položka z `GET /worlds/:id/chat/unread`. */
export interface ChannelUnread {
  channelId: string;
  count: number;
  /**
   * D-NEW-chat-mention-sidebar-dot (2026-05-21) — počet self-mention zpráv
   * po last-read. Pokud >0, sidebar zobrazí červený dot vedle unread badge.
   */
  mentionCount: number;
}

/** WS `chat:unread` — aktualizace nepřečtených dané konverzace. */
export type ChannelUnreadEvent = ChannelUnread;

/** Výsledek hledání ve zprávách (krok 6.6). */
export interface ChatSearchResult {
  messageId: string;
  channelId: string;
  channelName: string;
  senderName: string;
  /** D-040 — tombstone overlay v search results stejně jako u zpráv v feedu. */
  senderIsDeleted?: boolean;
  content: string;
  createdAt: string;
}
