import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useDeleteCharacter,
  useUpdateCharacterCalendar,
} from './useCharacterMutations';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { delete: vi.fn(), put: vi.fn() },
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

describe('useDeleteCharacter', () => {
  // C-20 — primární grid postav je servírovaný z Page projekce (persona), takže
  // mutace postavy musí invalidovat i `['pages',worldId,'directory']`, ne jen
  // character directory. Bez toho zůstal persona grid stale.
  it('C-20 — mazání postavy invaliduje persona grid (pages directory)', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { wrapper, qc } = makeWrapperWithQc();
    const inval = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteCharacter('w1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('slug-1');
    });
    const keys = inval.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pages', 'w1', 'directory']);
  });
});

describe('useUpdateCharacterCalendar', () => {
  // C-22 — agregátní kalendář (PJ view) je samostatný namespace
  // ['calendars-aggregate', worldId], který character-scoped klíče netrefí.
  // Bez té invalidace PJ agregace po editaci kalendáře postavy zůstala stale.
  it('C-22 — update kalendáře postavy invaliduje agregátní kalendář', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: 'cal1' } as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const inval = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(
      () => useUpdateCharacterCalendar('w1', 'slug-1'),
      { wrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({ events: [] });
    });
    const keys = inval.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['calendars-aggregate', 'w1']);
  });
});
