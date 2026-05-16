/**
 * FE typy globálního chatu (Hospoda, krok 4.1).
 * Zrcadlí BE `ChatMessage` — Date pole přicházejí přes JSON jako string.
 */

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
  action: 'join' | 'leave';
}

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
