import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface ResetPasswordResponse {
  ok: true;
  /** D-037 — true pokud reset současně zrušil pending soft-delete. */
  deletionReactivated?: boolean;
  /** D-034b — info pro modal po loginu o povýšených Pomocných PJ. */
  revertablePromotions?: Array<{
    worldId: string;
    worldName: string;
    worldSlug: string;
    promotedUserId: string;
    promotedUsername: string;
  }>;
}

/**
 * 1.7 — POST /auth/reset-password. Po úspěchu NIKDY auto-login —
 * caller redirectuje na `/?openLogin=1` (bezpečnostní convention).
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (dto: { token: string; newPassword: string }) =>
      api.post<ResetPasswordResponse>('/auth/reset-password', dto),
  });
}
