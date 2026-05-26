import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEntityIndex } from '../hooks/useEntityIndex';

/* eslint-disable @typescript-eslint/no-explicit-any */
const baseEvent = (over: any): any => over;

describe('useEntityIndex (9.4)', () => {
  it('prázdné events → totalCount 0', () => {
    const { result } = renderHook(() => useEntityIndex([]));
    expect(result.current.totalCount).toBe(0);
    expect(result.current.groups.players).toEqual([]);
  });

  it('agreguje multiple gameEvents do jednoho entry', () => {
    const { result } = renderHook(() =>
      useEntityIndex([
        baseEvent({ origin: { kind: 'gameEvent' } }),
        baseEvent({ origin: { kind: 'gameEvent' } }),
        baseEvent({ origin: { kind: 'gameEvent' } }),
      ]),
    );
    expect(result.current.groups.gameEvents).toHaveLength(1);
    expect(result.current.groups.gameEvents[0].id).toBe('game-events');
    expect(result.current.groups.gameEvents[0].eventCount).toBe(3);
  });

  it('rozliší players / npcs / locations správně', () => {
    const { result } = renderHook(() =>
      useEntityIndex([
        baseEvent({
          origin: {
            kind: 'character',
            raw: { characterId: 'p1', name: 'Hráč', color: '#f00', kind: 'persona', isNpc: false },
          },
        }),
        baseEvent({
          origin: {
            kind: 'character',
            raw: { characterId: 'n1', name: 'NPC', color: '#0f0', kind: 'persona', isNpc: true },
          },
        }),
        baseEvent({
          origin: {
            kind: 'character',
            raw: { characterId: 'l1', name: 'Místo', color: '#00f', kind: 'location', isNpc: false },
          },
        }),
      ]),
    );
    expect(result.current.groups.players).toHaveLength(1);
    expect(result.current.groups.players[0].name).toBe('Hráč');
    expect(result.current.groups.npcs).toHaveLength(1);
    expect(result.current.groups.npcs[0].name).toBe('NPC');
    expect(result.current.groups.locations).toHaveLength(1);
    expect(result.current.groups.locations[0].name).toBe('Místo');
  });

  it('řadí entity v group abecedně (cs locale)', () => {
    const { result } = renderHook(() =>
      useEntityIndex([
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'a', name: 'Žofie', color: '#000', kind: 'persona', isNpc: false } },
        }),
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'b', name: 'Adam', color: '#000', kind: 'persona', isNpc: false } },
        }),
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'c', name: 'Č', color: '#000', kind: 'persona', isNpc: false } },
        }),
      ]),
    );
    expect(result.current.groups.players.map((e) => e.name)).toEqual(['Adam', 'Č', 'Žofie']);
  });

  it('search vrátí matchující entity case-insensitive', () => {
    const { result } = renderHook(() =>
      useEntityIndex([
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'p1', name: 'Krásná elfka', color: '#fff', kind: 'persona', isNpc: false } },
        }),
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'n1', name: 'Vesmírná stanice', color: '#fff', kind: 'persona', isNpc: true } },
        }),
      ]),
    );
    expect(result.current.search('krás')).toHaveLength(1);
    expect(result.current.search('krás')[0].name).toBe('Krásná elfka');
    expect(result.current.search('VESM')).toHaveLength(1);
    expect(result.current.search('xxx')).toEqual([]);
    expect(result.current.search('')).toEqual([]);
  });

  it('agreguje eventCount per characterId', () => {
    const { result } = renderHook(() =>
      useEntityIndex([
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'p1', name: 'Elfka', color: '#fff', kind: 'persona', isNpc: false } },
        }),
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'p1', name: 'Elfka', color: '#fff', kind: 'persona', isNpc: false } },
        }),
        baseEvent({
          origin: { kind: 'character', raw: { characterId: 'p1', name: 'Elfka', color: '#fff', kind: 'persona', isNpc: false } },
        }),
      ]),
    );
    expect(result.current.groups.players[0].eventCount).toBe(3);
  });
});
