import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export function useEmailChangeConfirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ ok: true }>('/auth/confirm-email-change', { token }),
    onSuccess: () => {
      // C-30 — invalidace v hooku (přežije unmount) místo na call-site .then().
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}
