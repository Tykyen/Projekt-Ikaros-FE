import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AxiosError, type AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useAdminResetCooldown } from '../useAdminFriendships';

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

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeAxiosError(code: string, status = 409): AxiosError {
  const err = new AxiosError('mock');
  err.response = {
    status,
    data: { error: { code, message: 'msg', timestamp: '' } },
  } as AxiosResponse;
  return err;
}

describe('useAdminResetCooldown', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path → POST /admin/friendships/:id/reset-cooldown + toast', async () => {
    apiPost.mockResolvedValue({ friendship: { id: 'f1' } });
    const { result } = renderHook(() => useAdminResetCooldown(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('f1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiPost).toHaveBeenCalledWith(
      '/admin/friendships/f1/reset-cooldown',
    );
    expect(toast.success).toHaveBeenCalledWith('Cooldown resetován');
  });

  it('409 NO_COOLDOWN → specifický toast', async () => {
    apiPost.mockRejectedValue(makeAxiosError('NO_COOLDOWN', 409));
    const { result } = renderHook(() => useAdminResetCooldown(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('f1');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      'Tento friendship nemá aktivní cooldown.',
    );
  });
});
