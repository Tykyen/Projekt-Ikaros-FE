import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useWorld } from './useWorlds';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ api: { get: vi.fn() } }));

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

describe('useWorld — slug vs ObjectId', () => {
  it('ObjectId tvar (24 hex) → GET /worlds/:id', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 'x' } as never);
    renderHook(() => useWorld('69f5154fdb96c18758b1a038'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith(
        '/worlds/69f5154fdb96c18758b1a038',
      ),
    );
  });

  it('slug → GET /worlds/slug/:slug', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 'x' } as never);
    renderHook(() => useWorld('matrix'), { wrapper: makeWrapper() });
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/worlds/slug/matrix'),
    );
  });

  it('prázdný klíč → query disabled (žádné volání)', () => {
    renderHook(() => useWorld(''), { wrapper: makeWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
