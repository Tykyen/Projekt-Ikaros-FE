import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ChatMessage } from '@/features/chat/lib/types';

/**
 * Krok 6.2a — toggle emoji reakce na zprávě světového chatu.
 *
 * Na rozdíl od globálního chatu (WS `chat:reaction:toggle`) tady jde o REST
 * `PUT .../reactions/:emoji` (BE persistuje v Mongu). Odpověď je celá
 * aktualizovaná zpráva; BE navíc emituje `chat.message.updated` → ostatní
 * klienti se aktualizují přes WS listener v `ChannelView`.
 */
export function useToggleReaction(worldId: string) {
  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) =>
      api.put<ChatMessage>(
        `/worlds/${worldId}/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      ),
  });
}
