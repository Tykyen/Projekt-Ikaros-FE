import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useCombat } from '../useCombat';
import type { MapScene, MapToken } from '../../types';

const postMapOperation = vi.fn();
vi.mock('../../api/mapApi', () => ({
  postMapOperation: (sceneId: string, op: unknown) =>
    postMapOperation(sceneId, op),
}));

function token(over: Partial<MapToken>): MapToken {
  // default = NPC (characterId reálné, ne bestie) → inCombat řídí účast.
  // PC testy nastaví isNpc:false.
  return {
    id: 'x',
    characterId: 'c1',
    isNpc: true,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    ...over,
  } as MapToken;
}

function scene(over: Partial<MapScene>): MapScene {
  return {
    id: 'scene-1',
    worldId: 'w1',
    tokens: [],
    combat: null,
    ...over,
  } as MapScene;
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  postMapOperation.mockReset();
  postMapOperation.mockResolvedValue({});
});

describe('useCombat — combatants derivace', () => {
  it('Stav A (boj neaktivní) — jen inCombat, seřazené dle initiative desc', () => {
    const s = scene({
      tokens: [
        token({ id: 'a', inCombat: true, initiative: 5 }),
        token({ id: 'b', inCombat: false, initiative: 99 }),
        token({ id: 'c', inCombat: true, initiative: 14 }),
      ],
    });
    const { result } = renderHook(() => useCombat(s, 'w1'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.combatants.map((t) => t.id)).toEqual(['c', 'a']);
    expect(result.current.isActive).toBe(false);
  });

  it('Stav B (boj aktivní) — ŽIVÝ sort dle initiative, NE combat.order', () => {
    const s = scene({
      tokens: [
        token({ id: 'a', inCombat: true, initiative: 5 }),
        token({ id: 'c', inCombat: true, initiative: 14 }),
      ],
      combat: {
        isActive: true,
        round: 2,
        currentTokenId: 'a',
        order: ['a', 'c'], // zastaralý snapshot — ignoruje se
        endOfTurnEffects: [],
      },
    });
    const { result } = renderHook(() => useCombat(s, 'w1'), {
      wrapper: makeWrapper(),
    });
    // živý sort: c(14) > a(5) — i když order říká ['a','c']
    expect(result.current.combatants.map((t) => t.id)).toEqual(['c', 'a']);
    expect(result.current.isActive).toBe(true);
    expect(result.current.round).toBe(2);
    expect(result.current.currentTokenId).toBe('a');
  });

  it('PC je v boji VŽDY (i s inCombat=false); NPC mimo boj jde do bench', () => {
    const s = scene({
      tokens: [
        token({ id: 'pc', isNpc: false, characterId: 'cpc', inCombat: false, initiative: 8 }),
        token({ id: 'npc', isNpc: true, inCombat: false, initiative: 99 }),
      ],
    });
    const { result } = renderHook(() => useCombat(s, 'w1'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.combatants.map((t) => t.id)).toEqual(['pc']);
    expect(result.current.bench.map((t) => t.id)).toEqual(['npc']);
  });

  it('nově zařazený token (inCombat) se objeví hned i za boje', () => {
    const s = scene({
      tokens: [
        token({ id: 'a', inCombat: true, initiative: 5 }),
        token({ id: 'new', inCombat: true, initiative: 20 }), // přidán za boje
      ],
      combat: {
        isActive: true,
        round: 1,
        currentTokenId: 'a',
        order: ['a'], // order ho nezná
        endOfTurnEffects: [],
      },
    });
    const { result } = renderHook(() => useCombat(s, 'w1'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.combatants.map((t) => t.id)).toEqual(['new', 'a']);
  });
});

describe('useCombat — akce → operace', () => {
  // aktivní boj; živé pořadí = c(14) → a(5) → b(2)
  const sActive = scene({
    tokens: [
      token({ id: 'a', inCombat: true, initiative: 5 }),
      token({ id: 'c', inCombat: true, initiative: 14 }),
      token({ id: 'b', inCombat: true, initiative: 2 }),
    ],
    combat: {
      isActive: true,
      round: 2,
      currentTokenId: 'c',
      order: ['c', 'a', 'b'],
      endOfTurnEffects: [],
    },
  });

  it('start() pošle combat.start s orderTokenIds dle sortu', async () => {
    const s = scene({
      tokens: [
        token({ id: 'a', inCombat: true, initiative: 5 }),
        token({ id: 'c', inCombat: true, initiative: 14 }),
      ],
    });
    const { result } = renderHook(() => useCombat(s, 'w1'), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.start());
    await waitFor(() => expect(postMapOperation).toHaveBeenCalled());
    expect(postMapOperation).toHaveBeenCalledWith('scene-1', {
      type: 'combat.start',
      orderTokenIds: ['c', 'a'],
    });
  });

  it('nextTurn() pošle combat.turn s dalším tokenem (živé pořadí), beze změny kola', async () => {
    const { result } = renderHook(() => useCombat(sActive, 'w1'), {
      wrapper: makeWrapper(),
    });
    // current = c (idx 0) → další = a (idx 1), bez wrapu → round zůstává 2
    act(() => result.current.nextTurn());
    await waitFor(() => expect(postMapOperation).toHaveBeenCalled());
    expect(postMapOperation).toHaveBeenCalledWith('scene-1', {
      type: 'combat.turn',
      tokenId: 'a',
      round: 2,
    });
  });

  it('nextTurn() na posledním → wrap na prvního + round+1', async () => {
    const sLast = scene({
      tokens: [
        token({ id: 'a', inCombat: true, initiative: 5 }),
        token({ id: 'c', inCombat: true, initiative: 14 }),
      ],
      combat: {
        isActive: true,
        round: 3,
        currentTokenId: 'a', // a je poslední (c14 > a5)
        order: ['c', 'a'],
        endOfTurnEffects: [],
      },
    });
    const { result } = renderHook(() => useCombat(sLast, 'w1'), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.nextTurn());
    await waitFor(() => expect(postMapOperation).toHaveBeenCalled());
    expect(postMapOperation).toHaveBeenCalledWith('scene-1', {
      type: 'combat.turn',
      tokenId: 'c', // wrap na prvního
      round: 4, // round+1
    });
  });

  it('jumpTo() pošle combat.turn s tokenId + aktuální round', async () => {
    const { result } = renderHook(() => useCombat(sActive, 'w1'), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.jumpTo('b'));
    await waitFor(() => expect(postMapOperation).toHaveBeenCalled());
    expect(postMapOperation).toHaveBeenCalledWith('scene-1', {
      type: 'combat.turn',
      tokenId: 'b',
      round: 2,
    });
  });

  it('end() pošle combat.end', async () => {
    const { result } = renderHook(() => useCombat(sActive, 'w1'), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.end());
    await waitFor(() => expect(postMapOperation).toHaveBeenCalled());
    expect(postMapOperation).toHaveBeenCalledWith('scene-1', {
      type: 'combat.end',
    });
  });
});
