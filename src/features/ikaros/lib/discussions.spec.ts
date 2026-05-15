import { describe, it, expect } from 'vitest';
import { filterDiscussions, timeAgo, initials } from './discussions';
import type { IkarosDiscussion } from '@/shared/types';

function mk(overrides: Partial<IkarosDiscussion>): IkarosDiscussion {
  return {
    id: 'd1',
    title: 'Téma',
    description: 'Popis',
    bulletin: '',
    creatorId: 'u1',
    creatorName: 'Tvůrce',
    isApproved: true,
    isOpen: true,
    managerIds: ['u1'],
    invitedUserIds: [],
    joinRequestIds: [],
    postCount: 0,
    likeCount: 0,
    createdAtUtc: '2026-01-01T00:00:00Z',
    lastActivityUtc: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('filterDiscussions', () => {
  const list = [
    mk({ id: 'a', title: 'Draky', postCount: 1, createdAtUtc: '2026-01-01T00:00:00Z', lastActivityUtc: '2026-05-01T00:00:00Z' }),
    mk({ id: 'b', title: 'Mapy', description: 'o drakovi', postCount: 9, createdAtUtc: '2026-03-01T00:00:00Z', lastActivityUtc: '2026-02-01T00:00:00Z' }),
    mk({ id: 'c', title: 'Pravidla', postCount: 5, createdAtUtc: '2026-02-01T00:00:00Z', lastActivityUtc: '2026-04-01T00:00:00Z' }),
  ];

  it('fulltext hledá v názvu i popisu (case-insensitive)', () => {
    const r = filterDiscussions(list, 'drak', 'new');
    expect(r.map((d) => d.id).sort()).toEqual(['a', 'b']);
  });

  it('prázdný dotaz vrací vše', () => {
    expect(filterDiscussions(list, '', 'new')).toHaveLength(3);
  });

  it('sort=activity — DESC podle lastActivityUtc', () => {
    expect(filterDiscussions(list, '', 'activity').map((d) => d.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('sort=new — DESC podle createdAtUtc', () => {
    expect(filterDiscussions(list, '', 'new').map((d) => d.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('sort=posts — DESC podle postCount', () => {
    expect(filterDiscussions(list, '', 'posts').map((d) => d.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });
});

describe('timeAgo', () => {
  it('čerstvý čas → „právě teď"', () => {
    expect(timeAgo(new Date().toISOString())).toBe('právě teď');
  });

  it('starší čas → relativní formát', () => {
    const old = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(timeAgo(old)).toBe('před 3 h');
  });
});

describe('initials', () => {
  it('vezme první dva znaky velkými písmeny', () => {
    expect(initials('tyky')).toBe('TY');
    expect(initials('A')).toBe('A');
  });
});
