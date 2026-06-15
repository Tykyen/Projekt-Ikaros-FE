import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useRateGalleryImage, GALLERY_KEY } from './useGallery';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn() },
  apiClient: { post: vi.fn() },
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
  vi.mocked(api.post).mockResolvedValue({ averageRating: 4, totalRatings: 1 } as never);
});

describe('useGallery', () => {
  // C-39 — průměr hvězdiček je i na kartách v Galerii přehledu, takže rate musí
  // invalidovat celý GALLERY_KEY namespace, ne jen detail.
  it('C-39 — rate invaliduje seznam (GALLERY_KEY), ne jen detail', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useRateGalleryImage(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'g1', stars: 5 });
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(GALLERY_KEY);
  });
});
