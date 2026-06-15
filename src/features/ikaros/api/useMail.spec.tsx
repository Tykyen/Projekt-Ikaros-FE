import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import {
  useUnreadCount,
  useInbox,
  useSendMessage,
  useDeleteMessage,
  mailKeys,
} from './useMail';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/features/chat', () => ({ useSocketEvent: vi.fn() }));

function makeWrapper(token: string | null = 'tok') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, token);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
  return { Wrapper };
}

const mockMsg = {
  id: 'm1',
  senderId: 's',
  senderName: 'Alice',
  recipientId: 'r',
  recipientName: 'Bob',
  subject: 'Ahoj',
  body: 'text',
  sentAtUtc: '2026-05-15T10:00:00Z',
  isRead: false,
  deletedBySender: false,
  deletedByRecipient: false,
  conversationId: 'm1',
  createdAt: '',
  updatedAt: '',
};

describe('useMail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useUnreadCount vrátí počet nepřečtených', async () => {
    vi.mocked(api.get).mockResolvedValue({ unreadCount: 3 });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadCount(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(result.current.data).toEqual({ unreadCount: 3 }),
    );
    expect(api.get).toHaveBeenCalledWith('/ikaros-messages/unread-count');
  });

  it('useInbox načte první stránku doručené pošty', async () => {
    vi.mocked(api.get).mockResolvedValue([mockMsg]);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useInbox(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(result.current.data?.pages.flat()).toHaveLength(1),
    );
    expect(api.get).toHaveBeenCalledWith('/ikaros-messages/inbox', {
      limit: 50,
    });
  });

  it('useSendMessage odešle zprávu na POST endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue(mockMsg);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: Wrapper,
    });
    await result.current.mutateAsync({
      subject: 'Ahoj',
      body: 'text',
      recipientId: 'r',
      recipientName: 'Bob',
    });
    expect(api.post).toHaveBeenCalledWith(
      '/ikaros-messages',
      expect.objectContaining({ subject: 'Ahoj', recipientId: 'r' }),
    );
  });

  // C-08 — delete dělá surgical removal z infinite cache (setQueryData), ne
  // refetch všech stránek. Zachová scroll pozici; ostatní zprávy zůstanou.
  it('C-08 — delete surgical removal z infinite cache (setQueryData inbox/sent)', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined as never);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const store = createStore();
    store.set(accessTokenAtom, 'tok');
    const Wrapper = ({ children }: PropsWithChildren) => (
      <JotaiProvider store={store}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </JotaiProvider>
    );
    const other = { ...mockMsg, id: 'm2' };
    qc.setQueryData(mailKeys.inbox, {
      pages: [[mockMsg, other]],
      pageParams: [undefined],
    });
    const setSpy = vi.spyOn(qc, 'setQueryData');
    const { result } = renderHook(() => useDeleteMessage(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync('m1');
    });
    const setKeys = setSpy.mock.calls.map((c) => c[0]);
    expect(setKeys).toContainEqual(mailKeys.inbox);
    expect(setKeys).toContainEqual(mailKeys.sent);
    const inbox = qc.getQueryData(mailKeys.inbox) as {
      pages: { id: string }[][];
    };
    expect(inbox.pages[0].map((m) => m.id)).toEqual(['m2']);
  });
});
