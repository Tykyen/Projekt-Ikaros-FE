import { useState } from 'react';
import { Button, EmptyState, Spinner } from '@/shared/ui';
import { useAdminAuditLog } from '../../api/useAdminUsers';
import type { AdminAuditAction } from '@/shared/types';
import s from './AuditLogTab.module.css';

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  BAN: 'Ban',
  UNBAN: 'Unban',
  ROLE_CHANGE: 'Změna role',
  ADMIN_PERMISSIONS_CHANGE: 'Změna oprávnění',
  USERNAME_REQUEST_APPROVED: 'Schválen username',
  USERNAME_REQUEST_REJECTED: 'Odmítnut username',
  FRIENDSHIP_COOLDOWN_RESET: 'Reset friendship cooldownu',
  IKAROS_NEWS_ARCHIVE: 'Archivace novinky',
  IKAROS_NEWS_UNARCHIVE: 'Obnova novinky',
  IKAROS_NEWS_DELETE: 'Smazání novinky',
};

const ACTION_CLASS: Record<AdminAuditAction, string> = {
  BAN: s.ban,
  UNBAN: s.unban,
  ROLE_CHANGE: s.roleChange,
  ADMIN_PERMISSIONS_CHANGE: s.permissions,
  USERNAME_REQUEST_APPROVED: s.approved,
  USERNAME_REQUEST_REJECTED: s.rejected,
  FRIENDSHIP_COOLDOWN_RESET: s.approved,
  IKAROS_NEWS_ARCHIVE: s.roleChange,
  IKAROS_NEWS_UNARCHIVE: s.approved,
  IKAROS_NEWS_DELETE: s.ban,
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatJson(value: unknown): string {
  if (value == null) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const LIMIT = 20;

export function AuditLogTab() {
  const [action, setAction] = useState<AdminAuditAction | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminAuditLog({
    page,
    limit: LIMIT,
    action: action || undefined,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <div className={s.filters}>
        <select
          className={s.actionSelect}
          value={action}
          onChange={(e) => {
            setAction(e.target.value as AdminAuditAction | '');
            setPage(1);
          }}
          aria-label="Filtrovat akci"
        >
          <option value="">Všechny akce</option>
          {(Object.keys(ACTION_LABELS) as AdminAuditAction[]).map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>
      </div>

      <div className={s.tableWrapper}>
        {isLoading ? (
          <div className={s.empty}>
            <Spinner /> Načítám audit log…
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            size="inline"
            title={
              action
                ? `Žádné záznamy pro akci „${ACTION_LABELS[action]}".`
                : 'Žádné záznamy.'
            }
          />
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Kdy</th>
                <th scope="col">Akce</th>
                <th scope="col">Aktér</th>
                <th scope="col">Cíl</th>
                <th scope="col">Změna</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Kdy">{formatDateTime(entry.createdAt)}</td>
                  <td data-label="Akce">
                    <span
                      className={`${s.actionBadge} ${ACTION_CLASS[entry.action]}`}
                    >
                      {ACTION_LABELS[entry.action]}
                    </span>
                  </td>
                  <td data-label="Aktér">
                    <div className={s.actorTarget}>
                      <span className={s.userName}>{entry.actorUsername}</span>
                      <span className={s.userSub}>{entry.actorId}</span>
                    </div>
                  </td>
                  <td data-label="Cíl">
                    <div className={s.actorTarget}>
                      <span className={s.userName}>{entry.targetUsername}</span>
                      <span className={s.userSub}>{entry.targetId}</span>
                    </div>
                  </td>
                  <td data-label="Změna">
                    {entry.before !== null && (
                      <div>
                        <span className={s.userSub}>Před:</span>
                        <pre className={s.diffBox}>
                          {formatJson(entry.before)}
                        </pre>
                      </div>
                    )}
                    {entry.after !== null && (
                      <div>
                        <span className={s.userSub}>Po:</span>
                        <pre className={s.diffBox}>
                          {formatJson(entry.after)}
                        </pre>
                      </div>
                    )}
                    {entry.reason && (
                      <p className={s.reasonBox}>Důvod: {entry.reason}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className={s.pagination}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            ← Předchozí
          </Button>
          <span className={s.pageInfo}>
            Strana {page} z {totalPages} · celkem {total}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Další →
          </Button>
        </div>
      </div>
    </>
  );
}
