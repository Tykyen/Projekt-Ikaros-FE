import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { currentUserAtom } from '@/shared/store/authStore';
import type {
  ChangePasswordRequest,
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
 * 1.3a — Upload avataru postavy v Rozcestí.
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
