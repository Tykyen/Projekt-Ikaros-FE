import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useJoinWorld, useApproveAccessRequest } from './useWorldJoin';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ api: { post: vi.fn() } }));

function makeWrapperWithQc() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useJoinWorld', () => {
  // C-01 — broad ['worlds'] prefix musí invalidovat všechny world dotazy vč. detailu.
  it('C-01 — join invaliduje broad worlds prefix', async () => {
    vi.mocked(api.post).mockResolvedValue({} as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useJoinWorld(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ worldId: 'w1' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['worlds']);
  });
});

describe('useApproveAccessRequest', () => {
  // C-02 — REST fallback k WS world:membership:changed: approve musí obnovit
  // seznam členů i bez socketu (jinak PJ nového člena neuvidí do WS echa).
  it('C-02 — approve invaliduje seznam členů světa', async () => {
    vi.mocked(api.post).mockResolvedValue({} as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useApproveAccessRequest(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ worldId: 'w1', requestId: 'r1' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['worlds', 'w1', 'members']);
  });
});
