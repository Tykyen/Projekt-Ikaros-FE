import { describe, it, expect } from 'vitest';
import { roomAvatarFor } from './roomAvatar';

const u = { avatarUrl: 'acc.webp', characterAvatarUrl: 'char.webp' };

describe('roomAvatarFor (4.2e §2)', () => {
  it('Hospoda → avatar účtu', () => {
    expect(roomAvatarFor('hospoda', u)).toBe('acc.webp');
  });

  it('Camp → avatar postavy', () => {
    expect(roomAvatarFor('camp-1', u)).toBe('char.webp');
  });

  it('Camp bez postavy → fallback účet', () => {
    expect(roomAvatarFor('camp-2', { avatarUrl: 'acc.webp' })).toBe(
      'acc.webp',
    );
  });

  it('žádný obrázek → undefined (iniciála)', () => {
    expect(roomAvatarFor('camp-3', {})).toBeUndefined();
    expect(roomAvatarFor('hospoda', {})).toBeUndefined();
  });
});
