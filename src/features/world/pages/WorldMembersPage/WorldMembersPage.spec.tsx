import { describe, it, expect, vi } from 'vitest';
import { render, screen, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { WorldRole, type WorldMembership } from '@/shared/types';
import WorldMembersPage from './WorldMembersPage';
import { MemberCard } from './MemberCard';

// MemberCard renderuje <Link> → potřebuje router context.
const renderR = (ui: ReactElement): RenderResult =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const membersData = vi.hoisted(() => ({ items: [] as WorldMembership[] }));
const settingsData = vi.hoisted(() => ({
  customGroups: [] as string[],
  groupColors: {} as Record<string, string>,
}));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    worldSlug: 'svet-vil',
    isPJ: false,
    loading: false,
  }),
}));
vi.mock('@/features/world/api/useWorldMembers', () => ({
  useWorldMembers: () => ({ data: membersData.items, isLoading: false }),
}));
vi.mock('@/features/world/api/useWorldPendingActions', () => ({
  useWorldPendingActions: () => ({ data: [] }),
}));
vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({
    data: {
      customGroups: settingsData.customGroups,
      groupColors: settingsData.groupColors,
    },
  }),
}));
vi.mock('@/features/world/pages/api/useCharacterDirectory', () => ({
  useCharacterDirectory: () => ({ data: [], isLoading: false }),
}));

function makeMember(over: Partial<WorldMembership> = {}): WorldMembership {
  return {
    id: `m-${Math.random()}`,
    userId: 'u1',
    worldId: 'w1',
    role: WorldRole.Hrac,
    joinedAt: new Date().toISOString(),
    akj: 0,
    user: { id: 'u1', username: 'Hráč', avatarUrl: undefined },
    ...over,
  };
}

describe('MemberCard', () => {
  it('vykreslí jméno a roli', () => {
    renderR(
      <MemberCard
        member={makeMember({
          role: WorldRole.PJ,
          user: { id: 'u9', username: 'Tyky' },
        })}
      />,
    );
    expect(screen.getByText('Tyky')).toBeInTheDocument();
    expect(screen.getByText('PJ')).toBeInTheDocument();
  });

  it('odkazuje na osobní kartu hráče (/ikaros/uzivatel/:userId)', () => {
    renderR(
      <MemberCard
        member={makeMember({ userId: 'u42', user: { id: 'u42', username: 'Hráč' } })}
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/ikaros/uzivatel/u42',
    );
  });

  it('„Hraje za" odkazuje na postavu, když má characterPath + character', () => {
    renderR(
      <MemberCard
        member={makeMember({ characterPath: 'aragorn' })}
        worldSlug="svet-vil"
        character={{ name: 'Aragorn' }}
      />,
    );
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Otevřít postavu Aragorn/ }),
    ).toHaveAttribute('href', '/svet/svet-vil/aragorn');
  });

  it('bez character nemá odkaz na postavu (jen profil)', () => {
    renderR(<MemberCard member={makeMember({ characterPath: 'aragorn' })} />);
    // worldSlug+character chybí → žádný „Hraje za" odkaz, jen profilový.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});

describe('WorldMembersPage', () => {
  it('vedení (PJ, PomocnyPJ) je v sekcích zvlášť', () => {
    membersData.items = [
      makeMember({ role: WorldRole.PJ, user: { id: 'a', username: 'Pán' } }),
      makeMember({
        role: WorldRole.PomocnyPJ,
        user: { id: 'b', username: 'Pomocník' },
      }),
    ];
    settingsData.customGroups = [];
    renderR(<WorldMembersPage />);
    expect(screen.getByText('Pán jeskyně')).toBeInTheDocument();
    expect(screen.getByText('Pomocní PJ')).toBeInTheDocument();
    expect(screen.getByText('Pán')).toBeInTheDocument();
    expect(screen.getByText('Pomocník')).toBeInTheDocument();
  });

  it('člen se skupinou je v sekci skupiny, bez skupiny v „Bez skupiny"', () => {
    membersData.items = [
      makeMember({
        role: WorldRole.Hrac,
        group: 'Družina',
        characterPath: 'aragorn',
        user: { id: 'c', username: 'Aragorn' },
      }),
      makeMember({
        role: WorldRole.Hrac,
        characterPath: 'tulak',
        user: { id: 'd', username: 'Tulák' },
      }),
    ];
    settingsData.customGroups = ['Družina'];
    settingsData.groupColors = { Družina: '#88aa44' };
    renderR(<WorldMembersPage />);
    expect(screen.getByText('Družina')).toBeInTheDocument();
    expect(screen.getByText('Bez skupiny')).toBeInTheDocument();
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.getByText('Tulák')).toBeInTheDocument();
  });

  // 15.10 R10 — Zadatel/Čtenář/Hráč bez postavy jsou nově v sekci „Nováčci"
  // (dřív skrytí), ať PJ i hráči vidí každého, kdo je v jeskyni.
  it('Zadatel (pending) je v sekci Nováčci', () => {
    membersData.items = [
      makeMember({
        role: WorldRole.Zadatel,
        user: { id: 'e', username: 'Čekatel' },
      }),
    ];
    settingsData.customGroups = [];
    renderR(<WorldMembersPage />);
    expect(screen.getByText('Nováčci')).toBeInTheDocument();
    expect(screen.getByText('Čekatel')).toBeInTheDocument();
  });

  it('hráč/čtenář BEZ postavy je v sekci Nováčci', () => {
    membersData.items = [
      makeMember({
        role: WorldRole.Hrac,
        user: { id: 'f', username: 'BezPostavy' },
      }),
      makeMember({
        // username schválně != role label „Čtenář", ať getByText necílí chip.
        role: WorldRole.Ctenar,
        user: { id: 'g', username: 'NovyClen' },
      }),
    ];
    settingsData.customGroups = [];
    renderR(<WorldMembersPage />);
    expect(screen.getByText('Nováčci')).toBeInTheDocument();
    expect(screen.getByText('BezPostavy')).toBeInTheDocument();
    expect(screen.getByText('NovyClen')).toBeInTheDocument();
  });

  it('Korektor se zobrazí i bez postavy (staff)', () => {
    membersData.items = [
      makeMember({
        role: WorldRole.Korektor,
        user: { id: 'h', username: 'Opravář' },
      }),
    ];
    settingsData.customGroups = [];
    renderR(<WorldMembersPage />);
    expect(screen.getByText('Opravář')).toBeInTheDocument();
  });
});
