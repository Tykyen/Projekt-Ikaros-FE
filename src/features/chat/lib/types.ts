/**
 * FE typy globálního chatu (Hospoda 4.1, Camp 4.2a).
 * Zrcadlí BE `ChatMessage` — Date pole přicházejí přes JSON jako string.
 */
import type { RoomStyle } from './campPlaces';

export type { RoomStyle };

/** Klíč globální chat místnosti — zrcadlí BE `RoomKey`. */
export type RoomKey = 'hospoda' | 'camp-1' | 'camp-2' | 'camp-3';

/** Sdílené prostředí Campu — styl + lokace (z `GET .../environment`). */
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

/**
 * 16.5c — reference na interaktivní mapu poslanou do chatu (odkaz, ne obrázek).
 * FE dopočítá náhled/piny z živé mapy dle viditelnosti příjemce; `title` =
 * fallback snapshot, když mapa zmizí / není dostupná.
 */
export interface ChatMapRef {
  worldMapId: string;
  worldId: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  worldId: string | null;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  /**
   * D-040 — platformový účet odesílatele byl anonymizován (hard cleanup).
   * Renderer použije `<UserAvatar deleted />` + "Smazaný účet" místo
   * původního displayName. `false`/`undefined` = živý autor.
   */
  senderIsDeleted?: boolean;
  /** NPC mód (6.2e) — overrideName se zobrazí místo `senderName`. */
  overrideName?: string;
  overrideAvatarUrl?: string;
  /** 6.2-followup — slug karty (Page) NPC/postavy → klikací jméno v world chatu. */
  overridePageSlug?: string;
  content: string | null;
  /** Hex barva textu (chatColor odesílatele); `null` = výchozí. */
  color: string | null;
  /** Krok 6.2f — per-svět font klíč z `chatFonts.ts`; null = system stack. */
  customFont?: string | null;
  /** Krok 6.2f — klíč velikosti písma (CHAT_FONT_SIZE_KEYS); null = 1×. */
  customFontSize?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  /** Systémová zpráva (příchod/odchod) — FE ji renderuje jako system line. */
  isSystem?: boolean;
  /** 15.8 — zpráva od hosta (anonyma) v Hospodě → odznak „host". */
  isAnonymous?: boolean;
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
  /** 16.5c — poslaná interaktivní mapa (odkaz na WorldMapEntry). */
  mapRef?: ChatMapRef | null;
  /** RP datum ve hře — `YYYY-MM-DD` (krok 6.2d). */
  rpDate?: string;
  /** Hod kostkou (BE detekce regexem nebo `dicePayload`) — needitovatelné (krok 6.2c). */
  isDiceRoll?: boolean;
  /** Krok 6.3d — strukturovaná data hodu kostkou (faces, total, type, ...). */
  dicePayload?: Record<string, unknown> | null;
  /** Krok 6.3e — skin použitý odesílatelem v okamžiku hodu (zafixované). */
  diceSkin?: string | null;
  /** Krok 6.2i — userIds zmíněné v textu (`@username`). */
  mentions?: string[];
  /** Krok 6.2h — idempotentní retry: FE drží UUID v4 přes pending → sent. */
  clientNonce?: string | null;
  /** FE-only marker pro optimistic UI (6.2h); BE pole tuhle hodnotu nezná. */
  _status?: 'pending' | 'failed';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

/** Přítomný uživatel v místnosti — z `GET /global-chat/room-info`. */
export interface ChatUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  /** Postava z profilu — zobrazuje se v Campu místo účtu (4.2d §8). */
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
