import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';

export interface UploadImageResult {
  url: string;
  publicId: string;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadImageResult> => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post<UploadImageResult>(
        '/upload/image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data;
    },
  });
}
