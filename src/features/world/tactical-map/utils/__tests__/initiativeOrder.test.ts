import { describe, it, expect } from 'vitest';
import { combatantName, sortByInitiativeDesc } from '../initiativeOrder';
import type { MapToken } from '../../types';

function tok(p: Partial<MapToken>): MapToken {
  return { id: 'x', initiative: 0, ...p } as MapToken;
}

describe('combatantName', () => {
  it('preferuje instanceName', () => {
    expect(
      combatantName(tok({ instanceName: 'Goblin', characterData: { name: 'X', imageUrl: '', diaryData: {} } })),
    ).toBe('Goblin');
  });
  it('fallback na characterData.name', () => {
    expect(
      combatantName(tok({ characterData: { name: 'Aragorn', imageUrl: '', diaryData: {} } })),
    ).toBe('Aragorn');
  });
  it('fallback na ? když nic', () => {
    expect(combatantName(tok({}))).toBe('?');
  });
});

describe('sortByInitiativeDesc', () => {
  it('řadí sestupně dle iniciativy', () => {
    const out = sortByInitiativeDesc([
      tok({ id: 'a', initiative: 5 }),
      tok({ id: 'b', initiative: 12 }),
      tok({ id: 'c', initiative: 8 }),
    ]);
    expect(out.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('shoda iniciativy → tie-break dle jména', () => {
    const out = sortByInitiativeDesc([
      tok({ id: 'a', initiative: 10, instanceName: 'Zebra' }),
      tok({ id: 'b', initiative: 10, instanceName: 'Antilopa' }),
    ]);
    expect(out.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('nemutuje vstupní pole', () => {
    const input = [tok({ id: 'a', initiative: 1 }), tok({ id: 'b', initiative: 2 })];
    sortByInitiativeDesc(input);
    expect(input.map((t) => t.id)).toEqual(['a', 'b']);
  });
});
