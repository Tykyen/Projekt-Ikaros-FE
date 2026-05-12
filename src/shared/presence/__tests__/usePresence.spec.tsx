import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { presenceStatusMapAtom } from '../store';
import {
  usePresenceInit,
  useIsOnline,
  usePresenceStatus,
} from '../usePresence';

type Handler = (data: unknown) => void;
const handlers = new Map<string, Set<Handler>>();

const mockSocket = {
  on: vi.fn((event: string, cb: Handler) => {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(cb);
  }),
  off: vi.fn((event: string, cb: Handler) => {
    handlers.get(event)?.delete(cb);
  }),
  emit: vi.fn(),
};

vi.mock('@/features/chat/api/socket', () => ({
  getSocket: () => mockSocket,
}));

function fire(event: string, data: unknown) {
  handlers.get(event)?.forEach((cb) => { cb(data); });
}

const store = getDefaultStore();

beforeEach(() => {
  handlers.clear();
  mockSocket.on.mockClear();
  mockSocket.off.mockClear();
  mockSocket.emit.mockClear();
  store.set(presenceStatusMapAtom, new Map());
});

describe('presenceStatusMapAtom', () => {
  it('default empty Map', () => {
    expect(store.get(presenceStatusMapAtom).size).toBe(0);
  });
});

describe('usePresenceInit', () => {
  it('přihlásí presence:snapshot + presence:update a odhlásí v cleanup', () => {
    const { unmount } = renderHook(() => { usePresenceInit(); });
    expect(mockSocket.on).toHaveBeenCalledWith('presence:snapshot', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('presence:update', expect.any(Function));
    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('presence:snapshot', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('presence:update', expect.any(Function));
  });

  it('snapshot handler naplní mapu z entries', () => {
    renderHook(() => { usePresenceInit(); });
    act(() => {
      fire('presence:snapshot', {
        entries: [
          { userId: 'u1', status: 'online' },
          { userId: 'u2', status: 'idle' },
        ],
      });
    });
    const map = store.get(presenceStatusMapAtom);
    expect(map.get('u1')).toBe('online');
    expect(map.get('u2')).toBe('idle');
    expect(map.size).toBe(2);
  });

  it('update status: online → set', () => {
    renderHook(() => { usePresenceInit(); });
    act(() => { fire('presence:update', { userId: 'u3', status: 'online' }); });
    expect(store.get(presenceStatusMapAtom).get('u3')).toBe('online');
  });

  it('update status: idle → set idle', () => {
    renderHook(() => { usePresenceInit(); });
    act(() => { fire('presence:update', { userId: 'u3', status: 'idle' }); });
    expect(store.get(presenceStatusMapAtom).get('u3')).toBe('idle');
  });

  it('update status: offline → delete', () => {
    store.set(presenceStatusMapAtom, new Map([['u1', 'online']]));
    renderHook(() => { usePresenceInit(); });
    act(() => { fire('presence:update', { userId: 'u1', status: 'offline' }); });
    expect(store.get(presenceStatusMapAtom).has('u1')).toBe(false);
  });
});

describe('useIsOnline', () => {
  it('vrátí false pro undefined / null', () => {
    const { result: r1 } = renderHook(() => useIsOnline(undefined));
    const { result: r2 } = renderHook(() => useIsOnline(null));
    expect(r1.current).toBe(false);
    expect(r2.current).toBe(false);
  });

  it('true pro online i idle (oba "v mapě" = aktivní socket)', () => {
    store.set(presenceStatusMapAtom, new Map([['u1', 'online']]));
    const { result: a } = renderHook(() => useIsOnline('u1'));
    expect(a.current).toBe(true);

    store.set(presenceStatusMapAtom, new Map([['u2', 'idle']]));
    const { result: b } = renderHook(() => useIsOnline('u2'));
    expect(b.current).toBe(true);
  });
});

describe('usePresenceStatus', () => {
  it('vrátí offline pro neznámého', () => {
    const { result } = renderHook(() => usePresenceStatus('ghost'));
    expect(result.current).toBe('offline');
  });

  it('rozlišuje online a idle', () => {
    store.set(presenceStatusMapAtom, new Map([
      ['a', 'online'],
      ['b', 'idle'],
    ]));
    const { result: a } = renderHook(() => usePresenceStatus('a'));
    const { result: b } = renderHook(() => usePresenceStatus('b'));
    expect(a.current).toBe('online');
    expect(b.current).toBe('idle');
  });
});
