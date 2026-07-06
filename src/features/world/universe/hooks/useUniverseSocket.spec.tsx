import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useUniverseSocket } from './useUniverseSocket';
import { universeQueryKey } from '../api/useUniverse';

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};
vi.mock('@/features/chat/api/socket', () => ({
  getSocket: () => mockSocket,
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

function getHandler(event: string) {
  const call = mockSocket.on.mock.calls.find((c) => c[0] === event);
  return call?.[1] as ((signal: { worldId: string }) => void) | undefined;
}

beforeEach(() => vi.clearAllMocks());

describe('useUniverseSocket', () => {
  // FIX-1 — `world:{id}` room join/leave drží výhradně `useWorldSocket`
  // (WorldLayout, jediný vlastník); tenhle hook už `room:join` sám nedělá
  // (jinak by odchod z Universe mapy `room:leave`-oval i za WorldLayout).
  it('registruje listener na universe:updated', () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useUniverseSocket('w1', false), { wrapper });
    expect(mockSocket.emit).not.toHaveBeenCalledWith('room:join', expect.anything());
    expect(mockSocket.on).toHaveBeenCalledWith(
      'universe:updated',
      expect.any(Function),
    );
  });

  it('signál universe:updated → invaliduje query (když není suspended)', () => {
    const { wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useUniverseSocket('w1', false), { wrapper });
    act(() => getHandler('universe:updated')?.({ worldId: 'w1' }));
    expect(spy).toHaveBeenCalledWith({ queryKey: universeQueryKey('w1') });
  });

  it('ignoruje signál z jiného světa', () => {
    const { wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useUniverseSocket('w1', false), { wrapper });
    act(() => getHandler('universe:updated')?.({ worldId: 'other' }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('suspended (edit mód) → neinvaliduje, jen staleFromRemote=true', () => {
    const { wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUniverseSocket('w1', true), {
      wrapper,
    });
    expect(result.current.staleFromRemote).toBe(false);
    act(() => getHandler('universe:updated')?.({ worldId: 'w1' }));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.staleFromRemote).toBe(true);
  });

  it('clearStale zhasne flag', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUniverseSocket('w1', true), {
      wrapper,
    });
    act(() => getHandler('universe:updated')?.({ worldId: 'w1' }));
    expect(result.current.staleFromRemote).toBe(true);
    act(() => result.current.clearStale());
    expect(result.current.staleFromRemote).toBe(false);
  });

  // S-RUN-03 — re-join sám nestačí; signál zmeškaný za výpadku je pryč → po
  // reconnectu (connect handler) musí hook refetchnout (mimo edit mód).
  it('S-RUN-03 — reconnect (connect) invaliduje query, když není suspended', () => {
    const { wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useUniverseSocket('w1', false), { wrapper });
    const onConnect = getHandler('connect') as unknown as (() => void) | undefined;
    expect(onConnect).toBeDefined();
    spy.mockClear();
    act(() => onConnect!());
    expect(spy).toHaveBeenCalledWith({ queryKey: universeQueryKey('w1') });
  });

  it('S-RUN-03 — reconnect v edit módu (suspended) jen rozsvítí stale, neinvaliduje', () => {
    const { wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUniverseSocket('w1', true), {
      wrapper,
    });
    const onConnect = getHandler('connect') as unknown as (() => void) | undefined;
    spy.mockClear();
    act(() => onConnect!());
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.staleFromRemote).toBe(true);
  });
});
