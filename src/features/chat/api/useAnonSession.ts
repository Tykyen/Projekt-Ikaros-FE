import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { api } from '@/shared/api/client';
import { anonSessionAtom, type AnonSession } from '../store/anonSession';

/**
 * Spec 15.8 — získá host (guest) session pro Hospodu: po captcha zavolá
 * `POST /auth/anon-session`, uloží guest token + jméno do `anonSessionAtom`.
 */
export function useAnonSession() {
  const setSession = useSetAtom(anonSessionAtom);
  const mutation = useMutation({
    mutationFn: (captchaToken: string) =>
      api.post<AnonSession>('/auth/anon-session', { captchaToken }),
    onSuccess: (data) => setSession(data),
  });
  return {
    startSession: (captchaToken: string) => mutation.mutateAsync(captchaToken),
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
