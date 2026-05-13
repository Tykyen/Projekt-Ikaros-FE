import { ShieldOff } from 'lucide-react';
import { Button, UserAvatar } from '@/shared/ui';
import type { BlockedItem } from '@/shared/types';
import { useUnblockUser } from '../api/useFriendshipMutations';
import s from './OutgoingRequestCard.module.css';

function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) return `${minutes === 0 ? 'právě teď' : minutes + ' min'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
  } catch {
    return '';
  }
}

interface Props {
  item: BlockedItem;
}

/**
 * Spec D-055 — inline řádek pro sekci „Zablokovaní" v FriendsTab.
 * Reuse `OutgoingRequestCard.module.css` (stejný shape: avatar + text +
 * trailing ghost button).
 */
export function BlockedRequestCard({ item }: Props) {
  const unblock = useUnblockUser();

  return (
    <div className={s.row}>
      <UserAvatar
        src={item.user.avatarUrl}
        defaultType={item.user.defaultAvatarType}
        size="sm"
        alt={item.user.username}
        className={s.avatar}
        deleted={item.user.deleted}
      />
      <div className={s.text}>
        <strong className={s.username}>{item.user.username}</strong>
        <span className={s.muted}>
          · zablokován od {formatRelative(item.blockedAt)}
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => unblock.mutate(item.user.id)}
        disabled={unblock.isPending}
        className={s.cancelBtn}
      >
        <ShieldOff size={14} aria-hidden="true" /> Odblokovat
      </Button>
    </div>
  );
}
