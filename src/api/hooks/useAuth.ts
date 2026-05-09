import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDefaultStore, useAtomValue, useSetAtom } from 'jotai';
import { api } from '../client';
import {
  accessTokenAtom,
  refreshTokenAtom,
  currentUserAtom,
  pendingLogoutAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
} from '../../store/authStore';
import { decodeJwt, isJwtValid } from '../../utils/jwt';
import type {
  AccessTokenPayload,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../../types';

const LOGOUT_UNDO_MS = 5000;

export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginRequest) =>
      api.post<AuthResponse>('/auth/login', dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      const store = getDefaultStore();
      store.set(accessTokenAtom, accessToken);
      store.set(refreshTokenAtom, refreshToken);
      store.set(currentUserAtom, user);
      store.set(loginModalOpenAtom, false);
      // Pokud byl spuštěný pending logout, zruš ho — uživatel se přihlásil znovu
      store.set(pendingLogoutAtom, null);
    },
  });
}

/**
 * Registrace — BE auto-loguje (vrací tokeny + user). Po úspěchu zapíše
 * do store a zavře RegisterModal. Navigace na deep-link intent
 * (sessionStorage 'ikaros.loginIntent') se řeší v komponentě, která
 * má přístup k useNavigate.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterRequest) =>
      api.post<AuthResponse>('/auth/register', dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      const store = getDefaultStore();
      store.set(accessTokenAtom, accessToken);
      store.set(refreshTokenAtom, refreshToken);
      store.set(currentUserAtom, user);
      store.set(registerModalOpenAtom, false);
      store.set(pendingLogoutAtom, null);
    },
  });
}

/**
 * Spustí 5s timer pro odhlášení. Vrací cancel funkci pro "Vrátit".
 * Po vypršení timeru:
 *   1) zavolá BE /auth/logout (fire-and-forget — invalidace na serveru)
 *   2) smaže tokeny + currentUser
 */
export function useLogout() {
  const setPendingLogout = useSetAtom(pendingLogoutAtom);

  return function logout(): () => void {
    const store = getDefaultStore();
    setPendingLogout({ startedAt: Date.now() });

    const timerId = window.setTimeout(() => {
      const refreshToken = store.get(refreshTokenAtom);
      if (refreshToken) {
        // Fire-and-forget — BE invalidace, ale FE čistí store i kdyby selhalo
        api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
      store.set(accessTokenAtom, null);
      store.set(refreshTokenAtom, null);
      store.set(currentUserAtom, null);
      store.set(pendingLogoutAtom, null);
    }, LOGOUT_UNDO_MS);

    return function cancel() {
      window.clearTimeout(timerId);
      store.set(pendingLogoutAtom, null);
    };
  };
}

/**
 * Při startu app:
 * - Pokud token chybí → no-op
 * - Pokud token je expirovaný → clean logout (smaže oba tokeny + user)
 * - Pokud token je validní → no-op (plnohodnotnou hydrataci řeší
 *   `useCurrentUserHydration` přes `/users/me`).
 *
 * D-020 (1.3a) — JWT decode dříve psal minimalUser do `currentUserAtom`,
 * ale data z JWT jsou subset `/users/me` (chybí avatar, bio, themeId, …).
 * Optimistic minimal user vedl k UI flashům (placeholder pole → reálná data
 * po 100-300ms). Nyní spoléháme jen na `/me` query — `currentUserAtom`
 * je null až do prvního úspěšného fetchu. Header komponenty mají
 * `if (!user) return null;` ochranu, takže žádná regrese.
 */
export function useAuthBootstrap(): void {
  useEffect(() => {
    const store = getDefaultStore();
    const token = store.get(accessTokenAtom);
    if (!token) return;

    if (!isJwtValid(token)) {
      store.set(accessTokenAtom, null);
      store.set(refreshTokenAtom, null);
      store.set(currentUserAtom, null);
    }
  }, []);
}

/**
 * Plnohodnotná hydratace currentUser z /users/me (1.3a — vyřeší D-005).
 * Volá se v provider tree (např. <App>) — je závislé na QueryClient + access token.
 *
 * Tok:
 * 1. JWT decode v useAuthBootstrap → minimal user (rychlá optimistic UI)
 * 2. /users/me query → plnohodnotná data → přepíše currentUserAtom
 */
export function useCurrentUserHydration(): void {
  const accessToken = useAtomValue(accessTokenAtom);
  const setUser = useSetAtom(currentUserAtom);

  const { data } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get<User>('/users/me'),
    enabled: !!accessToken,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);
}

/**
 * 1.3a — TanStack Query hook pro vlastní profil. Vrací stejný shape jako User.
 * Po mutation (PATCH/avatar upload) se invalidace: queryClient.invalidateQueries(['users', 'me'])
 */
export function useMyProfile() {
  const accessToken = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get<User>('/users/me'),
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}

/**
 * Helper: invalidate /users/me cache. Volá se po každé mutaci profilu.
 */
export function useInvalidateMyProfile() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['users', 'me'] });
}
