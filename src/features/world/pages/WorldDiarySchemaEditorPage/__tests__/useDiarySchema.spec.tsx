import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { api } from '@/shared/api/client';
import {
  useDiarySchemaVersions,
  useCreateDiarySchemaVersion,
  useActiveDiarySchema,
} from '../api/useDiarySchema';

vi.mock('@/shared/store/authStore', () => ({
  accessTokenAtom: { debugLabel: 'token' },
  refreshTokenAtom: { debugLabel: 'refresh' },
}));
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jotai')>();
  return { ...actual, useAtomValue: () => 'fake-token' };
});

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useDiarySchemaVersions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchne seznam meta verzí', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValue([
      { version: 2, system: 'dnd5e', archivedAt: null },
      { version: 1, system: 'dnd5e', archivedAt: '2026-05-20' },
    ]);
    const { result } = renderHook(() => useDiarySchemaVersions('w1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBe(2);
    });
    expect(spy).toHaveBeenCalledWith('/worlds/w1/diary-schema-versions');
  });
});

describe('useActiveDiarySchema (derived)', () => {
  it('vybere nejvyšší verzi s archivedAt=null', async () => {
    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url.endsWith('/diary-schema-versions')) {
        return Promise.resolve([
          { version: 3, system: 'dnd5e', archivedAt: null },
          { version: 2, system: 'dnd5e', archivedAt: '2026-05-10' },
          { version: 1, system: 'dnd5e', archivedAt: '2026-05-01' },
        ]);
      }
      return Promise.resolve({
        id: 'v3',
        worldId: 'w1',
        version: 3,
        system: 'dnd5e',
        schema: [],
        archivedAt: null,
      });
    });

    const { result } = renderHook(() => useActiveDiarySchema('w1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.activeMeta).toBeDefined());
    expect(result.current.activeMeta?.version).toBe(3);
  });
});

describe('useCreateDiarySchemaVersion', () => {
  it('POSTne body a invaliduje cache', async () => {
    const spy = vi.spyOn(api, 'post').mockResolvedValue({
      id: 'v2',
      worldId: 'w1',
      version: 2,
      system: 'dnd5e',
      schema: [],
      archivedAt: null,
    });
    const { result } = renderHook(() => useCreateDiarySchemaVersion('w1'), {
      wrapper: makeWrapper(),
    });
    await result.current.mutateAsync({ schema: [] });
    expect(spy).toHaveBeenCalledWith('/worlds/w1/diary-schema-versions', {
      schema: [],
    });
  });
});
