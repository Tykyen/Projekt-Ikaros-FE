import { describe, it, expect } from 'vitest';
import { WorldRole, type WorldMembership } from '@/shared/types';
import {
  isPlayingMember,
  encodeGroupKey,
  decodeGroupKey,
  memberGroupKey,
  membersInGroup,
  buildGroupNavEntries,
  UNGROUPED_KEY,
  UNGROUPED_LABEL,
} from '../groupMembers';

const m = (over: Partial<WorldMembership>): WorldMembership => ({
  id: Math.random().toString(),
  userId: 'u',
  worldId: 'w',
  role: WorldRole.Hrac,
  joinedAt: '',
  characterPath: 'postava',
  ...over,
});

describe('isPlayingMember (spec R4)', () => {
  it('Hráč s postavou → ano', () => {
    expect(isPlayingMember(m({ role: WorldRole.Hrac }))).toBe(true);
  });
  it('Hráč bez postavy → ne', () => {
    expect(
      isPlayingMember(m({ role: WorldRole.Hrac, characterPath: undefined })),
    ).toBe(false);
  });
  it('PJ s postavou → ano, PJ bez postavy → ne', () => {
    expect(isPlayingMember(m({ role: WorldRole.PJ }))).toBe(true);
    expect(
      isPlayingMember(m({ role: WorldRole.PJ, characterPath: undefined })),
    ).toBe(false);
  });
  it('Čtenář / Žadatel → ne (i kdyby měl postavu)', () => {
    expect(isPlayingMember(m({ role: WorldRole.Ctenar }))).toBe(false);
    expect(isPlayingMember(m({ role: WorldRole.Zadatel }))).toBe(false);
  });
});

describe('group key encode/decode', () => {
  it('round-trip s diakritikou', () => {
    expect(decodeGroupKey(encodeGroupKey('Lumíci'))).toBe('Lumíci');
  });
  it('__none__ → null (Nezařazení)', () => {
    expect(decodeGroupKey(UNGROUPED_KEY)).toBeNull();
  });
});

describe('memberGroupKey', () => {
  const groups = ['Lumíci', 'Evropani'];
  it('člen ve známé skupině → encoded klíč', () => {
    expect(memberGroupKey(m({ group: 'Lumíci' }), groups)).toBe(
      encodeGroupKey('Lumíci'),
    );
  });
  it('bez skupiny / mimo customGroups → __none__', () => {
    expect(memberGroupKey(m({ group: undefined }), groups)).toBe(UNGROUPED_KEY);
    expect(memberGroupKey(m({ group: 'Smazaná' }), groups)).toBe(UNGROUPED_KEY);
  });
});

describe('membersInGroup', () => {
  const groups = ['Lumíci', 'Evropani'];
  const members = [
    m({ id: 'a', group: 'Lumíci', role: WorldRole.Hrac }),
    m({ id: 'b', group: 'Evropani', role: WorldRole.Hrac }),
    m({ id: 'c', group: undefined, role: WorldRole.Hrac }), // Nezařazený
    m({ id: 'd', group: 'Lumíci', characterPath: undefined }), // bez postavy → skryt
    m({ id: 'e', group: 'Smazaná', role: WorldRole.Hrac }), // skupina mimo → Nezařazení
    m({ id: 'f', group: 'Lumíci', role: WorldRole.Ctenar }), // čtenář → skryt
  ];

  it('konkrétní skupina = jen hrající členové té skupiny', () => {
    expect(membersInGroup(members, 'Lumíci', groups).map((x) => x.id)).toEqual([
      'a',
    ]);
  });
  it('Nezařazení = hrající bez skupiny nebo se skupinou mimo customGroups', () => {
    expect(membersInGroup(members, null, groups).map((x) => x.id)).toEqual([
      'c',
      'e',
    ]);
  });
});

describe('buildGroupNavEntries', () => {
  it('customGroups + Nezařazení na konci', () => {
    const out = buildGroupNavEntries(['Lumíci', 'Evropani']);
    expect(out.map((e) => e.label)).toEqual([
      'Lumíci',
      'Evropani',
      UNGROUPED_LABEL,
    ]);
    expect(out[out.length - 1]!.key).toBe(UNGROUPED_KEY);
  });
  it('prázdné customGroups → jen Nezařazení', () => {
    expect(buildGroupNavEntries([]).map((e) => e.label)).toEqual([
      UNGROUPED_LABEL,
    ]);
  });
});
