import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';
import { io } from 'socket.io-client';
import { getSocket, disconnectSocket, reconnectSocket } from './socket';
import { socketGenerationAtom, socketStatusAtom } from '../store/socketStore';

/**
 * D-AUDIT-2026-07-11 (socket-swap listener leak) — centrální swap kontrakt:
 *  - `getSocket()` recykluje jedinou instanci a při vytvoření nové bumpne
 *    `socketGenerationAtom` (signál pro re-bind effectů),
 *  - `disconnectSocket()` starou instanci odpojí A zbaví všech listenerů
 *    (`removeAllListeners`) — nic na ní nesmí přežít a běžet dvojitě.
 */
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  })),
}));

interface FakeSocket {
  on: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
}

const fake = (s: unknown): FakeSocket => s as FakeSocket;

describe('socket.ts — swap lifecycle (D-AUDIT-2026-07-11)', () => {
  beforeEach(() => {
    // reset modulového stavu (socket je module-level singleton)
    disconnectSocket();
    vi.clearAllMocks();
    getDefaultStore().set(socketGenerationAtom, 0);
  });

  it('getSocket recykluje jedinou instanci (žádné paralelní sockety)', () => {
    const a = getSocket();
    const b = getSocket();
    expect(b).toBe(a);
    expect(vi.mocked(io)).toHaveBeenCalledTimes(1);
  });

  it('getSocket bumpne socketGenerationAtom jen při VYTVOŘENÍ instance', () => {
    const store = getDefaultStore();
    expect(store.get(socketGenerationAtom)).toBe(0);
    getSocket();
    expect(store.get(socketGenerationAtom)).toBe(1);
    getSocket(); // recyklace — bez bumpu
    expect(store.get(socketGenerationAtom)).toBe(1);
  });

  it('disconnectSocket odpojí instanci a odstraní VŠECHNY listenery', () => {
    const a = fake(getSocket());
    disconnectSocket();
    expect(a.disconnect).toHaveBeenCalledTimes(1);
    expect(a.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(getDefaultStore().get(socketStatusAtom)).toBe('disconnected');
  });

  it('reconnectSocket vytvoří NOVOU instanci a bumpne generaci', () => {
    const store = getDefaultStore();
    const a = getSocket();
    const genBefore = store.get(socketGenerationAtom);
    reconnectSocket();
    const b = getSocket();
    expect(b).not.toBe(a);
    expect(fake(a).removeAllListeners).toHaveBeenCalledTimes(1);
    expect(store.get(socketGenerationAtom)).toBe(genBefore + 1);
  });
});
