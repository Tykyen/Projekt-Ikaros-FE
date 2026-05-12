import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button, UserAvatar } from '@/shared/ui';
import type { AdminUsernameRequestListItem } from '@/shared/types';
import { useAdminApproveUsernameRequest } from '@/features/admin/users/api/useAdminUsers';
import { RejectRequestModal } from '@/features/admin/users/components/RequestsTab/RejectRequestModal';
import s from './UsernameRequestRenderer.module.css';

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

interface UsernameRequestLeftProps {
  item: AdminUsernameRequestListItem;
}

export function UsernameRequestLeft({ item }: UsernameRequestLeftProps) {
  return (
    <UserAvatar
      src={item.user?.avatarUrl}
      defaultType={item.user?.defaultAvatarType ?? 'male'}
      size="md"
      alt={item.user?.username ?? 'Smazaný účet'}
    />
  );
}

interface UsernameRequestMidProps {
  item: AdminUsernameRequestListItem;
}

export function UsernameRequestMid({ item }: UsernameRequestMidProps) {
  return (
    <>
      <div className={s.metaRow}>
        <span className={s.typeLabel}>Žádost o změnu username</span>
        <span className={s.timestamp}>{formatRelative(item.requestedAt)}</span>
      </div>
      <p className={s.title}>
        <strong>{item.user?.username ?? '(smazaný)'}</strong> žádá změnu na{' '}
        <strong className={s.target}>{item.requestedUsername}</strong>
      </p>
    </>
  );
}

interface UsernameRequestActionsProps {
  item: AdminUsernameRequestListItem;
  onResolve: () => void;
  isLoading: boolean;
}

export function UsernameRequestActions({
  item,
  onResolve,
  isLoading,
}: UsernameRequestActionsProps) {
  const [showReject, setShowReject] = useState(false);
  const approve = useAdminApproveUsernameRequest();

  return (
    <>
      <Button
        size="sm"
        variant="danger"
        disabled={isLoading || approve.isPending}
        onClick={() => setShowReject(true)}
      >
        <X size={14} aria-hidden="true" /> Odmítnout
      </Button>
      <Button
        size="sm"
        disabled={isLoading || approve.isPending}
        onClick={async () => {
          await approve.mutateAsync(item.id);
          onResolve();
        }}
      >
        <Check size={14} aria-hidden="true" /> Schválit
      </Button>
      <RejectRequestModal
        target={showReject ? item : null}
        onClose={() => {
          setShowReject(false);
          onResolve();
        }}
      />
    </>
  );
}
