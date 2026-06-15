import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useThemeSync } from './useThemeSync';
import { themeAtom } from './state';
import { currentUserAtom } from '@/shared/store/authStore';
import { api } from '@/shared/api/client';
import type { User } from '@/shared/types';
import type { ThemeId } from './types';

vi.mock('@/shared/api/client', () => ({ api: { patch: vi.fn() } }));

function makeWrapperWithQc() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

const store = getDefaultStore();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // Uživatel přihlášen; bez uloženého theme se outbound sync nespustí na mount.
  store.set(currentUserAtom, { id: 'u1', themeId: 'ikaros' } as unknown as User);
  store.set(themeAtom, 'ikaros' as ThemeId);
});

afterEach(() => {
  vi.useRealTimers();
  store.set(currentUserAtom, null);
});

describe('useThemeSync', () => {
  // C-28 — po úspěšném PATCH /users/me se musí změna `themeId` promítnout i do
  // ['users','me'] cache (ProfileHeader „Globální motiv" + currentUserAtom přes
  // hydration bridge). Dřív raw PATCH bez cache efektu → ProfileHeader držel
  // starý motiv.
  it('C-28 — outbound theme sync promítne themeId do users/me cache', async () => {
    vi.mocked(api.patch).mockResolvedValue({} as never);
    const { wrapper, qc } = makeWrapperWithQc();
    qc.setQueryData<User>(['users', 'me'], {
      id: 'u1',
      themeId: 'ikaros',
    } as unknown as User);

    renderHook(() => useThemeSync(), { wrapper });

    // Změna motivu → outbound effect → debounced PATCH (500ms) → .then(setQueryData).
    await act(async () => {
      store.set(themeAtom, 'fantasy' as ThemeId);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(api.patch).toHaveBeenCalledWith('/users/me', { themeId: 'fantasy' });
    const cached = qc.getQueryData<User>(['users', 'me']);
    expect(cached?.themeId).toBe('fantasy');
  });
});
