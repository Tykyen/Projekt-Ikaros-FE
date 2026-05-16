import { describe, it, expect } from 'vitest';
import { presentUsers } from './presenceUsers';
import type { ChatUser } from './types';

const self = { id: 'me', username: 'Tyky', avatarUrl: 'a.png' };

describe('presentUsers', () => {
  it('přidá aktuálního uživatele, když v seznamu chybí (self-include)', () => {
    const result = presentUsers([{ userId: 'u1', username: 'Gandalf' }], self);
    expect(result).toEqual([
      { userId: 'me', username: 'Tyky', avatarUrl: 'a.png' },
      { userId: 'u1', username: 'Gandalf' },
    ]);
  });

  it('uživatele nepřidá podruhé, když už v seznamu je', () => {
    const raw: ChatUser[] = [{ userId: 'me', username: 'Tyky' }];
    expect(presentUsers(raw, self)).toEqual(raw);
  });

  it('deduplikuje záznamy se stejným userId', () => {
    const raw: ChatUser[] = [
      { userId: 'u1', username: 'Gandalf' },
      { userId: 'u1', username: 'Gandalf' },
    ];
    const result = presentUsers(raw, null);
    expect(result).toEqual([{ userId: 'u1', username: 'Gandalf' }]);
  });

  it('zvládne prázdný / chybějící seznam', () => {
    expect(presentUsers(undefined, self)).toEqual([
      { userId: 'me', username: 'Tyky', avatarUrl: 'a.png' },
    ]);
    expect(presentUsers(undefined, null)).toEqual([]);
  });
});
