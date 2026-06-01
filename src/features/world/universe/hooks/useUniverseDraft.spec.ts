import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUniverseDraft } from './useUniverseDraft';
import type { UniverseMap, UniverseNode } from '../types';

function n(id: string, extra: Partial<UniverseNode> = {}): UniverseNode {
  return {
    id,
    name: id,
    color: '#fff',
    size: 5,
    isPublic: true,
    visibleToPlayerIds: [],
    ...extra,
  };
}

const base: UniverseMap = {
  id: 'm',
  worldId: 'w',
  nodes: [n('a'), n('b'), n('c')],
  links: [
    { source: 'a', target: 'b', isOrbit: false },
    { source: 'b', target: 'c', isOrbit: true },
  ],
};

function setup() {
  const hook = renderHook(() => useUniverseDraft());
  act(() => hook.result.current.reset(structuredClone(base)));
  return hook;
}

describe('useUniverseDraft', () => {
  it('reset načte baseline, isDirty=false', () => {
    const { result } = setup();
    expect(result.current.draft?.nodes).toHaveLength(3);
    expect(result.current.isDirty).toBe(false);
  });

  it('addNode přidá uzel a označí dirty', () => {
    const { result } = setup();
    act(() => result.current.addNode(n('d')));
    expect(result.current.draft?.nodes.map((x) => x.id)).toContain('d');
    expect(result.current.isDirty).toBe(true);
  });

  it('updateNode patchne pole', () => {
    const { result } = setup();
    act(() => result.current.updateNode('a', { name: 'Země', size: 9 }));
    const a = result.current.draft?.nodes.find((x) => x.id === 'a');
    expect(a?.name).toBe('Země');
    expect(a?.size).toBe(9);
  });

  it('removeNode smaže uzel a kaskádně napojené hrany', () => {
    const { result } = setup();
    act(() => result.current.removeNode('b'));
    expect(result.current.draft?.nodes.map((x) => x.id)).toEqual(['a', 'c']);
    // obě hrany se dotýkaly 'b' → obě pryč
    expect(result.current.draft?.links).toHaveLength(0);
  });

  it('addLink přidá hranu, duplicitní (i obrácenou) ignoruje', () => {
    const { result } = setup();
    act(() => result.current.addLink({ source: 'a', target: 'c', isOrbit: false }));
    expect(result.current.draft?.links).toHaveLength(3);
    // duplicitní obrácená a↔b už existuje (b→? ne, existuje a→b) → b→a ignore
    act(() => result.current.addLink({ source: 'b', target: 'a', isOrbit: false }));
    expect(result.current.draft?.links).toHaveLength(3);
  });

  it('removeLink smaže konkrétní hranu', () => {
    const { result } = setup();
    act(() => result.current.removeLink('a', 'b'));
    expect(result.current.draft?.links).toHaveLength(1);
    expect(result.current.draft?.links[0]).toMatchObject({
      source: 'b',
      target: 'c',
    });
  });

  it('moveNode nastaví pozici', () => {
    const { result } = setup();
    act(() => result.current.moveNode('a', 1, 2, 3));
    const a = result.current.draft?.nodes.find((x) => x.id === 'a');
    expect([a?.x, a?.y, a?.z]).toEqual([1, 2, 3]);
  });

  it('vrácení do baseline (move tam a zpět) → isDirty false', () => {
    const { result } = setup();
    act(() => result.current.updateNode('a', { name: 'X' }));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.updateNode('a', { name: 'a' }));
    expect(result.current.isDirty).toBe(false);
  });
});
