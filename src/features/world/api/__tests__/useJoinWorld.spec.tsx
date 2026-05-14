import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useJoinWorld } from '../useJoinWorld';
import { api } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  api: { post: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, invalidateSpy };
}

describe('useJoinWorld (Spec 2.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('success → invaliduje worlds/my a worlds/:id', async () => {
    vi.mocked(api.post).mockResolvedValue({ membership: { id: 'm1' } });
    const { Wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useJoinWorld(), { wrapper: Wrapper });
    await result.current.mutateAsync('w1');

    expect(api.post).toHaveBeenCalledWith('/worlds/w1/join', {});
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['worlds', 'my'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['worlds', 'w1'],
      });
    });
  });

  it('error → propagate, queries se neinvalidují', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'));
    const { Wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useJoinWorld(), { wrapper: Wrapper });
    await expect(result.current.mutateAsync('w1')).rejects.toThrow('boom');
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
