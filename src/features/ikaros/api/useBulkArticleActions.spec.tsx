import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useBulkApproveArticles, useBulkRejectArticles } from './useBulkArticleActions';
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
  vi.mocked(api.post).mockResolvedValue({ succeeded: [], failed: [] } as never);
});

describe('useBulkArticleActions', () => {
  // C-37 — dead key ['articles','pending'] nahrazen review frontou ['pending-actions']
  // (badge + moderátorská fronta). Bez té invalidace badge po bulk akci zůstal stale.
  it('C-37 — bulk approve invaliduje pending-actions frontu', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useBulkApproveArticles(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(['a1', 'a2']);
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });

  it('C-37 — bulk reject invaliduje pending-actions frontu', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useBulkRejectArticles(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ ids: ['a1'], reason: 'spam' });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });
});
