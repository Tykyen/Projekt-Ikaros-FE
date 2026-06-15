import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useUpdatePage } from './useUpdatePage';
import { pagesQueryKey } from './usePage';
import type { Page } from './pages.types';
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

describe('useUpdatePage', () => {
  // C-16 (backlinks cílových stránek → broad) + C-17 (meta této stránky po
  // změně accessRequirements — AKJ shield).
  it('C-16/C-17 — update invaliduje broad backlinks i meta stránky', async () => {
    vi.mocked(api.patch).mockResolvedValue({ slug: 'stranka-1' } as Page);
    const { wrapper, qc } = makeWrapperWithQc();
    const inval = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdatePage('w1', 'svet-1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 'p1', input: { title: 'X' } });
    });
    const keys = inval.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pages', 'w1', 'backlinks']);
    expect(keys).toContainEqual(pagesQueryKey.meta('w1', 'stranka-1'));
  });

  // N-38 — po rename (změna slugu) se musí smazat detail cache pod PŮVODNÍM
  // slugem. Dřív se bral nový slug → podmínka se nikdy nesplnila, stará cache zůstala.
  it('N-38 — rename smaže detail cache pod původním slugem', async () => {
    vi.mocked(api.patch).mockResolvedValue({ slug: 'novy-slug' } as Page);
    const { wrapper, qc } = makeWrapperWithQc();
    const remove = vi.spyOn(qc, 'removeQueries');
    const { result } = renderHook(() => useUpdatePage('w1', 'svet-1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'p1',
        input: {},
        previousSlug: 'stary-slug',
      });
    });
    const keys = remove.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(pagesQueryKey.detail('w1', 'stary-slug'));
  });
});
