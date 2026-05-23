import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export interface UploadImageResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Univerzální upload obrázku přes `POST /upload/content-image`.
 * Endpoint je dostupný každému přihlášenému; výsledek = URL na CDN + metadata.
 *
 * Historicky `features/ikaros/api/useUploadContentImage`. Přesunuto do
 * `shared/api` v rámci 8.4 (D-NPC-1) — používá ho 12+ konzumentů napříč
 * `features/world` i `features/ikaros`; závislost `world → ikaros` byla
 * špatným směrem.
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadImageResult> => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post<UploadImageResult>(
        '/upload/content-image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
  });
}
