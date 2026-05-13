import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AxiosError, type AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import {
  useBlockUser,
  useUnblockUser,
} from '../useFriendshipMutations';

vi.mock('@/shared/api/client', async () => {
  const actual =
    await vi.importActual<typeof import('@/shared/api/client')>(
      '@/shared/api/client',
    );
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const apiPost = vi.mocked(api.post);
const apiDelete = vi.mocked(api.delete);

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeAxiosError(code: string, status = 403): AxiosError {
  const err = new AxiosError('mock');
  err.response = {
    status,
    data: { error: { code, message: 'msg', timestamp: '' } },
  } as AxiosResponse;
  return err;
}

describe('useBlockUser / useUnblockUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('block happy → toast success + POST /friends/block/:id', async () => {
    apiPost.mockResolvedValue({ friendship: { id: 'f1', status: 'blocked' } });
    const { result } = renderHook(() => useBlockUser(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('u2');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiPost).toHaveBeenCalledWith('/friends/block/u2');
    expect(toast.success).toHaveBeenCalledWith('Uživatel zablokován');
  });

  it('block 403 BLOCKED_BY_PEER → cílený toast', async () => {
    apiPost.mockRejectedValue(makeAxiosError('BLOCKED_BY_PEER', 403));
    const { result } = renderHook(() => useBlockUser(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('u2');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      'Tento uživatel ti zablokoval kontakt.',
    );
  });

  it('unblock happy → DELETE /friends/block/:id + toast', async () => {
    apiDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUnblockUser(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('u2');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiDelete).toHaveBeenCalledWith('/friends/block/u2');
    expect(toast.success).toHaveBeenCalledWith('Odblokováno');
  });
});
