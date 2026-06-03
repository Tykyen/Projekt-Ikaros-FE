import { describe, it, expect } from 'vitest';
import type { HeadlineNode } from '@/shared/types';
import {
  addGroup,
  addLink,
  headlineToNavGroups,
  isExternalHref,
  makeNodeId,
  moveNode,
  removeNode,
  renameNode,
  setNodeTo,
} from '../headlineNav';

const link = (id: string, label: string, to?: string): HeadlineNode => ({
  id,
  label,
  isGroup: false,
  to,
});
const group = (
  id: string,
  label: string,
  children: HeadlineNode[] = [],
): HeadlineNode => ({ id, label, isGroup: true, children });

describe('isExternalHref', () => {
  it('detekuje http(s) URL', () => {
    expect(isExternalHref('https://x.cz')).toBe(true);
    expect(isExternalHref('http://x.cz')).toBe(true);
  });
  it('interní cesty a prázdné nejsou externí', () => {
    expect(isExternalHref('/svet/a/b')).toBe(false);
    expect(isExternalHref('')).toBe(false);
    expect(isExternalHref(undefined)).toBe(false);
  });
});

describe('headlineToNavGroups', () => {
  it('převede top-level odkaz na nav top link s prefixem custom:', () => {
    const out = headlineToNavGroups([link('1', 'Wiki', '/svet/a/wiki')]);
    expect(out).toEqual([
      { id: 'custom:1', label: 'Wiki', to: '/svet/a/wiki' },
    ]);
  });

  it('skupinu převede na dropdown jen s platnými odkazy', () => {
    const out = headlineToNavGroups([
      group('g', 'Odkazy', [
        link('a', 'A', 'https://a.cz'),
        link('b', 'B'), // bez `to` → vynechán
        link('c', '', '/x'), // bez labelu → vynechán
      ]),
    ]);
    expect(out).toEqual([
      {
        label: 'Odkazy',
        items: [{ label: 'A', to: 'https://a.cz', external: true }],
      },
    ]);
  });

  it('prázdnou skupinu a odkaz bez cíle vynechá', () => {
    const out = headlineToNavGroups([
      group('g', 'Prázdná', []),
      link('l', 'Bez cíle'),
    ]);
    expect(out).toEqual([]);
  });

  it('prázdný/undefined vstup → []', () => {
    expect(headlineToNavGroups(undefined)).toEqual([]);
    expect(headlineToNavGroups([])).toEqual([]);
  });
});

describe('tree operace (immutable)', () => {
  it('addGroup / addLink nemutují vstup', () => {
    const base: HeadlineNode[] = [];
    const g = addGroup(base, 'Sk');
    expect(base).toEqual([]);
    expect(g).toHaveLength(1);
    expect(g[0]!.isGroup).toBe(true);

    const withLink = addLink(g, 'L', '/x', g[0]!.id);
    expect(g[0]!.children).toHaveLength(0); // původní beze změny
    expect(withLink[0]!.children).toHaveLength(1);
  });

  it('addLink groupId=null přidá top-level', () => {
    const out = addLink([], 'L', '/x', null);
    expect(out).toHaveLength(1);
    expect(out[0]!.isGroup).toBe(false);
    expect(out[0]!.to).toBe('/x');
  });

  it('removeNode smaže top-level i child', () => {
    const tree = [group('g', 'G', [link('c', 'C', '/c')]), link('t', 'T', '/t')];
    expect(removeNode(tree, 't')).toHaveLength(1);
    const noChild = removeNode(tree, 'c');
    expect(noChild[0]!.children).toHaveLength(0);
  });

  it('renameNode přejmenuje top-level i child', () => {
    const tree = [group('g', 'G', [link('c', 'C', '/c')])];
    expect(renameNode(tree, 'g', 'G2')[0]!.label).toBe('G2');
    expect(renameNode(tree, 'c', 'C2')[0]!.children![0]!.label).toBe('C2');
  });

  it('setNodeTo změní cíl top-level i child', () => {
    const tree = [link('t', 'T', '/old'), group('g', 'G', [link('c', 'C', '/old')])];
    expect(setNodeTo(tree, 't', '/new')[0]!.to).toBe('/new');
    expect(setNodeTo(tree, 'c', '/new')[1]!.children![0]!.to).toBe('/new');
  });

  it('moveNode řadí v rámci sourozenců, krajní pozice no-op', () => {
    const tree = [link('a', 'A', '/a'), link('b', 'B', '/b')];
    expect(moveNode(tree, 'a', 1).map((n) => n.id)).toEqual(['b', 'a']);
    expect(moveNode(tree, 'a', -1).map((n) => n.id)).toEqual(['a', 'b']); // nahoru z indexu 0
    const g = [group('g', 'G', [link('x', 'X', '/x'), link('y', 'Y', '/y')])];
    expect(moveNode(g, 'y', -1)[0]!.children!.map((c) => c.id)).toEqual([
      'y',
      'x',
    ]);
  });

  it('makeNodeId vrací unikátní stringy', () => {
    expect(makeNodeId()).not.toBe(makeNodeId());
  });
});
