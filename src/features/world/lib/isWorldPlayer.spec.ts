import { describe, it, expect } from 'vitest';
import { WorldRole, type WorldMembership } from '@/shared/types';
import { isWorldPlayer } from './isWorldPlayer';

function m(role: WorldRole, characterPath?: string): WorldMembership {
  return {
    id: 'm',
    userId: 'u',
    worldId: 'w',
    role,
    joinedAt: new Date().toISOString(),
    characterPath,
  };
}

describe('isWorldPlayer', () => {
  it('staff (Korektor, PomocnyPJ, PJ) se počítá i bez postavy', () => {
    expect(isWorldPlayer(m(WorldRole.Korektor))).toBe(true);
    expect(isWorldPlayer(m(WorldRole.PomocnyPJ))).toBe(true);
    expect(isWorldPlayer(m(WorldRole.PJ))).toBe(true);
  });

  it('hráč/čtenář s přiřazenou postavou se počítá', () => {
    expect(isWorldPlayer(m(WorldRole.Hrac, 'aragorn'))).toBe(true);
    expect(isWorldPlayer(m(WorldRole.Ctenar, 'aragorn'))).toBe(true);
  });

  it('hráč/čtenář BEZ postavy se nepočítá', () => {
    expect(isWorldPlayer(m(WorldRole.Hrac))).toBe(false);
    expect(isWorldPlayer(m(WorldRole.Ctenar))).toBe(false);
  });

  it('žadatel se nepočítá nikdy (ani s postavou)', () => {
    expect(isWorldPlayer(m(WorldRole.Zadatel))).toBe(false);
    expect(isWorldPlayer(m(WorldRole.Zadatel, 'aragorn'))).toBe(false);
  });
});
