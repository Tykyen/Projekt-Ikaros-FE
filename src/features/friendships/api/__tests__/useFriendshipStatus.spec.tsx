import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { api } from '@/shared/api/client';
import { useFriendshipStatus } from '../useFriendshipStatus';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn() },
}));

const apiGet = vi.mocked(api.get);

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useFriendshipStatus', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it('vrátí kind=none', async () => {
    apiGet.mockResolvedValue({ kind: 'none' });
    const { result } = renderHook(() => useFriendshipStatus('u1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.kind).toBe('none');
  });

  it('vrátí kind=accepted s friendshipId', async () => {
    apiGet.mockResolvedValue({ kind: 'accepted', friendshipId: 'f1' });
    const { result } = renderHook(() => useFriendshipStatus('u1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      kind: 'accepted',
      friendshipId: 'f1',
    });
  });

  it('vrátí kind=cooldown bez friendshipId', async () => {
    apiGet.mockResolvedValue({ kind: 'cooldown' });
    const { result } = renderHook(() => useFriendshipStatus('u1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.kind).toBe('cooldown');
  });

  it('vrátí kind=self pro vlastní userId', async () => {
    apiGet.mockResolvedValue({ kind: 'self' });
    const { result } = renderHook(() => useFriendshipStatus('me'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.kind).toBe('self');
  });

  it('disabled při undefined userId', async () => {
    const { result } = renderHook(() => useFriendshipStatus(undefined), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isFetching).toBe(false);
    expect(apiGet).not.toHaveBeenCalled();
  });
});
