import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useRoomInfo,
  useChatHistory,
  useSendMessage,
  useDeleteMessage,
  useToggleReaction,
  useUploadAttachment,
  useRoomEnvironment,
  useSetRoomEnvironment,
  useRoomPresenceCounts,
  chatQueryKeys,
} from './useGlobalChat';
import { useSocketEvent } from './useSocket';
import { api, apiClient } from '@/shared/api/client';
import type { RoomPresenceCounts } from '../lib/types';

const { mockEmit } = vi.hoisted(() => ({ mockEmit: vi.fn() }));

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiClient: { post: vi.fn() },
}));

// Socket vrstva — testujeme jen REST + cache, WS handler voláme ručně.
vi.mock('./useSocket', () => ({ useSocketEvent: vi.fn() }));
vi.mock('./socket', () => ({ getSocket: () => ({ emit: mockEmit }) }));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe('chatQueryKeys', () => {
  it('klíče nesou room — Hospoda a Rozcestí se nekříží', () => {
    expect(chatQueryKeys('hospoda').messages).toEqual([
      'global-chat',
      'hospoda',
      'messages',
    ]);
    expect(chatQueryKeys('rozcesti-1').messages).toEqual([
      'global-chat',
      'rozcesti-1',
      'messages',
    ]);
  });
});

describe('useGlobalChat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useRoomInfo načte info o místnosti s parametrem room', async () => {
    vi.mocked(api.get).mockResolvedValue({ channelId: 'ch1', users: [] });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRoomInfo('rozcesti-1'), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(result.current.data).toEqual({ channelId: 'ch1', users: [] }),
    );
    expect(api.get).toHaveBeenCalledWith('/global-chat/room-info', {
      room: 'rozcesti-1',
    });
  });

  it('useChatHistory načte historii s room + limitem 50', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useChatHistory('hospoda'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/global-chat/messages', {
      room: 'hospoda',
      limit: 50,
    });
  });

  it('useSendMessage pošle content + color na POST endpoint s room v query', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 'm1' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSendMessage('rozcesti-2'), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync({ content: 'ahoj', color: '#ff8800' });
    expect(api.post).toHaveBeenCalledWith(
      '/global-chat/messages?room=rozcesti-2',
      { content: 'ahoj', color: '#ff8800' },
    );
  });

  it('useSendMessage propíše replyToId do payloadu (4.3a)', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 'm2' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSendMessage('hospoda'), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync({ content: 'odpoved', replyToId: 'm1' });
    expect(api.post).toHaveBeenCalledWith('/global-chat/messages?room=hospoda', {
      content: 'odpoved',
      replyToId: 'm1',
    });
  });

  it('useSendMessage propíše attachments do payloadu (4.3b)', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 'm3' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSendMessage('hospoda'), {
      wrapper: Wrapper,
    });
    const attachments = [
      {
        url: 'https://res.cloudinary.com/c/global-chat/hospoda/a.png',
        publicId: 'global-chat/hospoda/a',
        type: 'image' as const,
        mimeType: 'image/png',
        filename: 'a.png',
        size: 10,
      },
    ];
    await result.current.mutateAsync({ content: '', attachments });
    expect(api.post).toHaveBeenCalledWith('/global-chat/messages?room=hospoda', {
      content: '',
      attachments,
    });
  });

  it('useUploadAttachment pošle multipart na upload endpoint s room (4.3b)', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { publicId: 'global-chat/rozcesti-1/a' },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUploadAttachment('rozcesti-1'), {
      wrapper: Wrapper,
    });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await result.current.mutateAsync(file);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/global-chat/upload?room=rozcesti-1',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  });

  it('useToggleReaction emitne chat:reaction:toggle se room (4.3a)', () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useToggleReaction('rozcesti-1'), {
      wrapper: Wrapper,
    });
    result.current('m1', '👍');
    expect(mockEmit).toHaveBeenCalledWith('chat:reaction:toggle', {
      room: 'rozcesti-1',
      messageId: 'm1',
      emoji: '👍',
    });
  });

  it('useDeleteMessage zavolá DELETE s id zprávy + room', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteMessage('hospoda'), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync('m1');
    expect(api.delete).toHaveBeenCalledWith(
      '/global-chat/messages/m1?room=hospoda',
    );
  });

  it('useRoomEnvironment načte prostředí Rozcestí', async () => {
    vi.mocked(api.get).mockResolvedValue({ style: 'fantasy', placeId: '1' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRoomEnvironment('rozcesti-1'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/global-chat/rooms/rozcesti-1/environment',
    );
  });

  it('useRoomEnvironment se pro Hospodu nevolá (disabled)', async () => {
    const { Wrapper } = makeWrapper();
    renderHook(() => useRoomEnvironment('hospoda'), { wrapper: Wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('useSetRoomEnvironment pošle PUT se stylem + lokací', async () => {
    vi.mocked(api.put).mockResolvedValue({ style: 'scifi', placeId: '7' });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetRoomEnvironment('rozcesti-3'), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync({ style: 'scifi', placeId: '7' });
    expect(api.put).toHaveBeenCalledWith(
      '/global-chat/rooms/rozcesti-3/environment',
      { style: 'scifi', placeId: '7' },
    );
  });
});

describe('useRoomPresenceCounts (4.2c §4)', () => {
  beforeEach(() => vi.clearAllMocks());

  const zero: RoomPresenceCounts = {
    hospoda: 0,
    'rozcesti-1': 0,
    'rozcesti-2': 0,
    'rozcesti-3': 0,
  };

  it('načte počty přítomných z REST endpointu', async () => {
    vi.mocked(api.get).mockResolvedValue({ ...zero, hospoda: 3 });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRoomPresenceCounts(), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(result.current).toEqual({ ...zero, hospoda: 3 }),
    );
    expect(api.get).toHaveBeenCalledWith('/global-chat/rooms/presence');
  });

  it('WS event `chat:rooms:presence` přepíše počty v cache', async () => {
    vi.mocked(api.get).mockResolvedValue(zero);
    let wsHandler: ((c: RoomPresenceCounts) => void) | undefined;
    vi.mocked(useSocketEvent).mockImplementation((event, handler) => {
      if (event === 'chat:rooms:presence') {
        wsHandler = handler as (c: RoomPresenceCounts) => void;
      }
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRoomPresenceCounts(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current).toEqual(zero));

    act(() => wsHandler!({ ...zero, 'rozcesti-1': 5 }));
    await waitFor(() => expect(result.current?.['rozcesti-1']).toBe(5));
  });
});
