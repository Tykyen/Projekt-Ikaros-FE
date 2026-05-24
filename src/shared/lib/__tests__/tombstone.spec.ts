import { describe, it, expect } from 'vitest';
import { resolveTombstone } from '../tombstone';

describe('resolveTombstone (D-040)', () => {
  it('isDeleted=true → "Smazaný účet" + bez avataru + deleted: true', () => {
    expect(
      resolveTombstone({
        isDeleted: true,
        displayName: 'Alice',
        avatarUrl: 'https://example.com/a.jpg',
      }),
    ).toEqual({
      displayName: 'Smazaný účet',
      avatarUrl: undefined,
      deleted: true,
    });
  });

  it('isDeleted=false → původní displayName + avatar + deleted: false', () => {
    expect(
      resolveTombstone({
        isDeleted: false,
        displayName: 'Bob',
        avatarUrl: 'https://example.com/b.jpg',
      }),
    ).toEqual({
      displayName: 'Bob',
      avatarUrl: 'https://example.com/b.jpg',
      deleted: false,
    });
  });

  it('isDeleted=undefined (legacy / žádný enrich) → původní displayName, deleted: false', () => {
    expect(
      resolveTombstone({
        displayName: 'Carol',
        avatarUrl: 'https://example.com/c.jpg',
      }),
    ).toEqual({
      displayName: 'Carol',
      avatarUrl: 'https://example.com/c.jpg',
      deleted: false,
    });
  });

  it('avatarUrl null → undefined v outputu', () => {
    expect(
      resolveTombstone({
        isDeleted: false,
        displayName: 'Dave',
        avatarUrl: null,
      }),
    ).toEqual({
      displayName: 'Dave',
      avatarUrl: undefined,
      deleted: false,
    });
  });
});
