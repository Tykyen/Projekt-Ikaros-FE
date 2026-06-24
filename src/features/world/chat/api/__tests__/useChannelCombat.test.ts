import { describe, it, expect } from 'vitest';
import { sortCombatants, combatantLabel } from '../useChannelCombat';
import type { ChatCombatant } from '../../lib/types';

function bestie(id: string, name: string, initiative: number): ChatCombatant {
  return {
    id,
    kind: 'bestie',
    bestieId: 'b',
    name,
    initiative,
    inCombat: true,
    systemStats: {},
    abilities: [],
    notes: '',
    createdAt: '2026-06-24',
  };
}
function character(id: string, slug: string, initiative: number): ChatCombatant {
  return {
    id,
    kind: 'character',
    characterSlug: slug,
    initiative,
    inCombat: true,
    createdAt: '2026-06-24',
  };
}

describe('combatantLabel', () => {
  it('bestie → snapshot name, postava → slug', () => {
    expect(combatantLabel(bestie('1', 'Skřet', 5))).toBe('Skřet');
    expect(combatantLabel(character('2', 'abi', 5))).toBe('abi');
  });
});

describe('sortCombatants', () => {
  it('řadí dle iniciativy sestupně', () => {
    const out = sortCombatants([
      bestie('a', 'A', 3),
      bestie('b', 'B', 18),
      bestie('c', 'C', 7),
    ]);
    expect(out.map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('tie-break dle jména (cs) při shodné iniciativě', () => {
    const out = sortCombatants([
      bestie('z', 'Žralok', 10),
      bestie('a', 'Argus', 10),
      bestie('m', 'Mág', 10),
    ]);
    expect(out.map((c) => c.id)).toEqual(['a', 'm', 'z']);
  });

  it('nemutuje vstupní pole', () => {
    const input = [bestie('a', 'A', 1), bestie('b', 'B', 2)];
    const snapshot = input.map((c) => c.id);
    sortCombatants(input);
    expect(input.map((c) => c.id)).toEqual(snapshot);
  });
});
