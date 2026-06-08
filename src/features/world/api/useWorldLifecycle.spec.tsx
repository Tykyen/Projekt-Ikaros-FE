import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useDeleteWorld,
  useDeletedWorlds,
  useRestoreWorld,
} from './useWorldLifecycle';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
vi.mock('jotai', async () => {
  const actual = await vi.importActual('jotai');
  return { ...actual, useAtomValue: () => 'token' };
});

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('useDeleteWorld', () => {
  it('volá DELETE /worlds/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ message: 'ok' });
    const { result } = renderHook(() => useDeleteWorld(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync('w1');
    });
    expect(api.delete).toHaveBeenCalledWith('/worlds/w1');
  });
});

describe('useDeletedWorlds', () => {
  it('volá GET /worlds/deleted', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { result } = renderHook(() => useDeletedWorlds(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/worlds/deleted');
  });
});

describe('useRestoreWorld', () => {
  it('volá POST /worlds/:id/restore bez newOwnerId → prázdné body', async () => {
    vi.mocked(api.post).mockResolvedValue({ message: 'ok' });
    const { result } = renderHook(() => useRestoreWorld(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ worldId: 'w1' });
    });
    expect(api.post).toHaveBeenCalledWith('/worlds/w1/restore', {});
  });

  it('s newOwnerId pošle převzetí vlastníka', async () => {
    vi.mocked(api.post).mockResolvedValue({ message: 'ok' });
    const { result } = renderHook(() => useRestoreWorld(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ worldId: 'w1', newOwnerId: 'u2' });
    });
    expect(api.post).toHaveBeenCalledWith('/worlds/w1/restore', {
      newOwnerId: 'u2',
    });
  });
});
