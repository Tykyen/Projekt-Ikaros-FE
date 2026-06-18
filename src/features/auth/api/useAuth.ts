import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDefaultStore, useAtomValue, useSetAtom } from 'jotai';
import { api } from '@/shared/api/client';
import {
  accessTokenAtom,
  refreshTokenAtom,
  currentUserAtom,
  pendingLogoutAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import { isJwtValid } from '@/shared/lib/jwt';
import type {
  AuthResponse,
  LoginRequest,
  LoginResponse,
  LoginTotpRequest,
  RegisterRequest,
  User,
} from '@/shared/types';

const LOGOUT_UNDO_MS = 5000;

/**
 * 1.3c — login vrací union `LoginResponse`:
 *   - { status: 'ok', accessToken, refreshToken, user }  → standardní login
 *   - { status: 'deletion_pending', ...}                  → soft-delete hold, FE
 *     otevře ReactivateAccountModal pro reaktivaci s credentials.
 *
 * onSuccess zapisuje tokeny jen v "ok" case. Caller (LoginModal) musí switchovat
 * dle `result.status` před navigací / toast.
 */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: LoginRequest) =>
      api.post<LoginResponse>('/auth/login', dto),
    onSuccess: (result) => {
      if (result.status !== 'ok') return; // deletion_pending řeší caller
      const store = getDefaultStore();
      // C-29 — vyčisti RQ cache PŘED nasazením nové identity, ať se neobjeví
      // data předchozího uživatele (account switch ve stejném tabu bez reloadu).
      qc.clear();
      store.set(accessTokenAtom, result.accessToken);
      store.set(refreshTokenAtom, result.refreshToken);
      store.set(currentUserAtom, result.user);
      store.set(loginModalOpenAtom, false);
      // Pokud byl spuštěný pending logout, zruš ho — uživatel se přihlásil znovu
      store.set(pendingLogoutAtom, null);
    },
  });
}

/**
 * 14.1 — dokončení loginu druhým faktorem. Stejné nasazení tokenů jako useLogin
 * (po úspěchu), jen volá /auth/login/totp s challengeId + kódem.
 */
export function useLoginTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: LoginTotpRequest) =>
      api.post<LoginResponse>('/auth/login/totp', dto),
    onSuccess: (result) => {
      if (result.status !== 'ok') return;
      const store = getDefaultStore();
      qc.clear();
      store.set(accessTokenAtom, result.accessToken);
      store.set(refreshTokenAtom, result.refreshToken);
      store.set(currentUserAtom, result.user);
      store.set(loginModalOpenAtom, false);
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterRequest) =>
      api.post<AuthResponse>('/auth/register', dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      const store = getDefaultStore();
      qc.clear(); // C-29 — čistá cache pro nově registrovaného uživatele.
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
  const qc = useQueryClient();

  return function logout(): () => void {
    const store = getDefaultStore();
    setPendingLogout({ startedAt: Date.now() });

    const timerId = window.setTimeout(() => {
      // PC-18: refresh token v httpOnly cookie → logout bez body (cookie se pošle).
      // Fire-and-forget — BE invalidace + clear cookie, FE čistí store i kdyby selhalo.
      api.post('/auth/logout', {}).catch(() => {});
      store.set(accessTokenAtom, null);
      store.set(refreshTokenAtom, null);
      store.set(currentUserAtom, null);
      store.set(pendingLogoutAtom, null);
      // C-29 — vyčisti RQ cache (jinak osobní data přežijí pro dalšího uživatele).
      qc.clear();
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
