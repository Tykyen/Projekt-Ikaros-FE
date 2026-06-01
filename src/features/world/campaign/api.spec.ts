import { describe, it, expect } from 'vitest';
import { campaignKeys, partitionByOwner } from './api';

interface Owned {
  ownerId: string;
  id: string;
}

describe('partitionByOwner', () => {
  it('oddělí moje od cizích a seskupí cizí dle ownerId', () => {
    const items: Owned[] = [
      { id: 'a', ownerId: 'me' },
      { id: 'b', ownerId: 'p1' },
      { id: 'c', ownerId: 'me' },
      { id: 'd', ownerId: 'p2' },
      { id: 'e', ownerId: 'p1' },
    ];
    const { mine, byOwner } = partitionByOwner(items, 'me');
    expect(mine.map((i) => i.id)).toEqual(['a', 'c']);
    expect(byOwner.get('p1')?.map((i) => i.id)).toEqual(['b', 'e']);
    expect(byOwner.get('p2')?.map((i) => i.id)).toEqual(['d']);
    expect(byOwner.has('me')).toBe(false);
  });

  it('prázdný vstup → prázdné výstupy', () => {
    const { mine, byOwner } = partitionByOwner<Owned>([], 'me');
    expect(mine).toEqual([]);
    expect(byOwner.size).toBe(0);
  });
});

describe('campaignKeys', () => {
  it('jsou scoped dle worldId a stabilní', () => {
    expect(campaignKeys.subjects('w1')).toEqual(['campaign', 'w1', 'subjects']);
    expect(campaignKeys.root('w1')).toEqual(['campaign', 'w1']);
  });
});
