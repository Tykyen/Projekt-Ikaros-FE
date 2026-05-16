import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './UserList';
import type { ChatUser } from '../lib/types';

const withCharacter: ChatUser = {
  userId: 'u1',
  username: 'tyky',
  avatarUrl: 'acc.png',
  characterName: 'Aragorn',
  characterAvatarUrl: 'char.png',
};

describe('UserList — účet vs. postava (4.2d §8)', () => {
  it('režim account (Hospoda) zobrazí username', () => {
    render(
      <UserList users={[withCharacter]} currentUserId="x" mode="account" />,
    );
    expect(screen.getByText('tyky')).toBeInTheDocument();
    expect(screen.queryByText('Aragorn')).not.toBeInTheDocument();
  });

  it('režim character (Rozcestí) zobrazí postavu', () => {
    render(
      <UserList users={[withCharacter]} currentUserId="x" mode="character" />,
    );
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.queryByText('tyky')).not.toBeInTheDocument();
  });

  it('character režim bez vyplněné postavy → fallback na účet', () => {
    render(
      <UserList
        users={[{ userId: 'u2', username: 'bob' }]}
        currentUserId="x"
        mode="character"
      />,
    );
    expect(screen.getByText('bob')).toBeInTheDocument();
  });
});

describe('UserList — klikatelné řádky (detail postavy)', () => {
  it('bez onSelectUser řádek není button', () => {
    render(<UserList users={[withCharacter]} currentUserId="x" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('s onSelectUser je řádek button a klik předá userId', async () => {
    const onSelectUser = vi.fn();
    render(
      <UserList
        users={[withCharacter]}
        currentUserId="x"
        mode="character"
        onSelectUser={onSelectUser}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Aragorn/ }));
    expect(onSelectUser).toHaveBeenCalledWith('u1');
  });
});
