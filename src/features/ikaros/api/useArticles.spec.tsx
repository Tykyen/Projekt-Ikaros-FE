import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useApproveArticle,
  useRateArticle,
  useDeleteArticle,
  ARTICLES_KEY,
} from './useArticles';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn(), delete: vi.fn() },
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
  vi.mocked(api.post).mockResolvedValue({} as never);
  vi.mocked(api.delete).mockResolvedValue({} as never);
});

describe('useArticles', () => {
  // C-38 — approve = nový Published článek → musí se přepočítat badge nepřečtených
  // (['article-reads','unread-count']). Bez té invalidace zůstal badge o 1 níž.
  it('C-38 — approve invaliduje badge nepřečtených', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useApproveArticle(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('a1');
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['article-reads', 'unread-count']);
  });

  // C-39 — průměr hvězdiček je i na kartách v Přehledu + author sidebaru, takže
  // rate musí invalidovat celý ARTICLES_KEY namespace, ne jen detail.
  it('C-39 — rate invaliduje seznam (ARTICLES_KEY), ne jen detail', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useRateArticle(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'a1', stars: 4 });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(ARTICLES_KEY);
  });
});

describe('useDeleteArticle', () => {
  // C-42 — smazání Published článku mění počet nepřečtených → musí invalidovat
  // badge `['article-reads','unread-count']`, ne jen seznam článků.
  it('C-42 — delete invaliduje badge nepřečtených', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteArticle(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('a1');
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['article-reads', 'unread-count']);
  });
});
