import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import {
  useUpcomingEventsMine,
  useToggleRsvp,
  useAllWorldGameEvents,
} from './useGameEvents';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

function makeWrapper(token: string | null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, token);
  return ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUpcomingEventsMine', () => {
  it('zavolá /game-events/upcoming/mine s default limit 5', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { result } = renderHook(() => useUpcomingEventsMine(), {
      wrapper: makeWrapper('token123'),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/game-events/upcoming/mine?limit=5',
    );
  });

  it('respektuje custom limit', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { result } = renderHook(() => useUpcomingEventsMine({ limit: 10 }), {
      wrapper: makeWrapper('token123'),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/game-events/upcoming/mine?limit=10',
    );
  });

  it('není enabled bez tokenu', async () => {
    const { result } = renderHook(() => useUpcomingEventsMine(), {
      wrapper: makeWrapper(null),
    });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('useAllWorldGameEvents', () => {
  it('volá /game-events bez fromDate (i minulé akce), limit 500', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { result } = renderHook(() => useAllWorldGameEvents('w1'), {
      wrapper: makeWrapper('token123'),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/game-events?worldId=w1&limit=500',
    );
  });

  it('není enabled bez tokenu', async () => {
    const { result } = renderHook(() => useAllWorldGameEvents('w1'), {
      wrapper: makeWrapper(null),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('useToggleRsvp', () => {
  it('zavolá POST /game-events/:id/confirm', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { result } = renderHook(() => useToggleRsvp(), {
      wrapper: makeWrapper('token123'),
    });
    await act(async () => {
      await result.current.mutateAsync('event-1');
    });
    expect(api.post).toHaveBeenCalledWith('/game-events/event-1/confirm');
  });
});
