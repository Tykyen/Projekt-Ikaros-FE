import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, UserAvatar } from '@/shared/ui';
import type { WorldJoinRequestListItem } from '@/shared/types';
import {
  useAcceptWorldJoinRequest,
  useRejectWorldJoinRequest,
} from '@/features/world/api/useWorldJoinRequestActions';
import s from './WorldJoinRequestRenderer.module.css';

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
  item: WorldJoinRequestListItem;
}

export function WorldJoinRequestLeft({ item }: PartProps) {
  return (
    <UserAvatar
      src={item.requester.avatarUrl}
      defaultType="being"
      size="md"
      alt={item.requester.username}
    />
  );
}

export function WorldJoinRequestMid({ item }: PartProps) {
  return (
    <>
      <div className={s.metaRow}>
        <span className={s.typeLabel}>Žádost o vstup do světa</span>
        <span className={s.timestamp}>{formatRelative(item.requestedAt)}</span>
      </div>
      <p className={s.title}>
        <strong>{item.requester.username}</strong> žádá o vstup do světa{' '}
        <Link to={`/svet/${item.worldId}/info`} className={s.worldLink}>
          {item.worldName}
        </Link>
      </p>
    </>
  );
}

interface ActionsProps {
  item: WorldJoinRequestListItem;
  onResolve: () => void;
  isLoading: boolean;
}

export function WorldJoinRequestActions({
  item,
  onResolve,
  isLoading,
}: ActionsProps) {
  const accept = useAcceptWorldJoinRequest();
  const reject = useRejectWorldJoinRequest();
  const busy = isLoading || accept.isPending || reject.isPending;

  const handleAccept = async () => {
    try {
      await accept.mutateAsync({
        worldId: item.worldId,
        membershipId: item.membershipId,
      });
      toast.success(
        `Přijal/a jsi ${item.requester.username} do „${item.worldName}".`,
      );
      onResolve();
    } catch {
      toast.error('Schválení selhalo. Zkus to znovu.');
    }
  };

  const handleReject = async () => {
    const confirmed = window.confirm(
      `Opravdu chceš zamítnout žádost uživatele ${item.requester.username} o vstup do „${item.worldName}"?`,
    );
    if (!confirmed) return;
    try {
      await reject.mutateAsync({
        worldId: item.worldId,
        membershipId: item.membershipId,
      });
      toast.success('Žádost zamítnuta.');
      onResolve();
    } catch {
      toast.error('Zamítnutí selhalo. Zkus to znovu.');
    }
  };

  return (
    <>
      <Button size="sm" variant="danger" disabled={busy} onClick={handleReject}>
        <X size={14} aria-hidden="true" /> Odmítnout
      </Button>
      <Button size="sm" disabled={busy} onClick={handleAccept}>
        <Check size={14} aria-hidden="true" /> Přijmout
      </Button>
    </>
  );
}
