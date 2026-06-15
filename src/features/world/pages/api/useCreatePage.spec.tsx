import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useCreatePage, type CreatePageInput } from './useCreatePage';
import type { Page } from './pages.types';
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

describe('useCreatePage', () => {
  // C-15 regrese: postava/NPC se zakládá přes Page → create musí invalidovat
  // i legacy character directory (sidebar nav slot, MembersTab, mapa spawn,
  // TransferModal). Disjunktní `pages`↔`characters` cache po sjednocení 9.1.
  it('C-15 — create stránky invaliduje legacy character directory', async () => {
    vi.mocked(api.post).mockResolvedValue({ slug: 'p1' } as Page);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreatePage('w1', 'svet-1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        slug: 'p1',
        title: 'X',
        type: 'NPC',
      } as CreatePageInput);
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['characters', 'w1', 'directory']);
  });
});
