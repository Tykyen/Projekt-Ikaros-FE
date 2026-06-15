import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useAccountTransferNotifications } from './useAccountTransferNotifications';

/**
 * S-03 (state-consistency audit) — převod doručený během WS výpadku je pryč
 * (event se neopakuje). Po reconnectu musí hook refetchnout účty, jinak
 * zůstatek zůstane stale a toast nikdy nedorazí. Ověřujeme:
 *   1. live event `account:transfer:received` invaliduje `accounts` klíče,
 *   2. reconnect callback invaliduje `accounts` (jádro S-03).
 *
 * Mockujeme `useSocketEvent`/`useSocketReconnect` tak, aby zachytily handler
 * resp. reconnect callback; pak je ručně vyvoláme.
 */
let transferHandler: ((p: unknown) => void) | undefined;
let reconnectCb: (() => void) | undefined;

vi.mock('@/features/chat/api/useSocket', () => ({
  useSocketEvent: (event: string, handler: (p: unknown) => void) => {
    if (event === 'account:transfer:received') transferHandler = handler;
  },
  useSocketReconnect: (cb: () => void) => {
    reconnectCb = cb;
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, qc };
}

/** Vrátí query klíče, které prošly daným invalidate predicate. */
function keysMatchedByPredicate(
  spy: ReturnType<typeof vi.spyOn>,
  keys: unknown[][],
): unknown[][] {
  const call = spy.mock.calls.find(
    (c: unknown[]) =>
      typeof (c[0] as { predicate?: unknown })?.predicate === 'function',
  );
  if (!call) return [];
  const predicate = (call[0] as { predicate: (q: unknown) => boolean })
    .predicate;
  return keys.filter((queryKey) => predicate({ queryKey }));
}

beforeEach(() => {
  vi.clearAllMocks();
  transferHandler = undefined;
  reconnectCb = undefined;
});

describe('useAccountTransferNotifications (S-03)', () => {
  it('S-03 — reconnect callback invaliduje accounts cache', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useAccountTransferNotifications(), { wrapper: Wrapper });

    expect(reconnectCb).toBeDefined();
    reconnectCb!();

    // Predicate na reconnect má matchnout účty (queryKey[0] === 'accounts').
    const matched = keysMatchedByPredicate(spy, [
      ['accounts', 'w-1'],
      ['characters', 'c-1', 'accounts'],
    ]);
    expect(matched).toContainEqual(['accounts', 'w-1']);
  });

  it('S-03 — live account:transfer:received invaliduje accounts klíče', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useAccountTransferNotifications(), { wrapper: Wrapper });

    expect(transferHandler).toBeDefined();
    transferHandler!({
      fromAccountId: 'a',
      toAccountId: 'b',
      amount: 10,
      currency: 'zl',
      description: '',
    });

    // Aspoň jeden invalidate predicate matchne 'accounts' top-level klíč.
    const matched = keysMatchedByPredicate(spy, [['accounts', 'w-1']]);
    expect(matched).toContainEqual(['accounts', 'w-1']);
  });
});
