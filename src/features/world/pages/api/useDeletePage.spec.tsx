import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useDeletePage } from './useDeletePage';
import { pagesQueryKey } from './usePage';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ api: { delete: vi.fn() } }));

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

describe('useDeletePage', () => {
  // C-15 (postava smazaná přes Page → character directory) + C-16 (backlinks
  // cílů, na které mazaná odkazovala → broad invalidace). Bez nich zůstaly
  // sidebar nav slot / backlinks stale.
  it('C-15/C-16 — delete invaliduje character directory i broad backlinks', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { wrapper, qc } = makeWrapperWithQc();
    const inval = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeletePage('w1', 'svet-1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 'p1', slug: 'stranka-1' });
    });
    const keys = inval.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['characters', 'w1', 'directory']);
    expect(keys).toContainEqual(['pages', 'w1', 'backlinks']);
  });

  // C-17 — meta cache smazané stránky (AKJ shield). Parita s backlinks remove.
  it('C-17 — delete smaže meta cache stránky', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { wrapper, qc } = makeWrapperWithQc();
    const remove = vi.spyOn(qc, 'removeQueries');
    const { result } = renderHook(() => useDeletePage('w1', 'svet-1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 'p1', slug: 'stranka-1' });
    });
    const keys = remove.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(pagesQueryKey.meta('w1', 'stranka-1'));
  });
});
