import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type Query } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useBestieMutations } from './useBestieMutations';
import * as bestiarApi from '../api/bestiarApi';

vi.mock('../api/bestiarApi', () => ({
  createBestie: vi.fn(),
  updateBestie: vi.fn(),
  deleteBestie: vi.fn(),
  cloneBestie: vi.fn(),
  restoreBestie: vi.fn(),
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

/** Pomocná stub query — predikát čte jen `query.queryKey`. */
function fakeQuery(queryKey: readonly unknown[]): Query {
  return { queryKey } as unknown as Query;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useBestieMutations', () => {
  // C-33 — system/user-scope bestie jsou cross-world; přesný klíč ['bestiar',
  // worldId, systemId] by minul ostatní otevřené světy se stejnými globálními
  // bestiemi. Fix invaliduje predikátem všechny světy téhož systému (klíč[2]).
  it('C-33 — create invaliduje predikátem všechny světy téhož systému', async () => {
    vi.mocked(bestiarApi.createBestie).mockResolvedValue({ id: 'b1' } as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useBestieMutations('w1', 'sysA'), {
      wrapper,
    });
    await act(async () => {
      await result.current.create.mutateAsync({} as never);
    });

    // Najdi volání s predikátem (ne queryKey).
    const predicateCall = spy.mock.calls.find((c) => typeof c[0]?.predicate === 'function');
    expect(predicateCall).toBeDefined();
    const predicate = predicateCall![0]!.predicate!;

    // Trefí stejný systém v JINÉM světě (w2) — to je jádro fixu.
    expect(predicate(fakeQuery(['bestiar', 'w2', 'sysA']))).toBe(true);
    // Trefí i původní svět.
    expect(predicate(fakeQuery(['bestiar', 'w1', 'sysA']))).toBe(true);
    // Netrefí jiný systém.
    expect(predicate(fakeQuery(['bestiar', 'w1', 'sysB']))).toBe(false);
    // Netrefí cizí namespace.
    expect(predicate(fakeQuery(['characters', 'w1', 'sysA']))).toBe(false);
  });
});
