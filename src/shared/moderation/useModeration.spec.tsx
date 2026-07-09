import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useCreateReport } from './useModeration';
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
  vi.mocked(api.post).mockResolvedValue({ id: 'r1' } as never);
});

describe('useCreateReport', () => {
  // C-41 (B4d) — nahlášení obsahu (i příspěvku diskuze přes generický
  // ReportButton) se musí objevit v moderátorské frontě + badge
  // (['pending-actions']). Bez té invalidace report nezviditelnil pending akci.
  it('C-41 — vytvoření reportu invaliduje pending-actions frontu', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateReport(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        targetType: 'discussion_post',
        targetId: 'p1',
        targetSnapshot: 'obsah',
        targetAuthorName: 'Autor',
        category: 'other',
        reason: 'spam',
        goodFaith: true,
        notifyMe: false,
        anonymous: false,
      });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });
});
