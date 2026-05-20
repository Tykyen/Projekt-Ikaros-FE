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
}

/** WS `chat:unread` — aktualizace nepřečtených dané konverzace. */
export type ChannelUnreadEvent = ChannelUnread;

/** Výsledek hledání ve zprávách (krok 6.6). */
export interface ChatSearchResult {
  messageId: string;
  channelId: string;
  channelName: string;
  senderName: string;
  content: string;
  createdAt: string;
}
