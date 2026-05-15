import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';

export interface UploadContentImageResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * 3.3x — upload obrázku vkládaného do rich-text obsahu (TipTap editor).
 * Endpoint `POST /upload/content-image` je dostupný každému přihlášenému.
 */
export function useUploadContentImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadContentImageResult> => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post<UploadContentImageResult>(
        '/upload/content-image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
  });
}
