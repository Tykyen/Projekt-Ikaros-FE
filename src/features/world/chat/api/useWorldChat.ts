import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useSocketEvent, useSocketReconnect } from '@/features/chat/api/useSocket';
import type {
  ChatMessage,
  ChatAttachment,
  ChatMapRef,
} from '@/features/chat/lib/types';
import type {
  GroupWithChannels,
  ChannelUnread,
  ChatSearchResult,
} from '../lib/types';

/** Počet zpráv načtených z historie při otevření konverzace. */
export const HISTORY_LIMIT = 50;

const base = (worldId: string) => `/worlds/${worldId}/chat`;

/** 11.2-ext F — naplánovaná zpráva do chatu (cron ji odešle v `sendAt`). */
export interface ScheduleMessagePayload {
  channelId: string;
  content?: string;
  attachments?: ChatAttachment[];
  /** ISO datetime v budoucnosti. */
  sendAt: string;
}

export function useScheduleMessage(worldId: string) {
  return useMutation({
    mutationFn: (dto: ScheduleMessagePayload) =>
      api.post(`${base(worldId)}/scheduled`, dto),
  });
}

/** Query klíče světového chatu — sdílené s WS cache mutacemi. */
export const worldChatKeys = (worldId: string) =>
  ({
    groups: ['world-chat', worldId, 'groups'] as const,
    unread: ['world-chat', worldId, 'unread'] as const,
    messages: (channelId: string) =>
      ['world-chat', worldId, 'messages', channelId] as const,
  }) as const;

/** Kanály světa s vnořenými konverzacemi (BE filtruje dle přístupu). */
export function useChatGroups(worldId: string) {
  return useQuery({
    queryKey: worldChatKeys(worldId).groups,
    queryFn: () => api.get<GroupWithChannels[]>(`${base(worldId)}/groups`),
    enabled: !!worldId,
  });
}

/** Historie zpráv konverzace (posledních 50) — seed, dál přes WS. */
export function useChannelMessages(
  worldId: string,
  channelId: string | null,
) {
  return useQuery({
    queryKey: worldChatKeys(worldId).messages(channelId ?? ''),
    queryFn: () =>
      api.get<ChatMessage[]>(
        `${base(worldId)}/channels/${channelId}/messages`,
        { limit: HISTORY_LIMIT },
      ),
    enabled: !!worldId && !!channelId,
  });
}

export interface SendWorldMessagePayload {
  content?: string;
  /** Hex barva textu — `null`/`undefined` → BE doplní z membership.chatColor. */
  color?: string;
  /** Klíč fontu (whitelist `chatFonts.ts`); BE fallback membership.chatFont. */
  customFont?: string;
  /** Klíč velikosti písma (CHAT_FONT_SIZE_KEYS); BE fallback membership.chatFontSize. */
  customFontSize?: string;
  attachments?: ChatAttachment[];
  /** 16.5c — poslaná interaktivní mapa (odkaz na WorldMapEntry). */
  mapRef?: ChatMapRef;
  /** Reply (6.2a) — ID citované zprávy. */
  replyToId?: string;
  /** Whisper (6.2a) — pole userIds (BE doplní odesílatele). */
  visibleTo?: string[];
  /** NPC mód (6.2e) — jen PJ+; BE validuje canManageChat. */
  overrideName?: string;
  overrideAvatarUrl?: string;
  /** 6.2-followup — slug karty vybrané z adresáře (klikací jméno v chatu). */
  overridePageSlug?: string;
  /** RP datum (6.2d) — `YYYY-MM-DD`. */
  rpDate?: string;
  /** Idempotentní retry (6.2h) — UUID v4 z FE. */
  clientNonce?: string;
  /** Krok 6.3d — strukturovaná data hodu kostkou; pokud existuje, BE označí `isDiceRoll: true`. */
  dicePayload?: Record<string, unknown>;
  /** Krok 6.3e — skin použitý odesílatelem (zafixovaný do zprávy). */
  diceSkin?: string;
}

/** Odeslání zprávy do konverzace. Vykreslí se až přes WS echo. */
export function useSendMessage(worldId: string, channelId: string) {
  return useMutation({
    mutationFn: (dto: SendWorldMessagePayload) =>
      api.post<ChatMessage>(
        `${base(worldId)}/channels/${channelId}/messages`,
        dto,
      ),
  });
}

/** Smazání zprávy (PJ/Admin). Propsání všem přes WS `chat:message:deleted`. */
export function useDeleteMessage(worldId: string) {
  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`${base(worldId)}/messages/${messageId}`),
  });
}

/** Označí konverzaci jako přečtenou — vynuluje unread. */
export function useMarkRead(worldId: string) {
  return useMutation({
    mutationFn: (channelId: string) =>
      api.post(`${base(worldId)}/channels/${channelId}/read`, {}),
  });
}

/** Nepřečtené počty per konverzace — seed, dál přes WS `chat:unread`. */
export function useUnread(worldId: string) {
  return useQuery({
    queryKey: worldChatKeys(worldId).unread,
    queryFn: () => api.get<ChannelUnread[]>(`${base(worldId)}/unread`),
    enabled: !!worldId,
  });
}

/**
 * Hledání ve zprávách světa (krok 6.6) — substring v `content` napříč
 * konverzacemi, kam uživatel vidí; volitelně zúženo na jednu konverzaci.
 * Spustí se až od 2 znaků dotazu.
 */
export function useSearchMessages(
  worldId: string,
  query: string,
  channelId: string | null,
) {
  const q = query.trim();
  return useQuery({
    queryKey: ['world-chat', worldId, 'search', q, channelId ?? ''],
    queryFn: () =>
      api.get<ChatSearchResult[]>(`${base(worldId)}/search`, {
        q,
        ...(channelId ? { channelId } : {}),
      }),
    enabled: !!worldId && q.length >= 2,
  });
}

/**
 * Pure reducer pro `chat:unread` WS event. Aplikuje event na seznam unread
 * z React Query cache a vrátí nový seznam.
 *
 * BE konvence countu:
 *   - `>= 0` — absolutní hodnota (markRead → 0, plný recount).
 *   - `-1`   — sentinel „nová cizí zpráva" → FE inkrementuje o 1. BE tím
 *              šetří DB volání (jinak by per-recipient počítal countAfter).
 *
 * `activeChannelId` — konverzace, kterou uživatel právě sleduje; pro ni
 * vždy vynutí count: 0 (klient ví líp než BE, co je focus).
 */
export function applyUnreadEvent(
  list: ChannelUnread[],
  event: ChannelUnread,
  activeChannelId?: string | null,
): ChannelUnread[] {
  const i = list.findIndex((u) => u.channelId === event.channelId);
  const prevCount = i === -1 ? 0 : list[i].count;
  const prevMention = i === -1 ? 0 : (list[i].mentionCount ?? 0);
  const isIncrement = event.count === -1;
  const nextCount =
    event.channelId === activeChannelId
      ? 0
      : isIncrement
        ? prevCount + 1
        : event.count;
  // D-NEW-chat-mention-sidebar-dot (2026-05-21) — mention count se nuluje při
  // aktivní konverzaci stejně jako unread. Increment events nemají info o mention
  // (BE emit jen `count: -1`), takže ponecháme prev hodnotu — server v dalším
  // refetch / snapshot poslat aktualizovanou.
  const nextMention =
    event.channelId === activeChannelId
      ? 0
      : isIncrement
        ? prevMention
        : (event.mentionCount ?? 0);
  const normalized: ChannelUnread = {
    channelId: event.channelId,
    count: nextCount,
    mentionCount: nextMention,
  };
  if (i === -1) return [...list, normalized];
  const next = [...list];
  next[i] = normalized;
  return next;
}

/**
 * Živá synchronizace unread cache přes WS `chat:unread`. Volá se kdekoli,
 * kde se zobrazují unread počty (chat sám i dashboard dlaždice) — sdílená
 * React Query cache → jeden zdroj pravdy.
 */
export function useUnreadSync(
  worldId: string,
  activeChannelId?: string | null,
): void {
  const qc = useQueryClient();
  useSocketEvent<ChannelUnread>('chat:unread', (e) => {
    qc.setQueryData<ChannelUnread[]>(
      worldChatKeys(worldId).unread,
      (old) => applyUnreadEvent(old ?? [], e, activeChannelId),
    );
  });
  // C-07 — po reconnectu refetch unread seed (WS mohl během výpadku zmeškat eventy).
  useSocketReconnect(() => {
    void qc.invalidateQueries({ queryKey: worldChatKeys(worldId).unread });
  });
}
