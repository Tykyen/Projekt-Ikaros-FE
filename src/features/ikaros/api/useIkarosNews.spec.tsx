import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useIkarosNews, useCreateIkarosNews } from './useIkarosNews';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

// S-04 — zachytíme WS event handler i reconnect callback (oba invalidují
// ['ikaros-news']). Testujeme kontrakt „event/reconnect → invalidace".
let newsChangedHandler: (() => void) | undefined;
let newsReconnectCb: (() => void) | undefined;
vi.mock('@/features/chat', () => ({
  useSocketEvent: (event: string, handler: () => void) => {
    if (event === 'ikaros:news:changed') newsChangedHandler = handler;
  },
  useSocketReconnect: (cb: () => void) => {
    newsReconnectCb = cb;
  },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, qc };
}

beforeEach(() => {
  vi.clearAllMocks();
  newsChangedHandler = undefined;
  newsReconnectCb = undefined;
});

describe('useIkarosNews — WS sync (S-04)', () => {
  it('S-04 — reconnect callback invaliduje ikaros-news (broadcast za výpadku je pryč)', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useIkarosNews(), { wrapper: Wrapper });

    expect(newsReconnectCb).toBeDefined();
    newsReconnectCb!();
    expect(spy).toHaveBeenCalledWith({ queryKey: ['ikaros-news'] });
  });

  it('S-04 — ikaros:news:changed handler invaliduje ikaros-news', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useIkarosNews(), { wrapper: Wrapper });

    expect(newsChangedHandler).toBeDefined();
    newsChangedHandler!();
    expect(spy).toHaveBeenCalledWith({ queryKey: ['ikaros-news'] });
  });
});

describe('useIkarosNews', () => {
  it('načte seznam novinek z /IkarosNews', async () => {
    vi.mocked(api.get).mockResolvedValue([
      {
        id: 'n1',
        title: 'Test',
        content: 'Obsah',
        authorId: 'a1',
        authorName: 'Admin',
        createdAtUtc: '2026-05-13T10:00:00Z',
        archived: false,
      },
    ]);
    const { result } = renderHook(() => useIkarosNews(), {
      wrapper: makeWrapper().Wrapper,
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(api.get).toHaveBeenCalledWith('/IkarosNews');
    expect(result.current.data?.[0].title).toBe('Test');
  });

  it('prázdné pole pokud BE vrací prázdný seznam', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { result } = renderHook(() => useIkarosNews(), {
      wrapper: makeWrapper().Wrapper,
    });
    await waitFor(() =>
      expect(result.current.isPlaceholderData).toBe(false),
    );
    expect(result.current.data).toEqual([]);
  });
});

describe('useCreateIkarosNews', () => {
  it('POST /IkarosNews + invalidace ikaros-news cache po úspěchu', async () => {
    const { Wrapper, qc } = makeWrapper();
    qc.setQueryData(['ikaros-news'], [{ id: 'old' }]);
    const spy = vi.spyOn(qc, 'invalidateQueries');

    vi.mocked(api.post).mockResolvedValue({
      id: 'n2',
      title: 'Nová',
      content: 'Obsah',
      authorId: 'a1',
      authorName: 'Admin',
      createdAtUtc: '2026-05-14T10:00:00Z',
      archived: false,
    });

    const { result } = renderHook(() => useCreateIkarosNews(), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync({ title: 'Nová', content: 'Obsah' });

    expect(api.post).toHaveBeenCalledWith('/IkarosNews', {
      title: 'Nová',
      content: 'Obsah',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['ikaros-news'] });
  });
});
