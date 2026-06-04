import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocketReconnect } from './useSocket';

/**
 * W-7 — `useSocketReconnect` re-emituje room joiny po (re)connectu. Jádro
 * opravy reconnect-oslepnutí (world chat / PJ orchestrátor). L4 pojistka.
 */
const handlers: Record<string, () => void> = {};
const mockSocket = {
  on: vi.fn((ev: string, cb: () => void) => {
    handlers[ev] = cb;
  }),
  off: vi.fn(),
};

vi.mock('./socket', () => ({ getSocket: () => mockSocket }));
// useSocketReconnect importuje i jotai/atom přes useSocket modul — neřešíme tu.
vi.mock('../store/socketStore', () => ({ socketStatusAtom: { init: 'idle' } }));

describe('useSocketReconnect (W-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(handlers)) delete handlers[k];
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
    // Listener se registruje jen jednou (deps []), ne při každém renderu.
    expect(mockSocket.on).toHaveBeenCalledTimes(1);
  });
});
