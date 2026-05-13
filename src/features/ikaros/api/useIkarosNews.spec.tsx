import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useIkarosNews } from './useIkarosNews';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
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
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/IkarosNews');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].title).toBe('Test');
  });

  it('prázdné pole pokud BE vrací prázdný seznam', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { result } = renderHook(() => useIkarosNews(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
