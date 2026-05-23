import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFavoriteCharacters } from '../useFavoriteCharacters';

// ── User mock ─────────────────────────────────────────────────────
let mockUserId: string | null = 'user-1';
vi.mock('@/shared/store/authStore', () => ({
  currentUserAtom: { debugLabel: 'currentUserAtom' },
  accessTokenAtom: { debugLabel: 'accessTokenAtom' },
}));
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jotai')>();
  return {
    ...actual,
    useAtomValue: () => (mockUserId ? { id: mockUserId } : null),
  };
});

// ── useMyProfile mock — řídíme co BE „vrátí" ──────────────────────
const mockProfile = vi.fn();
vi.mock('@/features/auth/api/useAuth', () => ({
  useMyProfile: () => mockProfile(),
}));

// ── api client mock — sledujeme PUT volání ────────────────────────
const putMock = vi.fn().mockResolvedValue({ favoriteCharacters: {} });
vi.mock('@/shared/api/client', () => ({
  api: {
    put: (...args: unknown[]) => putMock(...args),
  },
}));

function legacyKey(worldId: string, userId: string): string {
  return `ikaros.world.${worldId}.favCharacters.${userId}`;
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  mockUserId = 'user-1';
  putMock.mockClear();
  putMock.mockResolvedValue({ favoriteCharacters: {} });
});

describe('useFavoriteCharacters (8.3 / D-074, BE-backed)', () => {
  it('čte oblíbené ze serverového profilu', () => {
    mockProfile.mockReturnValue({
      data: {
        id: 'user-1',
        favoriteCharacters: { w1: ['frodo', 'samvis'] },
      },
    });
    const { result } = renderHook(() => useFavoriteCharacters('w1'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isFavorite('frodo')).toBe(true);
    expect(result.current.isFavorite('samvis')).toBe(true);
    expect(result.current.isFavorite('drak')).toBe(false);
  });

  it('toggle volá PUT s novou listou (replace-all)', async () => {
    mockProfile.mockReturnValue({
      data: { id: 'user-1', favoriteCharacters: { w1: ['frodo'] } },
    });
    const { result } = renderHook(() => useFavoriteCharacters('w1'), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.toggle('samvis'));
    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith(
        '/users/me/favorite-characters/w1',
        { slugs: ['frodo', 'samvis'] },
      );
    });
  });

  it('toggle odebrání → PUT bez slugu', async () => {
    mockProfile.mockReturnValue({
      data: { id: 'user-1', favoriteCharacters: { w1: ['frodo', 'samvis'] } },
    });
    const { result } = renderHook(() => useFavoriteCharacters('w1'), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.toggle('frodo'));
    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith(
        '/users/me/favorite-characters/w1',
        { slugs: ['samvis'] },
      );
    });
  });

  it('bez přihlášeného uživatele toggle nic nedělá', () => {
    mockUserId = null;
    mockProfile.mockReturnValue({ data: null });
    const { result } = renderHook(() => useFavoriteCharacters('w1'), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.toggle('frodo'));
    expect(putMock).not.toHaveBeenCalled();
  });

  it('migrace — localStorage non-empty + BE empty → push + clear localStorage', async () => {
    localStorage.setItem(legacyKey('w1', 'user-1'), JSON.stringify(['legacy-frodo']));
    mockProfile.mockReturnValue({
      data: { id: 'user-1', favoriteCharacters: {} },
    });
    renderHook(() => useFavoriteCharacters('w1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith(
        '/users/me/favorite-characters/w1',
        { slugs: ['legacy-frodo'] },
      );
    });
    expect(localStorage.getItem(legacyKey('w1', 'user-1'))).toBeNull();
  });

  it('migrace — BE non-empty → localStorage se jen vyčistí, žádný push', async () => {
    localStorage.setItem(legacyKey('w1', 'user-1'), JSON.stringify(['legacy']));
    mockProfile.mockReturnValue({
      data: { id: 'user-1', favoriteCharacters: { w1: ['existing'] } },
    });
    renderHook(() => useFavoriteCharacters('w1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => {
      expect(localStorage.getItem(legacyKey('w1', 'user-1'))).toBeNull();
    });
    expect(putMock).not.toHaveBeenCalled();
  });
});
