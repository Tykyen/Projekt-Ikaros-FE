import { Check, X } from 'lucide-react';
import { Button, UserAvatar } from '@/shared/ui';
import type { FriendRequestListItem } from '@/shared/types';
import {
  useAcceptFriendRequest,
  useRemoveFriend,
} from '../api/useFriendshipMutations';
import s from './FriendRequestRenderer.module.css';

function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60)
      return `· ${minutes === 0 ? 'právě teď' : minutes + ' min'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `· ${hours} h`;
    const days = Math.floor(hours / 24);
    return `· ${days} d`;
  } catch {
    return '';
  }
}

interface PartProps {
  item: FriendRequestListItem;
}

export function FriendRequestLeft({ item }: PartProps) {
  return (
    <UserAvatar
      src={item.counterpart.avatarUrl}
      defaultType={item.counterpart.defaultAvatarType}
      size="md"
      alt={item.counterpart.username}
    />
  );
}

export function FriendRequestMid({ item }: PartProps) {
  return (
    <>
      <div className={s.metaRow}>
        <span className={s.typeLabel}>Žádost o přátelství</span>
        <span className={s.timestamp}>{formatRelative(item.requestedAt)}</span>
      </div>
      <p className={s.title}>
        <strong>{item.counterpart.username}</strong> ti posílá žádost
        o&nbsp;přátelství
      </p>
    </>
  );
}

interface ActionsProps {
  item: FriendRequestListItem;
  onResolve: () => void;
  isLoading: boolean;
}

export function FriendRequestActions({
  item,
  onResolve,
  isLoading,
}: ActionsProps) {
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriend();
  const busy = isLoading || accept.isPending || remove.isPending;

  return (
    <>
      <Button
        size="sm"
        variant="danger"
        disabled={busy}
        onClick={async () => {
          await remove.mutateAsync(item.friendshipId);
          onResolve();
        }}
      >
        <X size={14} aria-hidden="true" /> Odmítnout
      </Button>
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          await accept.mutateAsync(item.friendshipId);
          onResolve();
        }}
      >
        <Check size={14} aria-hidden="true" /> Přijmout
      </Button>
    </>
  );
}
