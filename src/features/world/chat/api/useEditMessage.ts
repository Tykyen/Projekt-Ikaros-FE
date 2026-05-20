import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ChatMessage } from '@/features/chat/lib/types';

/**
 * Krok 6.2c — inline editace zprávy. BE drží guard (vlastník nebo PJ; dice
 * needitovatelné). Po PATCH se WS `chat:message:updated` šíří všem klientům,
 * `ChannelView` listener už umí update cache.
 */
export function useEditMessage(worldId: string) {
  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) =>
      api.patch<ChatMessage>(
        `/worlds/${worldId}/chat/messages/${messageId}`,
        { content },
      ),
  });
}
