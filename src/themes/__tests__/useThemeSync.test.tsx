import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useThemeSync } from '../useThemeSync';
import { themeAtom } from '../state';
import { currentUserAtom } from '../../store/authStore';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({
  api: {
    patch: vi.fn(() => Promise.resolve({})),
  },
  apiClient: {},
  parseApiError: vi.fn(() => 'err'),
}));

function makeWrapper(store = createStore()) {
  return ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>{children}</JotaiProvider>
  );
}

describe('useThemeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call API when user not logged in', () => {
    const store = createStore();
    store.set(themeAtom, 'bila');
    renderHook(() => useThemeSync(), { wrapper: makeWrapper(store) });
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('calls PATCH /users/me when theme changes for logged-in user', async () => {
    const store = createStore();
    store.set(currentUserAtom, { id: '1', username: 'pj', themeId: 'modre-nebe' } as never);
    renderHook(() => useThemeSync(), { wrapper: makeWrapper(store) });

    store.set(themeAtom, 'temna-cerven');

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/me', { themeId: 'temna-cerven' });
    });
  });

  it('silently swallows 404 (BE endpoint missing)', async () => {
    (api.patch as ReturnType<typeof vi.fn>).mockRejectedValueOnce({ response: { status: 404 } });
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createStore();
    store.set(currentUserAtom, { id: '1', username: 'pj' } as never);
    renderHook(() => useThemeSync(), { wrapper: makeWrapper(store) });
    store.set(themeAtom, 'bila');
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});
