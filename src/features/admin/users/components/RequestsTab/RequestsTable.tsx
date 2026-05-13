import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button, ConfirmDialog, Spinner, UserAvatar } from '@/shared/ui';
import type {
  AdminUsernameRequestListItem,
  UsernameChangeRequestStatus,
} from '@/shared/types';
import {
  useAdminUsernameRequests,
  useAdminApproveUsernameRequest,
} from '../../api/useAdminUsers';
import { RejectRequestModal } from './RejectRequestModal';
import s from './RequestsTable.module.css';

const STATUS_LABELS: Record<UsernameChangeRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Schválené',
  rejected: 'Odmítnuté',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

export function RequestsTable() {
  const [status, setStatus] = useState<UsernameChangeRequestStatus>('pending');
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] =
    useState<AdminUsernameRequestListItem | null>(null);
  // D-059 — sdílený ConfirmDialog místo native window.confirm
  const [approveTarget, setApproveTarget] =
    useState<AdminUsernameRequestListItem | null>(null);

  const { data, isLoading } = useAdminUsernameRequests({ status, page });
  const approve = useAdminApproveUsernameRequest();

  const items = data?.items ?? [];

  return (
    <>
      <div className={s.statusTabs}>
        {(Object.keys(STATUS_LABELS) as UsernameChangeRequestStatus[]).map(
          (st) => (
            <button
              key={st}
              type="button"
              className={`${s.statusTab} ${
                status === st ? s.statusTabActive : ''
              }`}
              onClick={() => {
                setStatus(st);
                setPage(1);
              }}
            >
              {STATUS_LABELS[st]}
            </button>
          ),
        )}
      </div>

      <div className={s.tableWrapper}>
        {isLoading ? (
          <div className={s.empty}>
            <Spinner /> Načítám žádosti…
          </div>
        ) : items.length === 0 ? (
          <div className={s.empty}>
            {status === 'pending'
              ? 'Žádné žádosti o změnu username nečekají na schválení.'
              : `Žádné ${STATUS_LABELS[status].toLowerCase()} žádosti.`}
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Uživatel</th>
                <th scope="col">Stávající → požadované</th>
                <th scope="col">Podáno</th>
                <th scope="col">Stav</th>
                {status === 'pending' && (
                  <th scope="col" style={{ textAlign: 'right' }}>
                    Akce
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((req) => (
                <tr key={req.id}>
                  <td data-label="Uživatel">
                    <div className={s.userCell}>
                      <UserAvatar
                        src={req.user?.avatarUrl}
                        defaultType={req.user?.defaultAvatarType ?? 'male'}
                        size="sm"
                        alt={req.user?.username ?? ''}
                      />
                      <span className={s.userName}>
                        {req.user?.username ?? '(smazaný)'}
                      </span>
                    </div>
                  </td>
                  <td data-label="Change">
                    {req.user?.username ?? '?'}
                    <span className={s.arrow}>→</span>
                    <span className={s.targetUsername}>
                      {req.requestedUsername}
                    </span>
                  </td>
                  <td data-label="Podáno">{formatDate(req.requestedAt)}</td>
                  <td data-label="Stav">
                    {STATUS_LABELS[req.status]}
                    {req.decisionReason && (
                      <div className={s.decisionReason}>
                        {req.decisionReason}
                      </div>
                    )}
                  </td>
                  {status === 'pending' && (
                    <td data-label="Akce" style={{ textAlign: 'right' }}>
                      <div className={s.actionsRow}>
                        <Button
                          size="sm"
                          onClick={() => setApproveTarget(req)}
                          disabled={approve.isPending}
                        >
                          <Check size={14} /> Schválit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectTarget(req)}
                        >
                          <X size={14} /> Odmítnout
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RejectRequestModal
        target={rejectTarget}
        onClose={() => setRejectTarget(null)}
      />

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Schválit změnu přezdívky?"
        message={
          approveTarget ? (
            <>
              Schválit změnu z{' '}
              <strong>{approveTarget.user?.username ?? '(neznámý)'}</strong> na{' '}
              <strong>{approveTarget.requestedUsername}</strong>?
            </>
          ) : null
        }
        confirmLabel="Schválit"
        isPending={approve.isPending}
        onConfirm={async () => {
          if (!approveTarget) return;
          await approve.mutateAsync(approveTarget.id);
          setApproveTarget(null);
        }}
      />
    </>
  );
}
