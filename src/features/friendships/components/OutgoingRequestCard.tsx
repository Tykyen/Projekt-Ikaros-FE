import { X } from 'lucide-react';
import { Button, UserAvatar } from '@/shared/ui';
import type { FriendRequestListItem } from '@/shared/types';
import { useRemoveFriend } from '../api/useFriendshipMutations';
import s from './OutgoingRequestCard.module.css';

function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60)
      return `${minutes === 0 ? 'právě teď' : minutes + ' min'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
  } catch {
    return '';
  }
}

interface Props {
  item: FriendRequestListItem;
}

/**
 * Spec 1.8 (design audit §3) — inline řádek pro „Odeslané žádosti" sekci.
 * Vizuálně lehčí než UserCard (žádné cornerstones, žádný role chip).
 */
export function OutgoingRequestCard({ item }: Props) {
  const remove = useRemoveFriend();

  return (
    <div className={s.row}>
      <UserAvatar
        src={item.counterpart.avatarUrl}
        defaultType={item.counterpart.defaultAvatarType}
        size="sm"
        alt={item.counterpart.username}
        className={s.avatar}
      />
      <div className={s.text}>
        <strong className={s.username}>{item.counterpart.username}</strong>
        <span className={s.muted}>
          · čeká od {formatRelative(item.requestedAt)}
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => remove.mutate(item.friendshipId)}
        disabled={remove.isPending}
        className={s.cancelBtn}
      >
        <X size={14} aria-hidden="true" /> Zrušit
      </Button>
    </div>
  );
}
