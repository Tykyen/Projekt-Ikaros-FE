import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import {
  useUpcomingEventsMine,
  useToggleRsvp,
  useAllWorldGameEvents,
  useUpdateGameEvent,
} from './useGameEvents';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
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

// jako makeWrapper, ale vrací i `qc` — pro spy na invalidateQueries (cache regrese)
function makeWrapperWithQc(token: string | null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, token);
  const wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
  return { wrapper, qc };
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

  // C-09 regrese: RSVP toggle musel invalidovat i kalendářní `world-all` seznam
  // (prefix-miss 'world'≠'world-all') A otevřený detail eventu. Bez té invalidace
  // zůstal kalendář/detail stale. Tenhle test zčervená, když fix zmizí.
  it('C-09 — RSVP invaliduje world-all seznam i otevřený detail', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    const { wrapper, qc } = makeWrapperWithQc('token123');
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useToggleRsvp(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('event-1');
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['game-events', 'world-all']);
    expect(keys).toContainEqual(['game-events', 'detail', 'event-1']);
  });
});

describe('useUpdateGameEvent', () => {
  // C-10 regrese: update eventu musel invalidovat i otevřený detail
  // (titul/datum/popis/obrázek), ne jen seznamy.
  it('C-10 — update invaliduje otevřený detail eventu', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: 'event-1' });
    const { wrapper, qc } = makeWrapperWithQc('token123');
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateGameEvent(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'event-1', dto: { title: 'X' } });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['game-events', 'detail', 'event-1']);
  });
});
