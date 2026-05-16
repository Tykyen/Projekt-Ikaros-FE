import clsx from 'clsx';
import type { ChatUser } from '../lib/types';
import s from './UserList.module.css';

interface UserListProps {
  users: ChatUser[];
  currentUserId: string;
}

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

/** Panel přítomných uživatelů v místnosti. */
export function UserList({ users, currentUserId }: UserListProps) {
  return (
    <div className={s.list}>
      {users.map((u) => (
        <div
          key={u.userId}
          className={clsx(s.row, u.userId === currentUserId && s.self)}
        >
          {u.avatarUrl ? (
            <img className={s.avatar} src={u.avatarUrl} alt="" loading="lazy" />
          ) : (
            <span className={clsx(s.avatar, s.avatarFallback)}>
              {initials(u.username)}
            </span>
          )}
          <span className={s.name}>{u.username}</span>
        </div>
      ))}
    </div>
  );
}
