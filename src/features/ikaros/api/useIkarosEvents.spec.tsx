import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import {
  useIkarosEvents,
  useUpcomingIkarosEvents,
  useCreateIkarosEvent,
  useToggleIkarosEventRsvp,
} from './useIkarosEvents';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

function makeWrapper(token: string | null = 'token-x') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, token);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
  return { Wrapper, qc };
}

const mockEvent = {
  id: 'evt1',
  title: 'Komunitní setkání',
  date: '2026-06-01T18:00:00Z',
  description: 'Sejdeme se',
  imageUrl: null,
  confirmable: true,
  confirmedCount: 0,
  confirmedBy: [],
  myRsvp: 'none' as const,
  authorId: 'a1',
  authorName: 'Admin',
  createdAtUtc: '2026-05-14T10:00:00Z',
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useIkarosEvents', () => {
  it('JWT-gated — bez tokenu nezavolá API', async () => {
    const { Wrapper } = makeWrapper(null);
    renderHook(() => useIkarosEvents(), { wrapper: Wrapper });
    await new Promise((r) => setTimeout(r, 30));
    expect(api.get).not.toHaveBeenCalled();
  });

  it('načte seznam akcí z /ikaros-events', async () => {
    vi.mocked(api.get).mockResolvedValue([mockEvent]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useIkarosEvents(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(api.get).toHaveBeenCalledWith('/ikaros-events');
  });
});

describe('useUpcomingIkarosEvents', () => {
  it('volá /upcoming s limit param', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { Wrapper } = makeWrapper();
    renderHook(() => useUpcomingIkarosEvents(5), { wrapper: Wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(api.get).toHaveBeenCalledWith('/ikaros-events/upcoming?limit=5');
  });

  it('placeholderData = [] hned (žádný skeleton)', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpcomingIkarosEvents(3), {
      wrapper: Wrapper,
    });
    expect(result.current.data).toEqual([]);
  });
});

describe('useCreateIkarosEvent', () => {
  it('POST /ikaros-events + invalidate cache', async () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    vi.mocked(api.post).mockResolvedValue(mockEvent);

    const { result } = renderHook(() => useCreateIkarosEvent(), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync({
      title: 'Test',
      date: '2026-06-01T18:00',
    });

    expect(api.post).toHaveBeenCalledWith('/ikaros-events', {
      title: 'Test',
      date: '2026-06-01T18:00',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['ikaros-events'] });
  });
});

describe('useToggleIkarosEventRsvp', () => {
  it('POST /ikaros-events/:id/confirm + invalidate', async () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    vi.mocked(api.post).mockResolvedValue(mockEvent);

    const { result } = renderHook(() => useToggleIkarosEventRsvp(), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync('evt1');

    expect(api.post).toHaveBeenCalledWith('/ikaros-events/evt1/confirm');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['ikaros-events'] });
  });
});
