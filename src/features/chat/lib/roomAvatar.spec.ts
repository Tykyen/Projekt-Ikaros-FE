import { describe, it, expect } from 'vitest';
import { roomAvatarFor } from './roomAvatar';

const u = { avatarUrl: 'acc.webp', characterAvatarUrl: 'char.webp' };

describe('roomAvatarFor (4.2e §2)', () => {
  it('Hospoda → avatar účtu', () => {
    expect(roomAvatarFor('hospoda', u)).toBe('acc.webp');
  });

  it('Rozcestí → avatar postavy', () => {
    expect(roomAvatarFor('rozcesti-1', u)).toBe('char.webp');
  });

  it('Rozcestí bez postavy → fallback účet', () => {
    expect(roomAvatarFor('rozcesti-2', { avatarUrl: 'acc.webp' })).toBe(
      'acc.webp',
    );
  });

  it('žádný obrázek → undefined (iniciála)', () => {
    expect(roomAvatarFor('rozcesti-3', {})).toBeUndefined();
    expect(roomAvatarFor('hospoda', {})).toBeUndefined();
  });
});
