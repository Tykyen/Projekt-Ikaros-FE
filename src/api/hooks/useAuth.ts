import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getDefaultStore, useSetAtom } from 'jotai';
import { api } from '../client';
import {
  accessTokenAtom,
  refreshTokenAtom,
  currentUserAtom,
  pendingLogoutAtom,
} from '../../store/authStore';
import { decodeJwt, isJwtValid } from '../../utils/jwt';
import type {
  AccessTokenPayload,
  AuthResponse,
  LoginRequest,
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
      // Pokud byl spuštěný pending logout, zruš ho — uživatel se přihlásil znovu
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
 * Při startu app: pokud existuje access token, ale `currentUserAtom` je prázdný
 * (např. první volání po reloadu před tím než `atomWithStorage` zhydratoval),
 * dekóduje JWT a doplní základní user data. Nepřepisuje existující záznam.
 *
 * Když je token expirovaný, smaže oba tokeny + user (clean logged-out).
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
      return;
    }

    if (store.get(currentUserAtom) !== null) return;

    const payload = decodeJwt<AccessTokenPayload>(token);
    if (!payload) return;

    const minimalUser: User = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      characterPath: payload.characterPath,
      ikarosSkin: payload.ikarosSkin,
      themeSettings: {},
      chatPreferences: {},
      favoriteDiscussionIds: [],
      isOnline: true,
      lastSeenAt: '',
      displayName: undefined,
      avatarUrl: undefined,
      profileImageUrl: undefined,
      createdAt: '',
      updatedAt: '',
    };
    store.set(currentUserAtom, minimalUser);
  }, []);
}
