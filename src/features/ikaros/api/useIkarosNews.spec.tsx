import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useIkarosNews, useCreateIkarosNews } from './useIkarosNews';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
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
        isActive: true,
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
      isActive: true,
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
