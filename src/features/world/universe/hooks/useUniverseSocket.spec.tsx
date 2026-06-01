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
  it('joinne world room a registruje listener', () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useUniverseSocket('w1', false), { wrapper });
    expect(mockSocket.emit).toHaveBeenCalledWith('room:join', 'world:w1');
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
});
