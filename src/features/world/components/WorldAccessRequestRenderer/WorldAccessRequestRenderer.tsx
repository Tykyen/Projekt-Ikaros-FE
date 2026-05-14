import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, UserAvatar } from '@/shared/ui';
import type { WorldAccessRequestListItem } from '@/shared/types';
import {
  useApproveAccessRequest,
  useRejectAccessRequest,
} from '@/features/world/api/useWorldJoin';
import s from './WorldAccessRequestRenderer.module.css';

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
  item: WorldAccessRequestListItem;
}

export function WorldAccessRequestLeft({ item }: PartProps) {
  return (
    <UserAvatar
      src={item.requester.avatarUrl}
      size="md"
      alt={item.requester.username}
    />
  );
}

export function WorldAccessRequestMid({ item }: PartProps) {
  return (
    <>
      <div className={s.metaRow}>
        <span className={s.typeLabel}>Žádost o vstup do světa</span>
        <span className={s.timestamp}>{formatRelative(item.requestedAt)}</span>
      </div>
      <p className={s.title}>
        <strong>{item.requester.username}</strong> žádá o vstup do světa{' '}
        <Link to={`/svet/${item.worldId}`} className={s.worldLink}>
          {item.worldName}
        </Link>
      </p>
    </>
  );
}

interface ActionsProps {
  item: WorldAccessRequestListItem;
  onResolve: () => void;
  isLoading: boolean;
}

export function WorldAccessRequestActions({
  item,
  onResolve,
  isLoading,
}: ActionsProps) {
  const approve = useApproveAccessRequest();
  const reject = useRejectAccessRequest();
  const busy = isLoading || approve.isPending || reject.isPending;

  return (
    <>
      <Button
        size="sm"
        variant="danger"
        disabled={busy}
        onClick={async () => {
          try {
            await reject.mutateAsync({
              worldId: item.worldId,
              requestId: item.accessRequestId,
            });
            toast.info('Žádost odmítnuta.');
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
            await approve.mutateAsync({
              worldId: item.worldId,
              requestId: item.accessRequestId,
            });
            toast.success(
              `${item.requester.username} byl přijat do světa ${item.worldName}.`,
            );
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
