import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useUpdateAccount } from './useCharacterAccounts';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

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

describe('useCharacterAccounts', () => {
  // C-21 — broad invalidace ['characters', worldId] obnoví VŠECHNY owner-listy
  // (vč. shared účtů u co-ownerů). Dřívější per-owner predikát byl dead (slug vs
  // ObjectId nikdy nematchnul), takže listy účtů po update zůstaly stale.
  it('C-21 — update účtu invaliduje broad characters namespace', async () => {
    vi.mocked(api.patch).mockResolvedValue({ id: 'acc1' } as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateAccount('w1', 'acc1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ label: 'Nový název' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['characters', 'w1']);
  });
});
