import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import { toast } from 'sonner';
import { api, parseApiError, parseApiErrorCode } from '@/shared/api/client';
import {
  accessTokenAtom,
  refreshTokenAtom,
  currentUserAtom,
} from '@/shared/store/authStore';

/**
 * 1.3c — preview/plan PJ handoveru (dryRun) nebo finální nastavení (confirm).
 * Volá `POST /users/me/deletion-request` s typing-username payload.
 */

export interface DeletionPromotion {
  worldId: string;
  worldSlug: string;
  worldName: string;
  promotedUserId: string;
  promotedUsername: string;
  promotedMembershipId: string;
}

export interface DeletionBlocking {
  worldId: string;
  worldSlug: string;
  worldName: string;
}

export interface DeletionPreview {
  promotions: DeletionPromotion[];
  blocking: DeletionBlocking[];
}

export interface DeletionState {
  deletionRequestedAt: string;
  scheduledHardDeleteAt: string;
  deletionReason: string | null;
}

export interface DeletionResponse {
  preview: DeletionPreview;
  state: DeletionState | null;
}

interface RequestSelfDeletionArgs {
  confirmUsername: string;
  dryRun?: boolean;
}

/**
 * 1.3c — naplánovat smazání vlastního účtu.
 * - dryRun=true: jen preview PJ handoveru (FE pre-confirm krok)
 * - dryRun=false: finální nastavení deletionRequestedAt + auto-logout
 *
 * Po úspěšném dryRun=false BE revokoval refresh tokeny — interceptor 401
 * DELETION_PENDING další request hodí. Pro čistý UX FE explicitně vyčistí
 * session atomy a redirektne na home s flagem.
 */
export function useRequestSelfDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ confirmUsername, dryRun }: RequestSelfDeletionArgs) =>
      api.post<DeletionResponse>(
        `/users/me/deletion-request${dryRun ? '?dryRun=true' : ''}`,
        { confirmUsername },
      ),
    onSuccess: (_data, variables) => {
      if (variables.dryRun) return; // preview only, žádný side effect
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      // Auto-logout: BE revokoval refresh tokeny → my vyklidíme session.
      const store = getDefaultStore();
      store.set(accessTokenAtom, null);
      store.set(refreshTokenAtom, null);
      store.set(currentUserAtom, null);
      toast.success(
        'Účet je naplánovaný na smazání. Můžeš se vrátit jediným loginem do 30 dnů.',
      );
    },
    onError: (err) => {
      // SOLE_PJ_BLOCK má specifickou strukturu — caller (modal) ji zachytí přes
      // parseApiErrorCode a zobrazí seznam blokujících světů. Tady jen toast jako fallback.
      const code = parseApiErrorCode(err);
      if (code !== 'SOLE_PJ_BLOCK') {
        toast.error(parseApiError(err));
      }
    },
  });
}

/**
 * 1.3c — reaktivace přes login flow.
 * FE volá z ReactivateAccountModal po deletion_pending response z `/auth/login`.
 */
export function useReactivateDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: { identifier: string; password: string }) =>
      api.post<{
        status: 'ok';
        accessToken: string;
        refreshToken: string;
        user: import('@/shared/types').User;
      }>('/auth/reactivate-deletion', creds),
    onSuccess: (response) => {
      const store = getDefaultStore();
      store.set(accessTokenAtom, response.accessToken);
      store.set(refreshTokenAtom, response.refreshToken);
      store.set(currentUserAtom, response.user);
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Účet obnoven, vítej zpět');
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}

/**
 * 1.3c — info endpoint o vlastním pending soft-delete (běžně se nepoužije,
 * `useMyProfile` (`/users/me`) vrací totéž inline, ale endpoint poskytujeme
 * pro hluboké linky / specifický polling).
 */
export function useMyDeletionRequest(enabled = true) {
  return {
    fetch: () => api.get<DeletionState | null>('/users/me/deletion-request'),
    enabled,
  };
}
