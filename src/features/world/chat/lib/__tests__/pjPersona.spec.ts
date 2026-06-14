import { describe, it, expect } from 'vitest';
import { makePjDisplayResolver } from '../pjPersona';
import { WorldRole, type PjChatPersona } from '@/shared/types';

const members = [
  {
    userId: 'pj',
    role: WorldRole.PJ,
    pjPersonaAvatarUrl: 'pj.png',
    user: { avatarUrl: 'pjAcc.png' },
  },
  {
    userId: 'asst',
    role: WorldRole.PomocnyPJ,
    user: { avatarUrl: 'asstAcc.png' },
  },
  { userId: 'hrac', role: WorldRole.Hrac, user: { avatarUrl: 'h.png' } },
];

const persona = (over: Partial<PjChatPersona>): PjChatPersona => ({
  enabled: true,
  name: null,
  avatarUrl: null,
  mode: 'unified',
  ...over,
});

describe('makePjDisplayResolver', () => {
  it('unified → sdílené „PJ" pro vedení, null pro hráče', () => {
    const r = makePjDisplayResolver(
      members,
      persona({ avatarUrl: 'shared.png', mode: 'unified' }),
    );
    expect(r('pj')).toEqual({ name: 'PJ', avatarUrl: 'shared.png' });
    expect(r('asst')).toEqual({ name: 'PJ', avatarUrl: 'shared.png' });
    expect(r('hrac')).toBeNull();
  });

  it('unified bez persony (undefined) → default „PJ"', () => {
    const r = makePjDisplayResolver(members, undefined);
    expect(r('pj')).toEqual({ name: 'PJ', avatarUrl: null });
  });

  it('individual → per-člen role + vlastní avatar (fallback na účet)', () => {
    const r = makePjDisplayResolver(members, persona({ mode: 'individual' }));
    expect(r('pj')).toEqual({ name: 'PJ', avatarUrl: 'pj.png' });
    // asst nemá pjPersonaAvatarUrl → fallback na účtový avatar
    expect(r('asst')).toEqual({ name: 'Pomocný PJ', avatarUrl: 'asstAcc.png' });
    expect(r('hrac')).toBeNull();
  });

  it('individual bez avataru i účtu → null avatar', () => {
    const r = makePjDisplayResolver(
      [{ userId: 'pj', role: WorldRole.PJ }],
      persona({ mode: 'individual' }),
    );
    expect(r('pj')).toEqual({ name: 'PJ', avatarUrl: null });
  });

  it('žádné vedení → vždy null', () => {
    const r = makePjDisplayResolver(
      [{ userId: 'h', role: WorldRole.Hrac }],
      persona({ mode: 'unified' }),
    );
    expect(r('h')).toBeNull();
  });
});
