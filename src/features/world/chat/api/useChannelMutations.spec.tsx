/**
 * Testy reorder hooků (krok 6.5a/b) — optimistic update + rollback.
 *
 * Mockujeme `apiClient` na úrovni modulu (`@/shared/api/client`); ostatní API
 * (`useWorldChat` query key) je nevýznamná pro test, stačí seed cache ručně.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useReorderGroups,
  useReorderChannels,
} from './useChannelMutations';
import { worldChatKeys } from './useWorldChat';
import type { GroupWithChannels } from '../lib/types';

vi.mock('@/shared/api/client', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '@/shared/api/client';

const seedGroups: GroupWithChannels[] = [
  {
    group: { id: 'g1', worldId: 'w1', name: 'A', order: 0 },
    channels: [
      {
        id: 'c1',
        groupId: 'g1',
        worldId: 'w1',
        name: 'a-1',
        isGlobal: false,
        accessMode: 'all',
        allowedRoles: [],
        allowedMemberIds: [],
        order: 0,
        type: 'all',
      },
      {
        id: 'c2',
        groupId: 'g1',
        worldId: 'w1',
        name: 'a-2',
        isGlobal: false,
        accessMode: 'all',
        allowedRoles: [],
        allowedMemberIds: [],
        order: 1,
        type: 'all',
      },
    ],
  },
  {
    group: { id: 'g2', worldId: 'w1', name: 'B', order: 1 },
    channels: [],
  },
];

function mkWrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useReorderGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('optimistic update přerovná kanály v cache před BE odpovědí', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(worldChatKeys('w1').groups, seedGroups);
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderGroups('w1'), {
      wrapper: mkWrapper(qc),
    });

    await act(async () => {
      await result.current.mutateAsync([
        { id: 'g2', order: 0 },
        { id: 'g1', order: 1 },
      ]);
    });

    const next = qc.getQueryData<GroupWithChannels[]>(
      worldChatKeys('w1').groups,
    );
    expect(next?.map((g) => g.group.id)).toEqual(['g2', 'g1']);
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/chat/groups/reorder',
      { items: [{ id: 'g2', order: 0 }, { id: 'g1', order: 1 }] },
    );
  });

  it('rollback při BE chybě — cache se vrátí na původní stav', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(worldChatKeys('w1').groups, seedGroups);
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('500'),
    );

    const { result } = renderHook(() => useReorderGroups('w1'), {
      wrapper: mkWrapper(qc),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync([
          { id: 'g2', order: 0 },
          { id: 'g1', order: 1 },
        ]);
      } catch {
        /* expected */
      }
    });

    await waitFor(() => {
      const next = qc.getQueryData<GroupWithChannels[]>(
        worldChatKeys('w1').groups,
      );
      expect(next?.map((g) => g.group.id)).toEqual(['g1', 'g2']);
    });
  });
});

describe('useReorderChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('optimistic update přerovná jen channels daného kanálu', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(worldChatKeys('w1').groups, seedGroups);
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderChannels('w1'), {
      wrapper: mkWrapper(qc),
    });

    await act(async () => {
      await result.current.mutateAsync({
        groupId: 'g1',
        items: [
          { id: 'c2', order: 0 },
          { id: 'c1', order: 1 },
        ],
      });
    });

    const next = qc.getQueryData<GroupWithChannels[]>(
      worldChatKeys('w1').groups,
    );
    expect(next?.find((g) => g.group.id === 'g1')?.channels.map((c) => c.id))
      .toEqual(['c2', 'c1']);
    expect(api.post).toHaveBeenCalledWith(
      '/worlds/w1/chat/channels/reorder',
      { items: [{ id: 'c2', order: 0 }, { id: 'c1', order: 1 }] },
    );
  });
});
