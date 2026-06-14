import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useLogin, useLogout, useRegister, useAuthBootstrap } from './useAuth';
import {
  accessTokenAtom,
  refreshTokenAtom,
  currentUserAtom,
  pendingLogoutAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import { api } from '@/shared/api/client';
import { UserRole } from '@/shared/types';

vi.mock('@/shared/api/client', () => ({
  api: {
    post: vi.fn(),
  },
}));

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.fake`;
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const store = getDefaultStore();

beforeEach(() => {
  localStorage.clear();
  store.set(accessTokenAtom, null);
  store.set(refreshTokenAtom, null);
  store.set(currentUserAtom, null);
  store.set(pendingLogoutAtom, null);
  store.set(loginModalOpenAtom, false);
  store.set(registerModalOpenAtom, false);
  vi.clearAllMocks();
});

describe('useLogin', () => {
  it('po úspěchu zapíše tokeny + user do store', async () => {
    const mockUser = { id: '1', username: 'alice', role: UserRole.Ikarus };
    // 1.3c — login response je union; ok varianta má `status: 'ok'`
    vi.mocked(api.post).mockResolvedValueOnce({
      status: 'ok',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: mockUser,
    });

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ identifier: 'alice', password: 'pw' });
    });

    expect(store.get(accessTokenAtom)).toBe('access-1');
    expect(store.get(refreshTokenAtom)).toBe('refresh-1');
    expect(store.get(currentUserAtom)).toEqual(mockUser);
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      identifier: 'alice', password: 'pw',
    });
  });

  it('po úspěchu zruší pending logout (kdyby běžel)', async () => {
    store.set(pendingLogoutAtom, { startedAt: Date.now() });
    vi.mocked(api.post).mockResolvedValueOnce({
      status: 'ok',
      accessToken: 'a', refreshToken: 'r',
      user: { id: '1', username: 'x', role: UserRole.Ikarus },
    });

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ identifier: 'x', password: 'pw' });
    });

    expect(store.get(pendingLogoutAtom)).toBeNull();
  });

  it('při selhání nezapíše tokeny', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('401'));
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ identifier: 'x', password: 'pw' })
        .catch(() => {});
    });
    expect(store.get(accessTokenAtom)).toBeNull();
  });
});

describe('useRegister', () => {
  it('po úspěchu zapíše tokeny + user a zavře RegisterModal', async () => {
    const mockUser = { id: '1', username: 'newbie', role: UserRole.Ikarus };
    vi.mocked(api.post).mockResolvedValueOnce({
      accessToken: 'access-r',
      refreshToken: 'refresh-r',
      user: mockUser,
    });
    store.set(registerModalOpenAtom, true);

    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({
        email: 'newbie@test.io',
        username: 'newbie',
        password: 'pass1234',
      });
    });

    expect(store.get(accessTokenAtom)).toBe('access-r');
    expect(store.get(refreshTokenAtom)).toBe('refresh-r');
    expect(store.get(currentUserAtom)).toEqual(mockUser);
    expect(store.get(registerModalOpenAtom)).toBe(false);
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      email: 'newbie@test.io',
      username: 'newbie',
      password: 'pass1234',
    });
  });

  it('po úspěchu zruší pending logout (kdyby běžel)', async () => {
    store.set(pendingLogoutAtom, { startedAt: Date.now() });
    vi.mocked(api.post).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: '1', username: 'x', role: UserRole.Ikarus },
    });

    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({
        email: 'x@x.com',
        username: 'x',
        password: 'pass1234',
      });
    });

    expect(store.get(pendingLogoutAtom)).toBeNull();
  });

  it('při selhání nezapíše tokeny ani nezavře modal', async () => {
    store.set(registerModalOpenAtom, true);
    vi.mocked(api.post).mockRejectedValueOnce(new Error('409'));
    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          email: 'taken@test.io',
          username: 'newbie',
          password: 'pass1234',
        })
        .catch(() => {});
    });
    expect(store.get(accessTokenAtom)).toBeNull();
    expect(store.get(registerModalOpenAtom)).toBe(true);
  });
});

describe('useLogout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.set(accessTokenAtom, 'access-token');
    store.set(refreshTokenAtom, 'refresh-token');
    store.set(currentUserAtom, {
      id: '1', email: 'a@a.com', username: 'alice', role: UserRole.Ikarus,
      themeSettings: {}, chatPreferences: {}, favoriteDiscussionIds: [],
      isOnline: true, lastSeenAt: '', createdAt: '', updatedAt: '',
      defaultAvatarType: 'male', chatColor: '#FFFFFF', emailVerified: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('nastaví pendingLogoutAtom okamžitě', () => {
    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });
    act(() => { result.current(); });
    expect(store.get(pendingLogoutAtom)).not.toBeNull();
  });

  it('po 5s smaže tokeny + user a zavolá BE /auth/logout', () => {
    vi.mocked(api.post).mockResolvedValue({});
    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });
    act(() => { result.current(); });

    act(() => { vi.advanceTimersByTime(5000); });

    expect(store.get(accessTokenAtom)).toBeNull();
    expect(store.get(refreshTokenAtom)).toBeNull();
    expect(store.get(currentUserAtom)).toBeNull();
    expect(store.get(pendingLogoutAtom)).toBeNull();
    // PC-18: logout bez body (refresh token v httpOnly cookie).
    expect(api.post).toHaveBeenCalledWith('/auth/logout', {});
  });

  it('cancel funkce zruší timer a obnoví UI', () => {
    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });
    let cancel: () => void;
    act(() => { cancel = result.current(); });

    act(() => { cancel!(); });

    expect(store.get(pendingLogoutAtom)).toBeNull();
    expect(store.get(accessTokenAtom)).toBe('access-token');

    // Po vypršení timeru by se nemělo nic stát
    act(() => { vi.advanceTimersByTime(6000); });
    expect(store.get(accessTokenAtom)).toBe('access-token');
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('useAuthBootstrap', () => {
  // D-020: useAuthBootstrap už nezapisuje JWT data do currentUserAtom.
  // Plnohodnotnou hydrataci řeší useCurrentUserHydration přes /users/me.
  // useAuthBootstrap teď řeší pouze: 1) cleanup expirovaného tokenu, 2) no-op když token chybí.

  it('s validním tokenem ponechá currentUser null (čeká se na /me query)', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({
      sub: '42', email: 'b@b.com', username: 'bob', role: UserRole.Ikarus,
      characterPath: 'p', exp,
    });
    store.set(accessTokenAtom, token);

    renderHook(() => useAuthBootstrap());

    // useAuthBootstrap nezapisuje JWT do currentUser
    expect(store.get(currentUserAtom)).toBeNull();
    // Token zůstává nedotčený (expirace nepřišla)
    expect(store.get(accessTokenAtom)).toBe(token);
  });

  it('smaže tokeny pokud je JWT expirovaný', async () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    const token = makeJwt({ sub: '1', exp });
    store.set(accessTokenAtom, token);
    store.set(refreshTokenAtom, 'r');

    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(store.get(accessTokenAtom)).toBeNull();
    });
    expect(store.get(refreshTokenAtom)).toBeNull();
  });

  it('nepřepíše existující currentUser', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({
      sub: '1', email: 'a@a.com', username: 'alice', role: UserRole.Ikarus,
      characterPath: '', exp,
    });
    const existing = {
      id: '1', email: 'a@a.com', username: 'alice', role: UserRole.Ikarus,
      displayName: 'Alice', avatarUrl: 'http://x.com/a.png',
      themeSettings: {}, chatPreferences: {}, favoriteDiscussionIds: [],
      isOnline: true, lastSeenAt: '', createdAt: '', updatedAt: '',
      defaultAvatarType: 'male' as const, chatColor: '#FFFFFF', emailVerified: false,
    };
    store.set(accessTokenAtom, token);
    store.set(currentUserAtom, existing);

    renderHook(() => useAuthBootstrap());

    // Krátká pauza pro useEffect
    await waitFor(() => {
      expect(store.get(currentUserAtom)).toBe(existing);
    });
  });

  it('nedělá nic když není token', async () => {
    renderHook(() => useAuthBootstrap());
    await waitFor(() => {
      expect(store.get(currentUserAtom)).toBeNull();
    });
  });
});
