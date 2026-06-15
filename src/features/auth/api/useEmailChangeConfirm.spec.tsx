import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useEmailChangeConfirm } from './useEmailChangeConfirm';
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
});

describe('useEmailChangeConfirm', () => {
  // C-30 — invalidace [users, me] musí být v hooku (onSuccess), aby přežila
  // unmount stránky. Dřív byla na call-site `.then()` → po navigaci pryč se cache
  // neobnovila a ProfileHeader držel starý e-mail.
  it('C-30 — confirm invaliduje users/me cache', async () => {
    vi.mocked(api.post).mockResolvedValue({ ok: true } as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useEmailChangeConfirm(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('token-abc');
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['users', 'me']);
  });
});
