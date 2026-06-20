import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useReassignmentListener } from './useReassignmentListener';

/**
 * S-RUN-02 (state-consistency, plný audit 2026-06-20) — `map:reassigned` jde do
 * user:{id} roomu (server ho po reconnectu re-joinne sám), ale event vyslaný
 * během výpadku je pryč → po reconnectu musí hook refetchnout aktivní scénu,
 * jinak hráč zůstane na staré/neexistující scéně do mount-refetche.
 *
 * Mockujeme `useSocketReconnect` (zachytí cb), `getSocket` (fake) a query-key.
 */
let reconnectCb: (() => void) | undefined;
const mockSocket = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };

vi.mock('@/features/chat/api/useSocket', () => ({
  useSocketReconnect: (cb: () => void) => {
    reconnectCb = cb;
  },
}));
vi.mock('@/features/chat/api/socket', () => ({
  getSocket: () => mockSocket,
}));
vi.mock('./useMapScene', () => ({
  mapSceneQueryKey: (worldId: string) => ['map', 'active', worldId],
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
});

describe('useReassignmentListener — reconnect refetch (S-RUN-02)', () => {
  it('reconnect callback invaliduje aktivní scénu daného světa', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useReassignmentListener('w1'), { wrapper: Wrapper });

    expect(reconnectCb).toBeDefined();
    reconnectCb!();

    expect(spy).toHaveBeenCalledWith({ queryKey: ['map', 'active', 'w1'] });
  });

  it('bez worldId reconnect callback neinvaliduje', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useReassignmentListener(null), { wrapper: Wrapper });

    reconnectCb!();

    expect(spy).not.toHaveBeenCalled();
  });
});
