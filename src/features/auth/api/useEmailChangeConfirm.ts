import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export function useEmailChangeConfirm() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ ok: true }>('/auth/email-change-confirm', { token }),
  });
}
