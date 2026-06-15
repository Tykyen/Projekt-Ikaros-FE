import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useWorldSocket } from './useWorldSocket';

/**
 * S-06 (state-consistency audit) — `world:membership:changed` / `removed`
 * musí invalidovat i `['worlds','my']`, kde žije moje role (useWorldStatus →
 * WorldContext). Bez toho se po změně role od cizího PJ neobnoví UI/gate
 * (staleTime 5 min) — klasický WS-event-bez-správné-invalidace nález.
 *
 * Mockujeme `useSocketEvent` tak, aby zachytil registrované handlery podle
 * názvu eventu; pak handler ručně vyvoláme a ověříme spy na invalidateQueries.
 */
const eventHandlers: Record<string, (data?: unknown) => void> = {};

vi.mock('@/features/chat/api/useSocket', () => ({
  useSocketEvent: (event: string, handler: (data?: unknown) => void) => {
    eventHandlers[event] = handler;
  },
  useSocketReconnect: () => {},
}));

const mockSocket = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
vi.mock('@/features/chat/api/socket', () => ({ getSocket: () => mockSocket }));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }));

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
  for (const k of Object.keys(eventHandlers)) delete eventHandlers[k];
});

describe('useWorldSocket — membership změny (S-06)', () => {
  it('S-06 — world:membership:changed invaliduje [worlds,my] (moje role)', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useWorldSocket('w-1'), { wrapper: Wrapper });

    expect(eventHandlers['world:membership:changed']).toBeDefined();
    eventHandlers['world:membership:changed']();

    expect(spy).toHaveBeenCalledWith({ queryKey: ['worlds', 'my'] });
    expect(spy).toHaveBeenCalledWith({
      queryKey: ['worlds', 'w-1', 'members'],
    });
  });

  it('S-06 — world:membership:removed taktéž invaliduje [worlds,my]', () => {
    const { Wrapper, qc } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useWorldSocket('w-1'), { wrapper: Wrapper });

    expect(eventHandlers['world:membership:removed']).toBeDefined();
    eventHandlers['world:membership:removed']();

    expect(spy).toHaveBeenCalledWith({ queryKey: ['worlds', 'my'] });
  });
});
