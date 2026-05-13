import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AxiosError, type AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useSendFriendRequest } from '../useFriendshipMutations';

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

describe('useSendFriendRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path → toast success', async () => {
    apiPost.mockResolvedValue({ friendship: { id: 'f1' } });
    const { result } = renderHook(() => useSendFriendRequest(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('u2');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Žádost o přátelství odeslána');
  });

  it('429 REJECTED_RECENTLY → toast s cool-down zprávou', async () => {
    apiPost.mockRejectedValue(makeAxiosError('REJECTED_RECENTLY', 429));
    const { result } = renderHook(() => useSendFriendRequest(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('u2');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      'Tento uživatel ti nedávno odmítl žádost. Zkus to později.',
    );
  });

  it('409 ALREADY_FRIENDS → cílený toast', async () => {
    apiPost.mockRejectedValue(makeAxiosError('ALREADY_FRIENDS'));
    const { result } = renderHook(() => useSendFriendRequest(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('u2');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      'S tímto uživatelem už jste přátelé.',
    );
  });

  it('409 REQUEST_EXISTS → cílený toast', async () => {
    apiPost.mockRejectedValue(makeAxiosError('REQUEST_EXISTS'));
    const { result } = renderHook(() => useSendFriendRequest(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('u2');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Žádost už čeká na rozhodnutí.');
  });
});
