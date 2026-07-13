/**
 * useTokenUpdate — D-LAUNCH-GAP delta HP/injury (lost-update fix).
 *
 * Kontrakt: damage/heal posílá `hpDelta`/`injuryDelta` s PRÁZDNÝM `patch`
 * (BE deltu aplikuje atomicky s clampem). Optimistic redraw se počítá z
 * čerstvé cache; zdrojem pravdy je ABSOLUTNÍ `patch.currentHp`/`patch.injury`
 * z normalizované op v 201 response — přepíše optimistický odhad.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useTokenUpdate } from '../useTokenUpdate';
import { mapSceneQueryKey } from '../useMapScene';
import type { MapScene } from '../../types';

const postMapOperation = vi.fn();
vi.mock('../../api/mapApi', () => ({
  postMapOperation: (sceneId: string, op: unknown) =>
    postMapOperation(sceneId, op),
}));

function makeScene(): MapScene {
  return {
    id: 's1',
    worldId: 'w1',
    lastSeqNumber: 1,
    tokens: [
      {
        id: 't1',
        characterId: 'bestie:b1',
        currentHp: 10,
        maxHp: 12,
        injury: 2,
      },
    ],
    effects: [],
    npcTemplates: [],
    revealedHexes: [],
    activeCharacterIds: [],
    activeBestieIds: [],
  } as unknown as MapScene;
}

function setup() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  qc.setQueryData(mapSceneQueryKey('w1'), makeScene());
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useTokenUpdate('s1', 'w1'), { wrapper });
  const cachedHp = (): number | undefined =>
    qc.getQueryData<MapScene>(mapSceneQueryKey('w1'))?.tokens[0]?.currentHp;
  const cachedInjury = (): number | undefined =>
    qc.getQueryData<MapScene>(mapSceneQueryKey('w1'))?.tokens[0]?.injury;
  return { qc, result, cachedHp, cachedInjury };
}

/** 201 response s normalizovanou op (BE doplní absolutní hodnotu do patch). */
function response(patch: Record<string, number>) {
  return {
    recordId: 'r1',
    seqNumber: 2,
    appliedAt: new Date().toISOString(),
    op: { type: 'token.update', tokenId: 't1', patch },
    inverse: null,
  };
}

beforeEach(() => {
  postMapOperation.mockReset();
});

describe('useTokenUpdate — hpDelta/injuryDelta', () => {
  it('emit nese hpDelta a PRÁZDNÝ patch (žádný absolutní currentHp)', async () => {
    postMapOperation.mockResolvedValue(response({ currentHp: 6 }));
    const { result } = setup();
    act(() => result.current.mutate({ tokenId: 't1', hpDelta: -4 }));
    await waitFor(() => expect(postMapOperation).toHaveBeenCalledTimes(1));
    const [sceneId, op] = postMapOperation.mock.calls[0];
    expect(sceneId).toBe('s1');
    expect(op.type).toBe('token.update');
    expect(op.hpDelta).toBe(-4);
    expect(op.patch).toEqual({});
  });

  it('optimistic redraw: delta se aplikuje na ČERSTVOU cache s clampem', async () => {
    // nikdy neresolvne → měříme čistě optimistický stav
    postMapOperation.mockImplementation(() => new Promise(() => {}));
    const { result, cachedHp } = setup();
    act(() => result.current.mutate({ tokenId: 't1', hpDelta: -4 }));
    await waitFor(() => expect(cachedHp()).toBe(6));
    // druhý zásah počítá z už sníženého (6), ne z props: 6 - 9 → clamp 0
    act(() => result.current.mutate({ tokenId: 't1', hpDelta: -9 }));
    await waitFor(() => expect(cachedHp()).toBe(0));
  });

  it('zdroj pravdy: absolutní currentHp z 201 response přepíše optimistický odhad', async () => {
    // Server po atomickém souběhu vrátí JINOU hodnotu (3) než lokální odhad (6).
    postMapOperation.mockResolvedValue(response({ currentHp: 3 }));
    const { result, cachedHp } = setup();
    act(() => result.current.mutate({ tokenId: 't1', hpDelta: -4 }));
    await waitFor(() => expect(cachedHp()).toBe(3));
  });

  it('injuryDelta: optimistic + absolutní injury z response', async () => {
    postMapOperation.mockResolvedValue(response({ injury: 9 }));
    const { result, cachedInjury } = setup();
    act(() => result.current.mutate({ tokenId: 't1', injuryDelta: 5 }));
    await waitFor(() => expect(cachedInjury()).toBe(9));
    const op = postMapOperation.mock.calls[0][1];
    expect(op.injuryDelta).toBe(5);
    expect(op.patch).toEqual({});
  });

  it('absolutní patch (BC): beze změny chování, delta klíče se neposílají', async () => {
    postMapOperation.mockResolvedValue(response({ currentHp: 8 }));
    const { result, cachedHp } = setup();
    act(() =>
      result.current.mutate({ tokenId: 't1', patch: { currentHp: 8 } }),
    );
    await waitFor(() => expect(cachedHp()).toBe(8));
    const op = postMapOperation.mock.calls[0][1];
    expect(op.patch).toEqual({ currentHp: 8 });
    expect(op.hpDelta).toBeUndefined();
    expect(op.injuryDelta).toBeUndefined();
  });

  it('error → rollback optimistického odhadu', async () => {
    postMapOperation.mockRejectedValue(new Error('MAP_OP_INVALID'));
    const { result, cachedHp } = setup();
    act(() => result.current.mutate({ tokenId: 't1', hpDelta: -4 }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cachedHp()).toBe(10);
  });
});
