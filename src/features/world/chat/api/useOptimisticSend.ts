import { useCallback } from 'react';
import { vypravecEmit } from '@/shared/vypravec/engine/events';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ChatMessage } from '@/features/chat/lib/types';
import type { User } from '@/shared/types';
import { worldChatKeys, type SendWorldMessagePayload } from './useWorldChat';
import type { MembershipAppearance } from './useMembershipAppearance';
import { clientNonce as makeNonce } from '../lib/nonce';

/**
 * Krok 6.2h — optimistic send + idempotentní retry.
 *
 * Discord/Messenger feel: po Enteru zpráva okamžitě v UI (status `pending`).
 * Backend dorazí přes REST response, WS echo přijde paralelně — `ChannelView`
 * `handleMessage` dedupuje dle `clientNonce`. Pokud REST padne, zpráva získá
 * `_status: 'failed'` a inline pruh nabídne „Zkusit znovu / Smazat".
 *
 * Retry posílá stejný `clientNonce` → BE má sparse unique index
 * `(channelId, clientNonce)` a vrátí existující zprávu (idempotence).
 */

export interface OptimisticSendInputs {
  worldId: string;
  channelId: string;
  user: User;
  appearance: MembershipAppearance | undefined;
}

export type OptimisticSendArgs = Omit<
  SendWorldMessagePayload,
  'clientNonce'
>;

export function useOptimisticSend({
  worldId,
  channelId,
  user,
  appearance,
}: OptimisticSendInputs) {
  const qc = useQueryClient();
  const messagesKey = worldChatKeys(worldId).messages(channelId);
  const endpoint = `/worlds/${worldId}/chat/channels/${channelId}/messages`;

  const buildOptimistic = useCallback(
    (nonce: string, payload: OptimisticSendArgs): ChatMessage => {
      const now = new Date().toISOString();
      return {
        id: `local-${nonce}`,
        channelId,
        worldId,
        senderId: user.id,
        senderName: payload.overrideName ?? user.username,
        // Optimistic avatar = globální account avatar (BE pak doplní membership
        // avatar z `WorldMembership.avatarUrl`, který má prioritu).
        senderAvatarUrl: user.avatarUrl,
        overrideName: payload.overrideName,
        overrideAvatarUrl: payload.overrideAvatarUrl,
        overridePageSlug: payload.overridePageSlug,
        content: payload.content ?? null,
        color: payload.color ?? appearance?.chatColor ?? user.chatColor ?? null,
        customFont: payload.customFont ?? appearance?.chatFont ?? null,
        customFontSize:
          payload.customFontSize ?? appearance?.chatFontSize ?? null,
        isEdited: false,
        isDeleted: false,
        visibleTo: payload.visibleTo,
        reactions: {},
        replyToId: payload.replyToId,
        attachments: payload.attachments,
        rpDate: payload.rpDate,
        mentions: [],
        clientNonce: nonce,
        // Krok 6.3 — optimistic dice payload + skin. BE je v REST response
        // potvrdí (případně přepíše `isDiceRoll` dle vlastní derivace).
        isDiceRoll: !!payload.dicePayload,
        dicePayload: payload.dicePayload ?? null,
        diceSkin: payload.diceSkin ?? null,
        _status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
    },
    [channelId, worldId, user, appearance],
  );

  const submit = useCallback(
    async (nonce: string, payload: OptimisticSendArgs): Promise<void> => {
      try {
        const server = await api.post<ChatMessage>(endpoint, {
          ...payload,
          clientNonce: nonce,
        });
        // Vypravěč (spec 26.4): krok „Napiš do svého světa" — jen chat SVĚTA.
        vypravecEmit('message.sent', { worldId, channelKind: 'world' });
        qc.setQueryData<ChatMessage[]>(messagesKey, (old) => {
          const list = old ?? [];
          // Pokud WS echo už dorazilo dříve než POST response, lokální zpráva
          // už byla swapped (nonce match). V tom případě jen zaktualizovat
          // záznam podle id (idempotentní setter).
          if (list.some((m) => m.id === server.id)) {
            return list.map((m) => (m.id === server.id ? server : m));
          }
          // Standardní swap: lokální → server, dedup dle nonce.
          let replaced = false;
          const next = list.map((m) => {
            if (m.clientNonce === nonce) {
              replaced = true;
              return server;
            }
            return m;
          });
          return replaced ? next : [...next, server];
        });
      } catch {
        qc.setQueryData<ChatMessage[]>(messagesKey, (old) =>
          (old ?? []).map((m) =>
            m.clientNonce === nonce ? { ...m, _status: 'failed' } : m,
          ),
        );
      }
    },
    [endpoint, messagesKey, qc, worldId],
  );

  const send = useCallback(
    (payload: OptimisticSendArgs) => {
      const nonce = makeNonce();
      const optimistic = buildOptimistic(nonce, payload);
      qc.setQueryData<ChatMessage[]>(messagesKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      void submit(nonce, payload);
      return nonce;
    },
    [buildOptimistic, messagesKey, qc, submit],
  );

  const retry = useCallback(
    (message: ChatMessage) => {
      if (!message.clientNonce) return;
      // Vrátit zpět na pending + znovu odeslat se stejným nonce.
      qc.setQueryData<ChatMessage[]>(messagesKey, (old) =>
        (old ?? []).map((m) =>
          m.clientNonce === message.clientNonce
            ? { ...m, _status: 'pending' }
            : m,
        ),
      );
      const payload: OptimisticSendArgs = {
        content: message.content ?? undefined,
        color: message.color ?? undefined,
        customFont: message.customFont ?? undefined,
        customFontSize: message.customFontSize ?? undefined,
        attachments: message.attachments,
        replyToId: message.replyToId,
        visibleTo: message.visibleTo,
        overrideName: message.overrideName,
        overrideAvatarUrl: message.overrideAvatarUrl,
        overridePageSlug: message.overridePageSlug,
        rpDate: message.rpDate,
        // FIX-6 — dřív vynechané: retry hodu kostkou/mapy poslal jen holý text
        // (BE by ho přestal detekovat jako `isDiceRoll` / ztratil mapRef odkaz).
        dicePayload: message.dicePayload ?? undefined,
        diceSkin: message.diceSkin ?? undefined,
        mapRef: message.mapRef ?? undefined,
      };
      void submit(message.clientNonce, payload);
    },
    [messagesKey, qc, submit],
  );

  const discard = useCallback(
    (message: ChatMessage) => {
      if (!message.clientNonce) return;
      qc.setQueryData<ChatMessage[]>(messagesKey, (old) =>
        (old ?? []).filter((m) => m.clientNonce !== message.clientNonce),
      );
    },
    [messagesKey, qc],
  );

  return { send, retry, discard };
}
