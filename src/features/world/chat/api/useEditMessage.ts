import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { ChatAttachment, ChatMessage } from '@/features/chat/lib/types';

/**
 * Krok 6.2c — inline editace zprávy. BE drží guard (vlastník nebo PJ; dice
 * needitovatelné). Po PATCH se WS `chat:message:updated` šíří všem klientům,
 * `ChannelView` listener už umí update cache.
 *
 * D-NEW-chat-edit-attachments — kromě `content` umí i diff příloh
 * (`attachmentsToAdd` = nově nahrané, `attachmentsToRemove` = publicId k odebrání).
 * BE `UpdateMessageDto` + `editMessage` diff logiku už mají.
 */
export function useEditMessage(worldId: string) {
  return useMutation({
    mutationFn: ({
      messageId,
      content,
      attachmentsToAdd,
      attachmentsToRemove,
    }: {
      messageId: string;
      content?: string;
      attachmentsToAdd?: ChatAttachment[];
      attachmentsToRemove?: string[];
    }) =>
      api.patch<ChatMessage>(`/worlds/${worldId}/chat/messages/${messageId}`, {
        content,
        attachmentsToAdd,
        attachmentsToRemove,
      }),
  });
}
