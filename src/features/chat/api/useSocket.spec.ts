import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { useSocketReconnect } from './useSocket';
import { socketStatusAtom } from '../store/socketStore';

/**
 * W-7 — `useSocketReconnect` re-emituje room joiny po (re)connectu. Jádro
 * opravy reconnect-oslepnutí (world chat / PJ orchestrátor). L4 pojistka.
 * S-RUN-04 (plný audit 2026-06-20) — navíc přeregistrace na změnu socket stavu.
 */
const handlers: Record<string, () => void> = {};
const mockSocket = {
  on: vi.fn((ev: string, cb: () => void) => {
    handlers[ev] = cb;
  }),
  off: vi.fn(),
};

vi.mock('./socket', () => ({ getSocket: () => mockSocket }));
// socketStatusAtom je reálný jotai atom (useSocketReconnect ho čte přes useAtomValue).

describe('useSocketReconnect (W-7 / S-RUN-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(handlers)) delete handlers[k];
    getDefaultStore().set(socketStatusAtom, 'connected');
  });

  it('zavolá onReconnect při socket connect eventu', () => {
    const onReconnect = vi.fn();
    renderHook(() => useSocketReconnect(onReconnect));
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(onReconnect).not.toHaveBeenCalled(); // ne při mountu
    handlers.connect();
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it('odregistruje connect handler na unmount', () => {
    const { unmount } = renderHook(() => useSocketReconnect(vi.fn()));
    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('po reconnectu volá AKTUÁLNÍ callback (ref) bez re-registrace listeneru', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useSocketReconnect(cb), {
      initialProps: { cb: first },
    });
    rerender({ cb: second });
    handlers.connect();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    // Status se nezměnil → registrace effect se neopakuje (jen 1×).
    expect(mockSocket.on).toHaveBeenCalledTimes(1);
  });

  // S-RUN-04 — po reconnectSocket() (změna socketStatusAtom) se handler
  // přeregistruje na novou instanci (jinak by visel na staré odpojené).
  it('přeregistruje connect handler při změně socket stavu', () => {
    renderHook(() => useSocketReconnect(vi.fn()));
    expect(mockSocket.on).toHaveBeenCalledTimes(1);
    // simulace reconnectSocket: disconnected → connected (nová instance)
    act(() => {
      getDefaultStore().set(socketStatusAtom, 'disconnected');
    });
    act(() => {
      getDefaultStore().set(socketStatusAtom, 'connected');
    });
    expect(mockSocket.off).toHaveBeenCalled(); // odregistrace ze staré
    expect(mockSocket.on.mock.calls.length).toBeGreaterThan(1); // re-registrace
  });
});
