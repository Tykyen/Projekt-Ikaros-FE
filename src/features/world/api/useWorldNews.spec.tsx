import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useWorldNewsList,
  useWorldNewsCount,
  useArchiveWorldNews,
  useUnarchiveWorldNews,
} from './useWorldNews';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('useWorldNewsList', () => {
  it('volá /world-news se scope, limit a offset', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { result } = renderHook(
      () =>
        useWorldNewsList({
          worldId: 'w1',
          scope: 'archived',
          limit: 10,
          offset: 20,
        }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/world-news', {
      params: { worldId: 'w1', scope: 'archived', limit: 10, offset: 20 },
    });
  });
});

describe('useWorldNewsCount', () => {
  it('volá /world-news/count se scope', async () => {
    vi.mocked(api.get).mockResolvedValue({ total: 3 });
    const { result } = renderHook(
      () => useWorldNewsCount('w1', 'active'),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/world-news/count', {
      params: { worldId: 'w1', scope: 'active' },
    });
  });

  it('enabled=false → dotaz se nespustí', async () => {
    const { result } = renderHook(
      () => useWorldNewsCount('w1', 'archived', false),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('useArchiveWorldNews / useUnarchiveWorldNews', () => {
  it('archive volá POST /world-news/:id/archive', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    const { result } = renderHook(() => useArchiveWorldNews('w1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync('n1');
    });
    expect(api.post).toHaveBeenCalledWith('/world-news/n1/archive');
  });

  it('unarchive volá POST /world-news/:id/unarchive', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    const { result } = renderHook(() => useUnarchiveWorldNews('w1'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync('n1');
    });
    expect(api.post).toHaveBeenCalledWith('/world-news/n1/unarchive');
  });
});
