import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  useDeleteCharacter,
  useUpdateCharacterCalendar,
  useUpdateCharacterDiary,
} from './useCharacterMutations';
import { charactersQueryKey } from './characters.types';
import { api } from '@/shared/api/client';
import { toast } from 'sonner';

vi.mock('@/shared/api/client', () => ({
  api: { delete: vi.fn(), put: vi.fn(), patch: vi.fn() },
  // Fake parsery — spec posílá chybu jako `{ code }` / `{ message }` objekt.
  parseApiError: (err: unknown) =>
    (err as { message?: string } | null)?.message ?? 'Neznámá chyba',
  parseApiErrorCode: (err: unknown) =>
    (err as { code?: string } | null)?.code ?? null,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

describe('useDeleteCharacter', () => {
  // C-20 — primární grid postav je servírovaný z Page projekce (persona), takže
  // mutace postavy musí invalidovat i `['pages',worldId,'directory']`, ne jen
  // character directory. Bez toho zůstal persona grid stale.
  it('C-20 — mazání postavy invaliduje persona grid (pages directory)', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    const { wrapper, qc } = makeWrapperWithQc();
    const inval = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteCharacter('w1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('slug-1');
    });
    const keys = inval.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['pages', 'w1', 'directory']);
  });
});

describe('useUpdateCharacterCalendar', () => {
  // C-22 — agregátní kalendář (PJ view) je samostatný namespace
  // ['calendars-aggregate', worldId], který character-scoped klíče netrefí.
  // Bez té invalidace PJ agregace po editaci kalendáře postavy zůstala stale.
  it('C-22 — update kalendáře postavy invaliduje agregátní kalendář', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: 'cal1' } as never);
    const { wrapper, qc } = makeWrapperWithQc();
    const inval = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(
      () => useUpdateCharacterCalendar('w1', 'slug-1'),
      { wrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({ events: [] });
    });
    const keys = inval.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['calendars-aggregate', 'w1']);
  });
});

// 29.1 (D-DIARY-HP-DELTA) — optimistic lock nad deníkovou HP cestou.
describe('useUpdateCharacterDiary — optimistic lock (29.1)', () => {
  const DIARY_AT = '2026-07-24T10:00:00.000Z';
  const diaryKey = charactersQueryKey.subdoc('w1', 'slug-1', 'diary');

  it('PATCH posílá expectedUpdatedAt z diary cache (updatedAt)', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    qc.setQueryData(diaryKey, {
      id: 'd1',
      updatedAt: DIARY_AT,
      customData: {},
    });
    vi.mocked(api.patch).mockResolvedValue({ id: 'd1' } as never);
    const { result } = renderHook(
      () => useUpdateCharacterDiary('w1', 'slug-1'),
      { wrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({ customDataPatch: { drdh_hp: '5' } });
    });
    expect(api.patch).toHaveBeenCalledWith(
      '/worlds/w1/characters/slug-1/diary',
      { customDataPatch: { drdh_hp: '5' }, expectedUpdatedAt: DIARY_AT },
    );
  });

  it('bez updatedAt v cache (legacy) → PATCH bez expectedUpdatedAt', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    qc.setQueryData(diaryKey, { id: 'd1', customData: {} });
    vi.mocked(api.patch).mockResolvedValue({ id: 'd1' } as never);
    const { result } = renderHook(
      () => useUpdateCharacterDiary('w1', 'slug-1'),
      { wrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({ customDataPatch: { drdh_hp: '5' } });
    });
    const body = vi.mocked(api.patch).mock.calls[0][1];
    expect(body).not.toHaveProperty('expectedUpdatedAt');
  });

  it('409 DIARY_CONFLICT → friendly toast + refetch (invalidate diary)', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    qc.setQueryData(diaryKey, {
      id: 'd1',
      updatedAt: DIARY_AT,
      customData: {},
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    vi.mocked(api.patch).mockRejectedValue({ code: 'DIARY_CONFLICT' });
    const { result } = renderHook(
      () => useUpdateCharacterDiary('w1', 'slug-1'),
      { wrapper },
    );
    await act(async () => {
      await expect(
        result.current.mutateAsync({ customDataPatch: { drdh_hp: '5' } }),
      ).rejects.toMatchObject({ code: 'DIARY_CONFLICT' });
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Deník mezitím upravil někdo jiný — načítám aktuální stav.',
    );
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c) => c[0]?.queryKey,
    );
    expect(invalidatedKeys).toContainEqual(diaryKey);
  });

  it('jiná chyba než conflict → generický toast, žádný refetch', async () => {
    const { wrapper, qc } = makeWrapperWithQc();
    qc.setQueryData(diaryKey, {
      id: 'd1',
      updatedAt: DIARY_AT,
      customData: {},
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    vi.mocked(api.patch).mockRejectedValue({ message: 'Něco selhalo' });
    const { result } = renderHook(
      () => useUpdateCharacterDiary('w1', 'slug-1'),
      { wrapper },
    );
    await act(async () => {
      await expect(
        result.current.mutateAsync({ customDataPatch: { drdh_hp: '5' } }),
      ).rejects.toBeDefined();
    });
    expect(toast.error).toHaveBeenCalledWith('Něco selhalo');
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c) => c[0]?.queryKey,
    );
    expect(invalidatedKeys).not.toContainEqual(diaryKey);
  });
});
