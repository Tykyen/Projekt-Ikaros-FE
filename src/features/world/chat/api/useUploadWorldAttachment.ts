import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { ChatAttachment } from '@/features/chat/lib/types';

/**
 * Krok 6.2b — upload jedné přílohy světového chatu (`world-chat/{worldId}/`).
 *
 * Zrcadlí `useUploadAttachment` z globálního chatu (fáze 4). Composer volá
 * per soubor až při odeslání zprávy (upload-on-send) — žádné osiřelé soubory
 * z nepoužitého výběru.
 */
export function useUploadWorldAttachment(worldId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<ChatAttachment> => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post<ChatAttachment>(
        `/worlds/${worldId}/chat/upload`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
  });
}
