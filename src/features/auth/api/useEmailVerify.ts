import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export function useEmailVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ ok: true }>('/auth/email-verify', { token }),
    onSuccess: () => {
      // Pokud je user přihlášený, refresh /users/me aby se badge přepl na "ověřeno"
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}

export function useEmailVerifyResend() {
  return useMutation({
    mutationFn: () =>
      api.post<{ ok: true }>('/auth/email-verify/resend', {}),
  });
}
