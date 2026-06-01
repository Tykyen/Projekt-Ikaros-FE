import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import {
  useUniverse,
  useUpdateUniverse,
  useUpdateNodeVisibility,
  universeQueryKey,
} from './useUniverse';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { UniverseMap } from '../types';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

const emptyMap: UniverseMap = {
  id: 'm1',
  worldId: 'w1',
  nodes: [],
  links: [],
};

function makeWrapper(token: string | null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, token);
  const wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUniverse', () => {
  it('zavolá GET /universe?worldId=', async () => {
    vi.mocked(api.get).mockResolvedValue(emptyMap);
    const { wrapper } = makeWrapper('tok');
    const { result } = renderHook(() => useUniverse('w1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/universe?worldId=w1');
  });

  it('není enabled bez tokenu', () => {
    const { wrapper } = makeWrapper(null);
    const { result } = renderHook(() => useUniverse('w1'), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('není enabled bez worldId', () => {
    const { wrapper } = makeWrapper('tok');
    const { result } = renderHook(() => useUniverse(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useUpdateUniverse', () => {
  it('PUT full replace a zapíše výsledek do cache', async () => {
    const saved: UniverseMap = {
      ...emptyMap,
      nodes: [
        {
          id: 'a',
          name: 'A',
          color: '#fff',
          size: 5,
          isPublic: true,
          visibleToPlayerIds: [],
        },
      ],
    };
    vi.mocked(api.put).mockResolvedValue(saved);
    const { wrapper, qc } = makeWrapper('tok');
    const { result } = renderHook(() => useUpdateUniverse('w1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ nodes: saved.nodes, links: [] });
    });
    expect(api.put).toHaveBeenCalledWith('/universe?worldId=w1', {
      nodes: saved.nodes,
      links: [],
    });
    expect(qc.getQueryData(universeQueryKey('w1'))).toEqual(saved);
  });
});

describe('useUpdateNodeVisibility', () => {
  it('PATCH .../nodes/:id/visibility s tělem isPublic + visibleToPlayerIds', async () => {
    vi.mocked(api.patch).mockResolvedValue(emptyMap);
    const { wrapper } = makeWrapper('tok');
    const { result } = renderHook(() => useUpdateNodeVisibility('w1'), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        nodeId: 'earth',
        isPublic: false,
        visibleToPlayerIds: ['u1'],
      });
    });
    expect(api.patch).toHaveBeenCalledWith(
      '/universe/w1/nodes/earth/visibility',
      { isPublic: false, visibleToPlayerIds: ['u1'] },
    );
  });
});
