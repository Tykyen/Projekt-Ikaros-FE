import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useReportPost } from './useDiscussions';
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
  vi.mocked(api.post).mockResolvedValue({} as never);
});

describe('useDiscussions', () => {
  // C-41 — nahlášení příspěvku se musí objevit v moderátorské frontě + badge
  // (['pending-actions']). Bez té invalidace report nezviditelnil pending akci.
  it('C-41 — report post invaliduje pending-actions frontu', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useReportPost(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'd1',
        postId: 'p1',
        reason: 'spam',
      });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pending-actions']);
  });
});
