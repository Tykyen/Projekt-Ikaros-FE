/**
 * FE typy globálního chatu (Hospoda 4.1, Rozcestí 4.2a).
 * Zrcadlí BE `ChatMessage` — Date pole přicházejí přes JSON jako string.
 */
import type { RoomStyle } from './rozcestiPlaces';

export type { RoomStyle };

/** Klíč globální chat místnosti — zrcadlí BE `RoomKey`. */
export type RoomKey = 'hospoda' | 'rozcesti-1' | 'rozcesti-2' | 'rozcesti-3';

/** Sdílené prostředí Rozcestí — styl + lokace (z `GET .../environment`). */
export interface RoomEnvironment {
  style: RoomStyle;
  placeId: string;
}

/** WS `chat:room:environment` — změna prostředí místnosti. */
export interface EnvironmentEvent extends RoomEnvironment {
  room: RoomKey;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  worldId: string | null;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string | null;
  /** Hex barva textu (chatColor odesílatele); `null` = výchozí. */
  color: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  /** Systémová zpráva (příchod/odchod) — FE ji renderuje jako system line. */
  isSystem?: boolean;
  /** Vyplněno → whisper viditelný jen těmto userId. */
  visibleTo?: string[];
  reactions: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

/** Přítomný uživatel v místnosti — z `GET /global-chat/room-info`. */
export interface ChatUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  /** Postava z profilu — zobrazuje se v Rozcestí místo účtu (4.2d §8). */
  characterName?: string;
  characterAvatarUrl?: string;
}

/** Odpověď `GET /global-chat/room-info`. */
export interface RoomInfo {
  channelId: string;
  users: ChatUser[];
}

/** WS `chat:presence` — příchod/odchod uživatele. */
export interface PresenceEvent {
  userId?: string;
  username: string;
  avatarUrl?: string;
  characterName?: string;
  characterAvatarUrl?: string;
  action: 'join' | 'leave';
  /** Důvod odchodu — `timeout` (60min nečinnost) spustí na FE overlay
   *  auto-odhlášení; `disconnect` (zavření/reload) a `explicit` ne. */
  reason?: 'timeout' | 'disconnect' | 'explicit';
}

/** WS `chat:rooms:presence` / REST `GET /global-chat/rooms/presence` —
 *  počet přítomných pro každou místnost (odznak v navigaci, 4.2c §4). */
export type RoomPresenceCounts = Record<RoomKey, number>;

/** WS `chat:typing` — stav psaní. */
export interface TypingEvent {
  channelId: string;
  characterName: string;
  isTyping: boolean;
}

/** WS `chat:message:deleted`. */
export interface MessageDeletedEvent {
  messageId: string;
  channelId: string;
}

/**
 * Položka ve výpisu chatu — buď reálná zpráva, nebo syntetická systémová
 * hláška (příchod/odchod uživatele), kterou FE skládá z `chat:presence`.
 */
export type ChatItem =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'system'; id: string; text: string; at: string };
