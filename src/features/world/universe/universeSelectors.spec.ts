import { describe, it, expect } from 'vitest';
import { connectionsOf, sortedByName } from './universeSelectors';
import type { UniverseNode, UniverseLink } from './types';

function n(id: string, name = id): UniverseNode {
  return {
    id,
    name,
    color: '#fff',
    size: 5,
    isPublic: true,
    visibleToPlayerIds: [],
  };
}

const nodes = [n('a', 'Alfa'), n('b', 'Beta'), n('c', 'Cygnus')];
const links: UniverseLink[] = [
  { source: 'a', target: 'c', isOrbit: false },
  { source: 'b', target: 'a', isOrbit: true },
];

describe('connectionsOf', () => {
  it('vrátí napojené uzly seřazené dle jména', () => {
    const res = connectionsOf('a', links, nodes);
    expect(res.map((c) => c.node.id)).toEqual(['b', 'c']);
  });

  it('zachová isOrbit příznak správné hrany', () => {
    const res = connectionsOf('a', links, nodes);
    expect(res.find((c) => c.node.id === 'b')?.isOrbit).toBe(true);
    expect(res.find((c) => c.node.id === 'c')?.isOrbit).toBe(false);
  });

  it('ignoruje hrany na neexistující uzel', () => {
    const res = connectionsOf('a', [{ source: 'a', target: 'x', isOrbit: false }], nodes);
    expect(res).toHaveLength(0);
  });

  it('uzel bez hran → prázdné', () => {
    expect(connectionsOf('c', [], nodes)).toHaveLength(0);
  });
});

describe('sortedByName', () => {
  it('seřadí dle jména a nemutuje vstup', () => {
    const input = [n('z', 'Zeta'), n('a', 'Alfa')];
    const out = sortedByName(input);
    expect(out.map((x) => x.name)).toEqual(['Alfa', 'Zeta']);
    expect(input[0].name).toBe('Zeta');
  });
});
