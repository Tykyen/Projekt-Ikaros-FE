import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useCreateCalendarConfig } from './useCalendarConfigs';
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

describe('useCreateCalendarConfig', () => {
  // C-11 — agregátní kalendář (PJ view) je samostatný namespace; create configu
  // musí invalidovat i ['calendars-aggregate', worldId], jinak PJ agregát zůstal stale.
  it('C-11 — create configu invaliduje agregátní kalendář (separátní namespace)', async () => {
    vi.mocked(api.post).mockResolvedValue({} as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateCalendarConfig('w1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ slug: 'k1', name: 'X' } as never);
    });
    const keys = spy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['calendars-aggregate', 'w1']);
  });
});
