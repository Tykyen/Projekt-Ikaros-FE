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

/**
 * Příloha zprávy (krok 4.3b) — soubor nahraný na Cloudinary přes
 * `POST /global-chat/upload`. Chat povoluje jen obrázky a dokumenty;
 * BE `ChatAttachment` zná navíc `'video'`, to ale chat nikdy neuloží.
 */
export interface ChatAttachment {
  url: string;
  publicId: string;
  type: 'image' | 'document';
  mimeType: string;
  filename: string;
  size: number;
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
  /** Emoji → pole `userId`, kteří reagovali (krok 4.3a). */
  reactions: Record<string, string[]>;
  /** Reply (krok 4.3a) — ID, úryvek a jméno autora citované zprávy. */
  replyToId?: string;
  replyToPreview?: string;
  replyToSenderName?: string;
  /** Přílohy zprávy — obrázky / dokumenty (krok 4.3b). */
  attachments?: ChatAttachment[];
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

/** WS `chat:message:reaction` — změna emoji reakcí zprávy (krok 4.3a). */
export interface ReactionEvent {
  messageId: string;
  channelId: string;
  reactions: Record<string, string[]>;
}

/**
 * Položka ve výpisu chatu — buď reálná zpráva, nebo syntetická systémová
 * hláška (příchod/odchod uživatele), kterou FE skládá z `chat:presence`.
 */
export type ChatItem =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'system'; id: string; text: string; at: string };
