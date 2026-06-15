import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useFriendshipsSocket } from './useFriendshipsSocket';

/**
 * S-05 (state-consistency audit) — friend eventy jdou do user:{id} roomu
 * (server ho po reconnectu re-joinne sám), ale eventy vyslané během výpadku
 * jsou pryč. Po reconnectu musí hook refetchnout dotčené seznamy + badge,
 * jinak by „přátelé/žádosti" zůstali stale. Ověřujeme reconnect callback.
 *
 * Mockujeme `useSocketEvent` (no-op, jen registrace) a `useSocketReconnect`
 * tak, aby zachytil reconnect callback; pak ho ručně vyvoláme.
 */
let reconnectCb: (() => void) | undefined;
// C-13 — zachytíme registrované WS event handlery, ať je v testu ručně
// vyvoláme (simulace doručeného friendship eventu).
const handlers = new Map<string, (data: unknown) => void>();

vi.mock('@/features/chat/api/useSocket', () => ({
  useSocketEvent: (event: string, handler: (data: unknown) => void) => {
    handlers.set(event, handler);
  },
  useSocketReconnect: (cb: () => void) => {
    reconnectCb = cb;
  },
}));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../lib/toasts', () => ({
  toastFriendRequestAccepted: vi.fn(),
  toastIncomingFriendRequest: vi.fn(),
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, qc };
}

beforeEach(() => {
  vi.clearAllMocks();
  reconnectCb = undefined;
  handlers.clear();
});

describe('useFriendshipsSocket — reconnect refetch (S-05)', () => {
  it('S-05 — reconnect callback invaliduje friends / friendship-status / pending-actions / users,me', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useFriendshipsSocket(), { wrapper: Wrapper });

    expect(reconnectCb).toBeDefined();
    reconnectCb!();

    expect(spy).toHaveBeenCalledWith({ queryKey: ['friends'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['friendship-status'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['pending-actions'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
  });
});

describe('useFriendshipsSocket — C-13 WS parita s REST', () => {
  it('C-13 — accepted event invaliduje pending-actions badge', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useFriendshipsSocket(), { wrapper: Wrapper });
    handlers.get('friend:request:accepted')?.({
      friendshipId: 'f1',
      by: { username: 'Alice' },
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });

  it('C-13 — canceled event invaliduje friendship-status (tlačítko na profilu)', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useFriendshipsSocket(), { wrapper: Wrapper });
    handlers.get('friend:request:canceled')?.({ friendshipId: 'f1' });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['friendship-status']);
  });

  it('C-13 — removed event invaliduje pending-actions badge', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useFriendshipsSocket(), { wrapper: Wrapper });
    handlers.get('friend:removed')?.({ friendshipId: 'f1' });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });
});
