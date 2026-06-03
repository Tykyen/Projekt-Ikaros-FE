import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberRow } from '../components/MemberRow';
import { WorldRole, type WorldMembership } from '@/shared/types';

const baseMember: WorldMembership = {
  id: 'm1',
  userId: 'u1',
  worldId: 'w1',
  role: WorldRole.Hrac,
  joinedAt: '2026-05-22',
  user: {
    id: 'u1',
    username: 'Frodo',
    avatarUrl: undefined,
  },
};

const PC_LIST = [
  {
    id: 'c1',
    slug: 'medak',
    name: 'Měďák',
    isNpc: false,
    kind: 'persona' as const,
    userId: 'u1',
  },
  {
    id: 'c2',
    slug: 'samvis',
    name: 'Samvís',
    isNpc: false,
    kind: 'persona' as const,
    userId: 'u2',
  },
];

function renderRow({
  membership = baseMember,
  pcCharacters = PC_LIST,
  viewerRole = WorldRole.PJ,
  viewerUserId = 'pj1',
  onAssignCharacter = vi.fn(),
  onCreateForMember = vi.fn(),
}: Partial<Parameters<typeof MemberRow>[0]> = {}) {
  return {
    onAssignCharacter,
    onCreateForMember,
    ...render(
      <MemberRow
        membership={membership}
        customGroups={[]}
        akjTypes={[]}
        pcCharacters={pcCharacters}
        viewerRole={viewerRole}
        viewerUserId={viewerUserId}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onAssignCharacter={onAssignCharacter}
        onCreateForMember={onCreateForMember}
      />,
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MemberRow — přiřazení postavy (8.2g)', () => {
  it('PJ: výběr postavy ze selectu volá onAssignCharacter se slugem', async () => {
    const user = userEvent.setup();
    const { onAssignCharacter } = renderRow();
    const select = screen.getByLabelText(/Postava pro Frodo/i);
    await user.selectOptions(select, 'medak');
    expect(onAssignCharacter).toHaveBeenCalledWith('m1', 'medak');
  });

  it('PJ: volba "— žádná —" pošle undefined (odpojení)', async () => {
    const user = userEvent.setup();
    const { onAssignCharacter } = renderRow({
      membership: { ...baseMember, characterPath: 'medak' },
    });
    const select = screen.getByLabelText(/Postava pro Frodo/i);
    await user.selectOptions(select, '');
    expect(onAssignCharacter).toHaveBeenCalledWith('m1', undefined);
  });

  it('PJ: klik na "Vytvořit postavu" volá onCreateForMember s daným členem', async () => {
    const user = userEvent.setup();
    const { onCreateForMember } = renderRow();
    await user.click(screen.getByLabelText(/Vytvořit postavu pro Frodo/i));
    expect(onCreateForMember).toHaveBeenCalledWith(baseMember);
  });

  it('běžný hráč (cizí řádek): select Postava je disabled, žádné Vytvořit', () => {
    renderRow({
      viewerRole: WorldRole.Hrac,
      viewerUserId: 'cizi',
    });
    const select = screen.getByLabelText(/Postava pro Frodo/i);
    expect(select).toBeDisabled();
    expect(
      screen.queryByLabelText(/Vytvořit postavu pro Frodo/i),
    ).not.toBeInTheDocument();
  });

  it('vlastní řádek: select Postava je enabled (úprava sebe sama), Vytvořit jen PJ', () => {
    renderRow({
      viewerRole: WorldRole.Hrac,
      viewerUserId: 'u1', // = baseMember.userId
    });
    const select = screen.getByLabelText(/Postava pro Frodo/i);
    expect(select).not.toBeDisabled();
    // Tvorba postavy je PJ-only, hráč si ji založit nemůže.
    expect(
      screen.queryByLabelText(/Vytvořit postavu pro Frodo/i),
    ).not.toBeInTheDocument();
  });

  it('characterPath na neexistující postavu zobrazí "(chybí)" v selectu', () => {
    renderRow({
      membership: { ...baseMember, characterPath: 'zmizela' },
    });
    expect(screen.getByText(/zmizela \(chybí\)/i)).toBeInTheDocument();
  });
});
