import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { currentUserAtom } from '@/shared/store/authStore';
import type {
  ChangePasswordRequest,
  TotpEnableResponse,
  TotpSetupResponse,
  TrustedDeviceView,
  UpdateUserRequest,
  User,
} from '@/shared/types';

/**
 * 1.3a — Update profilu. PATCH /users/me, response = updated User.
 * Po úspěchu zapíše do query cache i atomu, aby se header okamžitě překreslil.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateUserRequest) =>
      api.patch<User>('/users/me', dto),
    onSuccess: (data) => {
      qc.setQueryData(['users', 'me'], data);
      getDefaultStore().set(currentUserAtom, data);
      toast.success('Profil uložen');
    },
  });
}

/**
 * 1.3a — Změna hesla. PUT /users/password vrací 204.
 * Po úspěchu BE event-driven revokuje refresh tokeny ostatních zařízení.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordRequest) =>
      api.put<void>('/users/password', dto),
    onSuccess: () => {
      toast.success('Heslo změněno. Ostatní zařízení byla odhlášena.');
    },
  });
}

/**
 * 1.3a — Upload uživatelského avataru přes multipart/form-data.
 * Po úspěchu invalidace /users/me cache (header avatar refresh).
 */
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post<User>('/users/me/avatar', fd);
    },
    onSuccess: (data) => {
      qc.setQueryData(['users', 'me'], data);
      getDefaultStore().set(currentUserAtom, data);
      toast.success('Avatar aktualizován');
    },
    onError: (err) => toast.error(`Nahrání selhalo: ${parseApiError(err)}`),
  });
}

export function useDeleteAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<User>('/users/me/avatar'),
    onSuccess: (data) => {
      qc.setQueryData(['users', 'me'], data);
      getDefaultStore().set(currentUserAtom, data);
      toast.success('Avatar odebrán');
    },
    onError: (err) => toast.error(`Smazání selhalo: ${parseApiError(err)}`),
  });
}

/**
 * 1.3a — Upload avataru postavy v Campu.
 */
export function useUploadCharacterAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post<User>('/users/me/character/avatar', fd);
    },
    onSuccess: (data) => {
      qc.setQueryData(['users', 'me'], data);
      getDefaultStore().set(currentUserAtom, data);
      toast.success('Avatar postavy aktualizován');
    },
    onError: (err) => toast.error(`Nahrání selhalo: ${parseApiError(err)}`),
  });
}

export function useDeleteCharacterAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<User>('/users/me/character/avatar'),
    onSuccess: (data) => {
      qc.setQueryData(['users', 'me'], data);
      getDefaultStore().set(currentUserAtom, data);
      toast.success('Avatar postavy odebrán');
    },
    onError: (err) => toast.error(`Smazání selhalo: ${parseApiError(err)}`),
  });
}

// ── 14.1 — 2FA / TOTP + důvěryhodná zařízení ──────────────────────────

/** Spustí setup: vrátí QR + secret; secret se uloží jako pending na BE. */
export function useTotpSetup() {
  return useMutation({
    mutationFn: () => api.post<TotpSetupResponse>('/auth/2fa/setup', {}),
  });
}

/** Ověří kód → aktivuje 2FA, vrátí záložní kódy (jen jednou). */
export function useEnableTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post<TotpEnableResponse>('/auth/2fa/enable', { code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'me'] }),
  });
}

/** Vypne 2FA (re-auth heslem) + revokuje důvěryhodná zařízení. */
export function useDisableTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) =>
      api.post<{ ok: true }>('/auth/2fa/disable', { password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      qc.invalidateQueries({ queryKey: ['trusted-devices'] });
      toast.success('Dvoufaktorové ověření vypnuto.');
    },
  });
}

/** Nová sada záložních kódů (re-auth heslem). */
export function useRegenerateBackupCodes() {
  return useMutation({
    mutationFn: (password: string) =>
      api.post<TotpEnableResponse>('/auth/2fa/backup-codes/regenerate', {
        password,
      }),
  });
}

/** Výpis důvěryhodných zařízení (volej jen když má smysl — `enabled`). */
export function useTrustedDevices(enabled = true) {
  return useQuery({
    queryKey: ['trusted-devices'],
    queryFn: () => api.get<TrustedDeviceView[]>('/auth/2fa/trusted-devices'),
    enabled,
  });
}

/** Odvolat jedno zařízení (id) nebo všechna (id = null). */
export function useRevokeTrustedDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | null) =>
      id
        ? api.delete(`/auth/2fa/trusted-devices/${id}`)
        : api.delete('/auth/2fa/trusted-devices'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trusted-devices'] }),
  });
}
