import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { useSocketEvent, useSocketReconnect } from './useSocket';
import { socketGenerationAtom, socketStatusAtom } from '../store/socketStore';

/**
 * W-7 — `useSocketReconnect` re-emituje room joiny po (re)connectu. Jádro
 * opravy reconnect-oslepnutí (world chat / PJ orchestrátor). L4 pojistka.
 * S-RUN-04 (plný audit 2026-06-20) — navíc přeregistrace na změnu socket stavu.
 * D-AUDIT-2026-07-11 — swap instance (socketGenerationAtom): starý handler se
 * po výměně socketu nevolá, nový přesně 1× (regresní test listener leaku).
 */
const handlers: Record<string, () => void> = {};
const mockSocket = {
  on: vi.fn((ev: string, cb: () => void) => {
    handlers[ev] = cb;
  }),
  off: vi.fn(),
};

/** Instanční mock — eviduje registrované handlery, umí simulovat příchozí event. */
function makeInstanceSocket() {
  const listeners = new Map<string, Array<(data?: unknown) => void>>();
  return {
    on: vi.fn((ev: string, cb: (data?: unknown) => void) => {
      listeners.set(ev, [...(listeners.get(ev) ?? []), cb]);
    }),
    off: vi.fn((ev: string, cb: (data?: unknown) => void) => {
      listeners.set(
        ev,
        (listeners.get(ev) ?? []).filter((c) => c !== cb),
      );
    }),
    /** Simulace server → klient eventu (volá aktuálně registrované handlery). */
    receive(ev: string, data?: unknown) {
      for (const cb of [...(listeners.get(ev) ?? [])]) cb(data);
    },
    listenerCount(ev: string) {
      return (listeners.get(ev) ?? []).length;
    },
  };
}
type InstanceSocket = ReturnType<typeof makeInstanceSocket>;

// `currentSocket` = instance, kterou právě vrací getSocket() — swap test ji
// vymění a bumpne socketGenerationAtom (přesně to dělá reálný getSocket()).
let currentSocket: InstanceSocket | typeof mockSocket = mockSocket;

vi.mock('./socket', () => ({ getSocket: () => currentSocket }));
// socketStatusAtom je reálný jotai atom (useSocketReconnect ho čte přes useAtomValue).

describe('useSocketReconnect (W-7 / S-RUN-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(handlers)) delete handlers[k];
    currentSocket = mockSocket;
    getDefaultStore().set(socketStatusAtom, 'connected');
    getDefaultStore().set(socketGenerationAtom, 0);
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

// D-AUDIT-2026-07-11 — regresní testy socket-swap listener leaku: výměna
// socket instance (reconnectSocket / re-auth / login) nesmí nechat handler
// na staré instanci ani ho na nové registrovat duplicitně.
describe('useSocketEvent — swap socket instance (D-AUDIT-2026-07-11)', () => {
  /** Simulace toho, co dělá getSocket() při vzniku nové instance. */
  function swapTo(next: InstanceSocket) {
    currentSocket = next;
    act(() => {
      const store = getDefaultStore();
      store.set(socketGenerationAtom, store.get(socketGenerationAtom) + 1);
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    getDefaultStore().set(socketStatusAtom, 'connected');
    getDefaultStore().set(socketGenerationAtom, 0);
  });

  it('cleanup odregistruje STEJNOU referenci handleru (žádný osiřelý listener)', () => {
    const socketA = makeInstanceSocket();
    currentSocket = socketA;
    const { unmount } = renderHook(() =>
      useSocketEvent('chat:message', vi.fn()),
    );
    const registered = socketA.on.mock.calls.find(
      (c) => c[0] === 'chat:message',
    )?.[1];
    expect(registered).toBeDefined();
    unmount();
    expect(socketA.off).toHaveBeenCalledWith('chat:message', registered);
    expect(socketA.listenerCount('chat:message')).toBe(0);
  });

  it('po swapu se starý handler nevolá a nový přesně 1×', () => {
    const socketA = makeInstanceSocket();
    const socketB = makeInstanceSocket();
    currentSocket = socketA;

    const received = vi.fn();
    renderHook(() => useSocketEvent('chat:message', received));
    expect(socketA.listenerCount('chat:message')).toBe(1);

    // swap instance (status se nemění — kryto socketGenerationAtom)
    swapTo(socketB);

    // stará instance: handler odregistrován → pozdní event se NEdoručí
    expect(socketA.listenerCount('chat:message')).toBe(0);
    socketA.receive('chat:message', { id: 'stale' });
    expect(received).not.toHaveBeenCalled();

    // nová instance: přesně jedna registrace → event dorazí právě 1×
    expect(socketB.listenerCount('chat:message')).toBe(1);
    socketB.receive('chat:message', { id: 'fresh' });
    expect(received).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenCalledWith({ id: 'fresh' });
  });

  it('opakovaný swap nehromadí registrace (vždy právě 1 listener)', () => {
    const socketA = makeInstanceSocket();
    const socketB = makeInstanceSocket();
    const socketC = makeInstanceSocket();
    currentSocket = socketA;

    const received = vi.fn();
    renderHook(() => useSocketEvent('presence:update', received));
    swapTo(socketB);
    swapTo(socketC);

    expect(socketA.listenerCount('presence:update')).toBe(0);
    expect(socketB.listenerCount('presence:update')).toBe(0);
    expect(socketC.listenerCount('presence:update')).toBe(1);
    socketC.receive('presence:update', { userId: 'u1', status: 'online' });
    expect(received).toHaveBeenCalledTimes(1);
  });

  it('useSocketReconnect po swapu volá callback z NOVÉ instance právě 1×', () => {
    const socketA = makeInstanceSocket();
    const socketB = makeInstanceSocket();
    currentSocket = socketA;

    const onReconnect = vi.fn();
    renderHook(() => useSocketReconnect(onReconnect));
    swapTo(socketB);

    // connect na staré instanci (pozdní/duchový event) → nic
    socketA.receive('connect');
    expect(onReconnect).not.toHaveBeenCalled();
    // connect na nové instanci → přesně 1×
    socketB.receive('connect');
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });
});
