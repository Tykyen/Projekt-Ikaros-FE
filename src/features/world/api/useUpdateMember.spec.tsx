import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useUpdateMember } from './useUpdateMember';
import { WorldRole, type WorldMembership } from '@/shared/types';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ api: { patch: vi.fn() } }));

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

describe('useUpdateMember', () => {
  // C-03 — změna (vlastní) role se musí promítnout do useMyWorlds (`['worlds','my']`),
  // odkud WorldContext bere roli/slot. Bez té invalidace zůstal kontext stale.
  it('C-03 — změna role invaliduje i worlds/my', async () => {
    vi.mocked(api.patch).mockResolvedValue({} as WorldMembership);
    const { wrapper, qc } = makeWrapperWithQc();
    const inval = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateMember('w1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        membershipId: 'm1',
        field: 'role',
        value: WorldRole.Hrac,
      });
    });
    const keys = inval.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['worlds', 'my']);
  });
});
