import { describe, it, expect } from 'vitest';
import { resolvePersona, type PersonaInput } from '../resolvePersona';
import { WorldRole } from '@/shared/types';

const base: Omit<PersonaInput, 'role'> = {
  worldSlug: 'svet',
  character: null,
  pjMode: 'unified',
  account: { username: 'tyky', avatarUrl: 'acc.png' },
};

describe('resolvePersona', () => {
  it('PJ unified → „PJ" + sdílený avatar, klik na deník PJ', () => {
    const p = resolvePersona({
      ...base,
      role: WorldRole.PJ,
      sharedPjAvatar: 'shared.png',
    });
    expect(p).toEqual({
      name: 'PJ',
      avatarUrl: 'shared.png',
      to: '/svet/svet/denik-pj',
    });
  });

  it('Pomocný PJ individual → „Pomocný PJ" + vlastní avatar', () => {
    const p = resolvePersona({
      ...base,
      role: WorldRole.PomocnyPJ,
      pjMode: 'individual',
      pjPersonaAvatarUrl: 'mine.png',
    });
    expect(p).toEqual({
      name: 'Pomocný PJ',
      avatarUrl: 'mine.png',
      to: '/svet/svet/denik-pj',
    });
  });

  it('vedení bez persona avataru → fallback na účet', () => {
    const p = resolvePersona({
      ...base,
      role: WorldRole.PJ,
      pjMode: 'individual',
    });
    expect(p.avatarUrl).toBe('acc.png');
  });

  it('hráč s postavou → jméno + obrázek postavy, klik na profil', () => {
    const p = resolvePersona({
      ...base,
      role: WorldRole.Hrac,
      character: { characterPath: 'aragorn', name: 'Aragorn', avatarUrl: 'a.png' },
    });
    expect(p).toEqual({
      name: 'Aragorn',
      avatarUrl: 'a.png',
      to: '/svet/svet/aragorn',
    });
  });

  it('hráč bez postavy → username, neklikatelné', () => {
    const p = resolvePersona({ ...base, role: WorldRole.Hrac });
    expect(p).toEqual({ name: 'tyky', avatarUrl: 'acc.png', to: null });
  });

  it('role má přednost: PJ s přiřazenou postavou vidí „PJ"', () => {
    const p = resolvePersona({
      ...base,
      role: WorldRole.PJ,
      pjMode: 'individual',
      pjPersonaAvatarUrl: 'mine.png',
      character: { characterPath: 'npc', name: 'NPC', avatarUrl: 'n.png' },
    });
    expect(p.name).toBe('PJ');
    expect(p.to).toBe('/svet/svet/denik-pj');
  });

  it('postava bez obrázku → fallback na účet', () => {
    const p = resolvePersona({
      ...base,
      role: WorldRole.Hrac,
      character: { characterPath: 'x', name: 'X' },
    });
    expect(p.avatarUrl).toBe('acc.png');
  });

  it('null role + bez postavy → „Účet" (prázdný účet)', () => {
    const p = resolvePersona({
      ...base,
      role: null,
      account: { username: undefined, avatarUrl: null },
    });
    expect(p).toEqual({ name: 'Účet', avatarUrl: null, to: null });
  });
});
