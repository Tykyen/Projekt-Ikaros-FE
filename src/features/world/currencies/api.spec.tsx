import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useUpdateCurrencies, worldCurrenciesQueryKey } from './api';
import type { WorldCurrenciesPayload, WorldCurrencyItem } from './types';
import { api } from '@/shared/api/client';
import { toast } from 'sonner';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  // Fake conflict-detekce — spec posílá chybu jako `{ code }` objekt.
  parseApiErrorCode: (err: unknown) =>
    (err as { code?: string } | null)?.code ?? null,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
];

const UPDATED_AT = '2026-07-12T10:00:00.000Z';

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

describe('useUpdateCurrencies — optimistic lock (D-NEW-INV-DATA-SYNC)', () => {
  it('PUT posílá expectedUpdatedAt z posledního GET (cache)', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    qc.setQueryData<WorldCurrenciesPayload>(worldCurrenciesQueryKey('w1'), {
      worldId: 'w1',
      items,
      updatedAt: UPDATED_AT,
    });
    vi.mocked(api.put).mockResolvedValue({
      worldId: 'w1',
      items,
      updatedAt: '2026-07-12T11:00:00.000Z',
    } as never);
    const { result } = renderHook(() => useUpdateCurrencies('w1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ items });
    });
    expect(api.put).toHaveBeenCalledWith('/worlds/w1/currencies', {
      items,
      expectedUpdatedAt: UPDATED_AT,
    });
  });

  it('bez updatedAt v cache (placeholder) → PUT bez expectedUpdatedAt', async () => {
    const { wrapper } = makeWrapperWithQc();
    vi.mocked(api.put).mockResolvedValue({ worldId: 'w1', items } as never);
    const { result } = renderHook(() => useUpdateCurrencies('w1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ items });
    });
    const body = vi.mocked(api.put).mock.calls[0][1];
    expect(body).not.toHaveProperty('expectedUpdatedAt');
  });

  it('409 CURRENCY_CONFLICT → friendly toast + rollback + refetch (invalidate)', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    const key = worldCurrenciesQueryKey('w1');
    qc.setQueryData<WorldCurrenciesPayload>(key, {
      worldId: 'w1',
      items,
      updatedAt: UPDATED_AT,
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    vi.mocked(api.put).mockRejectedValue({ code: 'CURRENCY_CONFLICT' });
    const { result } = renderHook(() => useUpdateCurrencies('w1'), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ items: [] }),
      ).rejects.toMatchObject({ code: 'CURRENCY_CONFLICT' });
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Měny mezitím upravil někdo jiný — načítám aktuální stav.',
    );
    // Rollback optimistic update na stav před mutací…
    expect(qc.getQueryData<WorldCurrenciesPayload>(key)?.items).toEqual(items);
    // …a invalidace → refetch aktuálního stavu z BE.
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c) => c[0]?.queryKey,
    );
    expect(invalidatedKeys).toContainEqual(key);
  });

  it('jiná chyba než conflict → žádný conflict toast', async () => {
    const { wrapper } = makeWrapperWithQc();
    vi.mocked(api.put).mockRejectedValue({ code: 'CURRENCY_CODE_DUPLICATE' });
    const { result } = renderHook(() => useUpdateCurrencies('w1'), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ items }),
      ).rejects.toMatchObject({ code: 'CURRENCY_CODE_DUPLICATE' });
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});
