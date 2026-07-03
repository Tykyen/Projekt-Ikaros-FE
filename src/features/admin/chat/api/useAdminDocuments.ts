import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { PlatformDocument } from '../lib/types';

const BASE = '/admin-chat/documents';

export const adminDocKeys = {
  list: ['admin-chat', 'documents'] as const,
};

/** Seznam sdílených PDF (nejnovější první). */
export function useAdminDocuments() {
  return useQuery({
    queryKey: adminDocKeys.list,
    queryFn: () => api.get<PlatformDocument[]>(BASE),
  });
}

/** Nahrání PDF (multipart). BE ověří MIME + magic bytes + uloží na Cloudinary. */
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post<PlatformDocument>(BASE, fd);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminDocKeys.list }),
  });
}

/** Přejmenování dokumentu (BE gate: nahravatel nebo superadmin). */
export function useRenameDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      api.patch<PlatformDocument>(`${BASE}/${id}`, { filename }),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminDocKeys.list }),
  });
}

/** Smazání dokumentu (BE gate: nahravatel nebo superadmin). */
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminDocKeys.list }),
  });
}
