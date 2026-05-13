import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

/**
 * 1.7 — POST /auth/forgot-password. Vždy 200 (anti-enumeration).
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post<{ ok: true }>('/auth/forgot-password', { email }),
  });
}
