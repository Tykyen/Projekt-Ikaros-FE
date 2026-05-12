import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { UserRole, type PublicUserListItem } from '@/shared/types';
import { UserCard } from '../tabs/UsersTab/UserCard';

function makeUser(
  overrides: Partial<PublicUserListItem> = {},
): PublicUserListItem {
  return {
    id: 'u1',
    username: 'alice',
    displayName: 'Alice Wonder',
    city: 'Praha',
    avatarUrl: null,
    defaultAvatarType: 'female',
    role: UserRole.Hrac,
    worldsCount: 3,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderCard(props: {
  user: PublicUserListItem;
  onOpen?: (id: string) => void;
  onKebab?: () => void;
}) {
  return render(
    <MemoryRouter>
      <UserCard
        user={props.user}
        onOpen={props.onOpen ?? (() => {})}
        onKebab={props.onKebab}
      />
    </MemoryRouter>,
  );
}

describe('UserCard', () => {
  it('vykreslí username, displayName, město, worldsCount', () => {
    renderCard({ user: makeUser() });
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('Alice Wonder')).toBeInTheDocument();
    expect(screen.getByText('Praha')).toBeInTheDocument();
    expect(screen.getByText('3 světů')).toBeInTheDocument();
  });

  it('worldsCount = 1 → singulár „1 svět"', () => {
    renderCard({ user: makeUser({ worldsCount: 1 }) });
    expect(screen.getByText('1 svět')).toBeInTheDocument();
  });

  it('Admin role: vykreslí role chip', () => {
    renderCard({ user: makeUser({ role: UserRole.Admin }) });
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('Hrac role: žádný role chip', () => {
    renderCard({ user: makeUser({ role: UserRole.Hrac }) });
    expect(screen.queryByText('Hrac')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('city = null: skryje městský řádek', () => {
    renderCard({ user: makeUser({ city: null }) });
    expect(screen.queryByText('Praha')).not.toBeInTheDocument();
  });

  it('displayName = null: skryje subtitle', () => {
    renderCard({ user: makeUser({ displayName: null }) });
    expect(screen.queryByText('Alice Wonder')).not.toBeInTheDocument();
  });

  it('klik na kartu volá onOpen s ID', () => {
    const onOpen = vi.fn();
    renderCard({ user: makeUser(), onOpen });
    const card = screen.getByRole('button', { name: /Otevřít profil/ });
    fireEvent.click(card);
    expect(onOpen).toHaveBeenCalledWith('u1');
  });

  it('Enter na kartě volá onOpen', () => {
    const onOpen = vi.fn();
    renderCard({ user: makeUser(), onOpen });
    const card = screen.getByRole('button', { name: /Otevřít profil/ });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith('u1');
  });

  it('kebab klik nepropaguje na onOpen', () => {
    const onOpen = vi.fn();
    const onKebab = vi.fn();
    renderCard({ user: makeUser(), onOpen, onKebab });
    const kebab = screen.getByRole('button', { name: /Akce pro/ });
    fireEvent.click(kebab);
    expect(onKebab).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('pendingDeletion: vykreslí status pásek', () => {
    renderCard({ user: makeUser({ pendingDeletion: true }) });
    expect(screen.getByText(/Pending deletion/i)).toBeInTheDocument();
  });

  it('deleted: vykreslí status pásek „Účet smazán"', () => {
    renderCard({ user: makeUser({ deleted: true }) });
    expect(screen.getByText(/Účet smazán/i)).toBeInTheDocument();
  });
});
