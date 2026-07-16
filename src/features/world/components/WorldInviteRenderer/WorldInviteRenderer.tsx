import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, UserAvatar } from '@/shared/ui';
import type { WorldInvitePendingItem } from '@/shared/types';
import {
  useAcceptInvite,
  useDeclineInvite,
} from '@/features/world/api/useWorldInvites';
import s from './WorldInviteRenderer.module.css';

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
  item: WorldInvitePendingItem;
}

export function WorldInviteLeft({ item }: PartProps) {
  return (
    <UserAvatar
      src={item.invitedBy?.avatarUrl}
      size="md"
      alt={item.invitedBy?.username ?? 'PJ'}
    />
  );
}

export function WorldInviteMid({ item }: PartProps) {
  return (
    <>
      <div className={s.metaRow}>
        <span className={s.typeLabel}>Pozvánka do světa</span>
        <span className={s.timestamp}>{formatRelative(item.createdAt)}</span>
      </div>
      <p className={s.title}>
        {item.invitedBy ? (
          <strong>{item.invitedBy.username}</strong>
        ) : (
          <strong>Vypravěč</strong>
        )}{' '}
        tě zve do světa{' '}
        <Link to={`/svet/${item.worldSlug}`} className={s.worldLink}>
          {item.worldName}
        </Link>
      </p>
    </>
  );
}

interface ActionsProps {
  item: WorldInvitePendingItem;
  onResolve: () => void;
  isLoading: boolean;
}

export function WorldInviteActions({
  item,
  onResolve,
  isLoading,
}: ActionsProps) {
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const busy = isLoading || accept.isPending || decline.isPending;

  return (
    <>
      <Button
        size="sm"
        variant="danger"
        disabled={busy}
        onClick={async () => {
          try {
            await decline.mutateAsync({
              worldId: item.worldId,
              inviteId: item.inviteId,
            });
            toast.info('Pozvánka odmítnuta.');
          } catch {
            toast.error('Odmítnutí se nezdařilo.');
          }
          onResolve();
        }}
      >
        <X size={14} aria-hidden="true" /> Odmítnout
      </Button>
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          try {
            await accept.mutateAsync({
              worldId: item.worldId,
              inviteId: item.inviteId,
            });
            toast.success(`Přidal ses do světa ${item.worldName}.`);
          } catch {
            toast.error('Přijetí se nezdařilo.');
          }
          onResolve();
        }}
      >
        <Check size={14} aria-hidden="true" /> Přijmout
      </Button>
    </>
  );
}
