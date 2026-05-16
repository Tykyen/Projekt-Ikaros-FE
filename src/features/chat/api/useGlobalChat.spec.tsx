import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useRoomInfo,
  useChatHistory,
  useSendMessage,
  useDeleteMessage,
} from './useGlobalChat';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe('useGlobalChat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useRoomInfo načte info o místnosti', async () => {
    vi.mocked(api.get).mockResolvedValue({ channelId: 'ch1', users: [] });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRoomInfo(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(result.current.data).toEqual({ channelId: 'ch1', users: [] }),
    );
    expect(api.get).toHaveBeenCalledWith('/global-chat/room-info');
  });

  it('useChatHistory načte historii s limitem 50', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useChatHistory(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/global-chat/messages', {
      limit: 50,
    });
  });

  it('useSendMessage pošle content + color na POST endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 'm1' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSendMessage(), { wrapper: Wrapper });
    await result.current.mutateAsync({ content: 'ahoj', color: '#ff8800' });
    expect(api.post).toHaveBeenCalledWith('/global-chat/messages', {
      content: 'ahoj',
      color: '#ff8800',
    });
  });

  it('useDeleteMessage zavolá DELETE s id zprávy', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteMessage(), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync('m1');
    expect(api.delete).toHaveBeenCalledWith('/global-chat/messages/m1');
  });
});
