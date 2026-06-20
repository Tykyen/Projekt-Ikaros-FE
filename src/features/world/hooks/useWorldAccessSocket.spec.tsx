import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useWorldAccessSocket } from './useWorldAccessSocket';

/**
 * S-RUN-01 (state-consistency, plný audit 2026-06-20) — world access eventy jdou
 * do user:{id} roomu (server ho po reconnectu re-joinne sám), ale eventy vyslané
 * během výpadku jsou pryč. Po reconnectu musí hook refetchnout dotčené klíče,
 * jinak PJ neuvidí novou žádost ani žadatel schválení do další akce / F5.
 *
 * Mockujeme `useSocketEvent` (jen registrace) a `useSocketReconnect` (zachytí cb).
 */
let reconnectCb: (() => void) | undefined;
const handlers = new Map<string, (data: unknown) => void>();

vi.mock('@/features/chat/api/useSocket', () => ({
  useSocketEvent: (event: string, handler: (data: unknown) => void) => {
    handlers.set(event, handler);
  },
  useSocketReconnect: (cb: () => void) => {
    reconnectCb = cb;
  },
}));

vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn() } }));

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

describe('useWorldAccessSocket — reconnect refetch (S-RUN-01)', () => {
  it('reconnect callback invaliduje pending-actions / worlds,my-access-requests / worlds,my / worlds', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useWorldAccessSocket(), { wrapper: Wrapper });

    expect(reconnectCb).toBeDefined();
    reconnectCb!();

    expect(spy).toHaveBeenCalledWith({ queryKey: ['pending-actions'] });
    expect(spy).toHaveBeenCalledWith({
      queryKey: ['worlds', 'my-access-requests'],
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['worlds', 'my'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['worlds'] });
  });
});
