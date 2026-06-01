import { describe, it, expect } from 'vitest';
import {
  connectionsOf,
  sortedByName,
  sanitizeForSave,
  linkEndId,
} from './universeSelectors';
import type { UniverseNode, UniverseLink, UniverseMap } from './types';

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

  it('zvládne hrany, kde force-graph přepsal source/target na node objekty', () => {
    const objLinks = [
      { source: nodes[0], target: nodes[2], isOrbit: false },
    ] as unknown as UniverseLink[];
    const res = connectionsOf('a', objLinks, nodes);
    expect(res.map((c) => c.node.id)).toEqual(['c']);
  });
});

describe('linkEndId', () => {
  it('string → vrátí ho beze změny', () => {
    expect(linkEndId('a')).toBe('a');
  });
  it('node objekt → vrátí jeho id', () => {
    expect(linkEndId({ id: 'b', name: 'Beta' })).toBe('b');
  });
  it('nesmysl → prázdný string', () => {
    expect(linkEndId(null)).toBe('');
    expect(linkEndId({ foo: 1 })).toBe('');
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

describe('sanitizeForSave', () => {
  it('zahodí force-graph balast na uzlech (__threeObj, vx/fx, index)', () => {
    const dirty = {
      ...n('a', 'Alfa'),
      img: 'https://cdn/x.png',
      x: 1,
      y: 2,
      z: 3,
      // force-graph augmentace:
      vx: 9,
      vy: 9,
      vz: 9,
      fx: 1,
      index: 0,
      __threeObj: { huge: 'THREE.Group' },
    } as unknown as UniverseNode;
    const map = { id: 'm', worldId: 'w', nodes: [dirty], links: [] } as UniverseMap;

    const out = sanitizeForSave(map);
    const node = out.nodes[0] as unknown as Record<string, unknown>;
    expect(node.__threeObj).toBeUndefined();
    expect(node.vx).toBeUndefined();
    expect(node.fx).toBeUndefined();
    expect(node.index).toBeUndefined();
    // schema pole zachována (vč. pozice + img)
    expect(node).toMatchObject({
      id: 'a',
      name: 'Alfa',
      img: 'https://cdn/x.png',
      x: 1,
      y: 2,
      z: 3,
    });
  });

  it('link.source/target z node objektu → zpět na id string', () => {
    const a = n('a', 'Alfa');
    const b = n('b', 'Beta');
    // force-graph přepsal stringy na reference na node objekty:
    const dirtyLink = { source: a, target: b, isOrbit: true } as unknown as UniverseLink;
    const map = {
      id: 'm',
      worldId: 'w',
      nodes: [a, b],
      links: [dirtyLink],
    } as UniverseMap;

    const out = sanitizeForSave(map);
    expect(out.links[0]).toEqual({ source: 'a', target: 'b', isOrbit: true });
  });

  it('už čisté stringové hrany nechá být', () => {
    const map = {
      id: 'm',
      worldId: 'w',
      nodes: [n('a'), n('b')],
      links: [{ source: 'a', target: 'b', isOrbit: false }],
    } as UniverseMap;
    expect(sanitizeForSave(map).links[0]).toEqual({
      source: 'a',
      target: 'b',
      isOrbit: false,
    });
  });
});
