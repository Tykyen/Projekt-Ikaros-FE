import { describe, it, expect } from 'vitest';
import {
  buildGraphData,
  linkPassesFilter,
  neighborIds,
} from './graphData';
import type { CampaignRelationship, CampaignSubject } from './types';

function subj(id: string, type: CampaignSubject['type'] = 'NPC'): CampaignSubject {
  return {
    id,
    worldId: 'w1',
    ownerId: 'u1',
    isShared: false,
    type,
    name: `S-${id}`,
    tags: [],
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

function rel(
  id: string,
  a: string,
  b: string,
  over: Partial<CampaignRelationship> = {},
): CampaignRelationship {
  return {
    id,
    worldId: 'w1',
    ownerId: 'u1',
    isShared: false,
    subjectAId: a,
    subjectBId: b,
    shared: {},
    sideA: { valence: 2, strength: 6 },
    sideB: { valence: -1, strength: 9 },
    status: 'active',
    priority: 3,
    storylineIds: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...over,
  };
}

describe('buildGraphData', () => {
  it('mapuje subjekty na uzly a vztahy na hrany', () => {
    const g = buildGraphData(
      [subj('a'), subj('b')],
      [rel('r1', 'a', 'b')],
    );
    expect(g.nodes).toHaveLength(2);
    expect(g.links).toHaveLength(1);
    expect(g.links[0]).toMatchObject({
      relId: 'r1',
      source: 'a',
      target: 'b',
      valenceA: 2,
      valenceB: -1,
      strength: 9, // max(6,9)
    });
  });

  it('vyhodí hranu, jejíž subjekt v aktuální vrstvě chybí', () => {
    const g = buildGraphData([subj('a')], [rel('r1', 'a', 'ghost')]);
    expect(g.links).toHaveLength(0);
  });
});

describe('neighborIds', () => {
  it('vrátí fokus + přímé sousedy', () => {
    const links = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'a' },
      { source: 'b', target: 'd' },
    ];
    const set = neighborIds('a', links);
    expect([...set].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('linkPassesFilter', () => {
  const base = { valenceA: 2, valenceB: -1, status: 'active' as const };
  it('all → vždy true', () => {
    expect(linkPassesFilter(base, 'all')).toBe(true);
  });
  it('crisis → jen krizové', () => {
    expect(linkPassesFilter(base, 'crisis')).toBe(false);
    expect(linkPassesFilter({ ...base, status: 'crisis' }, 'crisis')).toBe(true);
  });
  it('positive → aspoň jedna strana > 0', () => {
    expect(linkPassesFilter(base, 'positive')).toBe(true);
    expect(
      linkPassesFilter({ ...base, valenceA: -2, valenceB: -3 }, 'positive'),
    ).toBe(false);
  });
  it('negative → aspoň jedna strana < 0', () => {
    expect(linkPassesFilter(base, 'negative')).toBe(true);
    expect(
      linkPassesFilter({ ...base, valenceA: 1, valenceB: 2 }, 'negative'),
    ).toBe(false);
  });
});
