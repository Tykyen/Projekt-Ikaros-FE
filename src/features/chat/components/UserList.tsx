import clsx from 'clsx';
import type { ChatUser } from '../lib/types';
import s from './UserList.module.css';

/** Režim zobrazení přítomných — účet (Hospoda) vs. postava (Camp). */
export type UserListMode = 'account' | 'character';

interface UserListProps {
  users: ChatUser[];
  currentUserId: string;
  /** `character` → preferuje postavu z profilu; fallback na účet (4.2d §8). */
  mode?: UserListMode;
  /** Vyplněno → řádky jsou klikatelné, klik otevře detail postavy. */
  onSelectUser?: (userId: string) => void;
}

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

/** Jméno + avatar dle režimu — Camp ukazuje postavu, Hospoda účet. */
function displayUser(
  u: ChatUser,
  mode: UserListMode,
): { name: string; avatarUrl?: string } {
  if (mode === 'character' && u.characterName) {
    return { name: u.characterName, avatarUrl: u.characterAvatarUrl };
  }
  return { name: u.username, avatarUrl: u.avatarUrl };
}

/** Panel přítomných uživatelů v místnosti. */
export function UserList({
  users,
  currentUserId,
  mode = 'account',
  onSelectUser,
}: UserListProps) {
  return (
    <div className={s.list}>
      {users.map((u) => {
        const { name, avatarUrl } = displayUser(u, mode);
        const avatar = avatarUrl ? (
          <img className={s.avatar} src={avatarUrl} alt="" loading="lazy" />
        ) : (
          <span className={clsx(s.avatar, s.avatarFallback)}>
            {initials(name)}
          </span>
        );
        const isSelf = u.userId === currentUserId;

        // S `onSelectUser` je řádek klikatelný <button>, jinak statický <div>.
        if (onSelectUser) {
          return (
            <button
              key={u.userId}
              type="button"
              className={clsx(s.row, s.rowButton, isSelf && s.self)}
              onClick={() => onSelectUser(u.userId)}
            >
              {avatar}
              <span className={s.name}>{name}</span>
            </button>
          );
        }
        return (
          <div
            key={u.userId}
            className={clsx(s.row, isSelf && s.self)}
          >
            {avatar}
            <span className={s.name}>{name}</span>
          </div>
        );
      })}
    </div>
  );
}
