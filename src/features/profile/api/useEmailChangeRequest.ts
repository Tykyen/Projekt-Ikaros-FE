import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface EmailChangeRequestResponse {
  ok: true;
  sentTo: string; // maskovaný nový e-mail (např. n***@example.com)
}

export function useEmailChangeRequest() {
  return useMutation({
    mutationFn: (dto: { newEmail: string; currentPassword: string }) =>
      api.post<EmailChangeRequestResponse>(
        '/users/me/email-change-request',
        dto,
      ),
  });
}
