import { useState } from 'react';
import { Ban, Clock, KeyRound, Skull } from 'lucide-react';
import { useAtomValue } from 'jotai';
import {
  Badge,
  Button,
  ConfirmDialog,
  RoleStar,
  Spinner,
  UserAvatar,
} from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, type AdminUsersListItem } from '@/shared/types';
import { ROLE_LABELS, ASSIGNABLE_ROLES } from '@/shared/types/userRoleLabels';
import {
  useAdminUpdateRole,
  useAdminUnbanUser,
  useAdminSetAdminPermissions,
  useAdminCancelDeletion,
} from '../../api/useAdminUsers';
import { BanModal } from './BanModal';
import { AdminDeleteUserModal } from './AdminDeleteUserModal';
import { BulkToolbar } from './BulkToolbar';
import s from './UsersTable.module.css';

interface Props {
  items: AdminUsersListItem[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

export function UsersTable({
  items,
  total,
  page,
  limit,
  isLoading,
  onPageChange,
}: Props) {
  const currentUser = useAtomValue(currentUserAtom);
  const updateRole = useAdminUpdateRole();
  const unban = useAdminUnbanUser();
  const setPerms = useAdminSetAdminPermissions();
  const cancelDeletion = useAdminCancelDeletion();
  const [banTarget, setBanTarget] = useState<AdminUsersListItem | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminUsersListItem | null>(null);
  const [unbanTarget, setUnbanTarget] =
    useState<AdminUsersListItem | null>(null);
  const [cancelDeletionTarget, setCancelDeletionTarget] =
    useState<AdminUsersListItem | null>(null);
  // D-025 — bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectableItems = items.filter((u) => u.id !== currentUser?.id);
  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((u) => selectedIds.has(u.id));
  const selectedItems = items.filter((u) => selectedIds.has(u.id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((u) => u.id)));
    }
  }

  const isSuperadmin = currentUser?.role === UserRole.Superadmin;
  // R-05 (A) — Admin s canManageAdmins smí delegovat moderaci obsahu jiným
  // Adminům; mintit další managery (canManageAdmins) smí jen Superadmin.
  const viewerManagesAdmins =
    currentUser?.role === UserRole.Admin &&
    currentUser?.adminPermissions?.canManageAdmins === true;
  const canSeePerms = isSuperadmin || viewerManagesAdmins;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (isLoading) {
    return (
      <div className={s.tableWrapper}>
        <div className={s.empty}>
          <Spinner /> Načítám uživatele…
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={s.tableWrapper}>
        <div className={s.empty}>Žádní uživatelé neodpovídají filtrům.</div>
      </div>
    );
  }

  return (
    <>
      <BulkToolbar
        selected={selectedItems}
        onClear={() => setSelectedIds(new Set())}
      />
      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col" className={s.checkboxCell}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Vybrat vše"
                />
              </th>
              <th scope="col">Uživatel</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Vytvořen</th>
              <th scope="col" className={s.actionsCell}>
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const isSelf = currentUser?.id === u.id;
              return (
                <tr key={u.id}>
                  <td data-label="" className={s.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleOne(u.id)}
                      disabled={isSelf}
                      aria-label={`Vybrat ${u.username}`}
                    />
                  </td>
                  <td data-label="Uživatel">
                    <div className={s.userCell}>
                      <UserAvatar
                        src={u.avatarUrl}
                        defaultType={u.defaultAvatarType}
                        size="sm"
                        alt={u.username}
                      />
                      <div className={s.userMeta}>
                        <span className={s.username}>{u.username}</span>
                        <span
                          className={s.userSub}
                          title={`${u.displayName ?? '—'} · ${u.email}`}
                        >
                          {u.displayName ?? '—'} · {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Role">
                    <span className={s.roleCell}>
                      <RoleStar role={u.role} size="sm" />
                      {ROLE_LABELS[u.role]}
                      {u.adminPermissions?.canManageAdmins && (
                        <Badge variant="accent" icon={<KeyRound size={12} />}>
                          A+
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className={s.statusChips}>
                      {u.isDeleted && (
                        <Badge variant="default" icon={<Skull size={12} />}>
                          DELETED
                        </Badge>
                      )}
                      {u.bannedAt && (
                        <Badge
                          variant="danger"
                          icon={<Ban size={12} />}
                          title={
                            u.bannedUntil
                              ? `Do ${new Date(u.bannedUntil).toLocaleString('cs-CZ')}`
                              : 'Trvalý ban'
                          }
                        >
                          {u.bannedUntil
                            ? `BAN do ${new Date(u.bannedUntil).toLocaleDateString('cs-CZ')}`
                            : 'BANNED'}
                        </Badge>
                      )}
                      {!u.isDeleted && u.deletionRequestedAt && (
                        <Badge
                          variant="warning"
                          icon={<Clock size={12} />}
                          title={u.deletionReason ?? 'Pending soft-delete'}
                        >
                          DELETION PENDING
                        </Badge>
                      )}
                      {u.pendingUsernameRequest && (
                        <Badge variant="warning">PENDING USERNAME</Badge>
                      )}
                      {!u.bannedAt &&
                        !u.deletionRequestedAt &&
                        !u.isDeleted &&
                        !u.pendingUsernameRequest && (
                          <span className={s.userSub}>—</span>
                        )}
                    </span>
                  </td>
                  <td data-label="Vytvořen">{formatShortDate(u.createdAt)}</td>
                  <td data-label="Akce" className={s.actionsCell}>
                    <div className={s.actionsRow}>
                      <select
                        className={s.roleSelect}
                        value={u.role}
                        disabled={isSelf || updateRole.isPending}
                        aria-label={`Změnit roli pro ${u.username}`}
                        onChange={(e) =>
                          updateRole.mutate({
                            userId: u.id,
                            role: Number(e.target.value) as UserRole,
                          })
                        }
                        title={
                          isSelf
                            ? 'Sebe nelze upravit'
                            : 'Změnit roli (BE odmítne pokud nemáš oprávnění)'
                        }
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>

                      {u.bannedAt ? (
                        <button
                          type="button"
                          className={s.actionsButton}
                          onClick={() => setUnbanTarget(u)}
                          disabled={isSelf || unban.isPending}
                        >
                          Odbanovat
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={s.actionsButton}
                          onClick={() => setBanTarget(u)}
                          disabled={isSelf}
                        >
                          Banovat
                        </button>
                      )}

                      {/* 1.3c — Smazat účet / Obnovit smazání */}
                      {!u.isDeleted &&
                        (u.deletionRequestedAt ? (
                          <button
                            type="button"
                            className={s.actionsButton}
                            onClick={() => setCancelDeletionTarget(u)}
                            disabled={isSelf || cancelDeletion.isPending}
                            title="Revert pending soft-delete (před hard cleanup cronem)"
                          >
                            Obnovit smazání
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={s.actionsButton}
                            onClick={() => setDeleteTarget(u)}
                            disabled={isSelf}
                            title="Naplánovat smazání účtu (30denní hold, lze revertnout)"
                          >
                            Smazat účet
                          </button>
                        ))}

                      {canSeePerms && u.role === UserRole.Admin && !isSelf && (
                        <div className={s.permissionsGroup}>
                          {/* R-05 (A) — mintit admin-managery smí jen Superadmin */}
                          {isSuperadmin && (
                            <label className={s.filterCheckbox}>
                              <input
                                type="checkbox"
                                checked={!!u.adminPermissions?.canManageAdmins}
                                onChange={(e) =>
                                  setPerms.mutate({
                                    userId: u.id,
                                    permissions: {
                                      canManageAdmins: e.target.checked,
                                    },
                                  })
                                }
                                disabled={setPerms.isPending}
                                title="Smí spravovat oprávnění jiných Adminů"
                              />
                              Správa adminů
                            </label>
                          )}
                          <label className={s.filterCheckbox}>
                            <input
                              type="checkbox"
                              checked={!!u.adminPermissions?.canModerateContent}
                              onChange={(e) =>
                                setPerms.mutate({
                                  userId: u.id,
                                  permissions: {
                                    canModerateContent: e.target.checked,
                                  },
                                })
                              }
                              disabled={setPerms.isPending}
                              title="Schvalování příspěvků (3.x pipeline)"
                            />
                            Moderace obsahu
                          </label>
                          {/* R-05 (A) — `canEditPlatformPages` toggle skryt: BE
                              flag nikde nevynucuje (žádná editace platform stránek). */}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={s.pagination}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
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
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Další →
          </Button>
        </div>
      </div>

      <BanModal
        target={banTarget}
        onClose={() => setBanTarget(null)}
      />
      <AdminDeleteUserModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!unbanTarget}
        onClose={() => setUnbanTarget(null)}
        title="Odbanovat uživatele?"
        message={
          unbanTarget ? (
            <>
              Opravdu chceš odbanovat <strong>{unbanTarget.username}</strong>?
            </>
          ) : null
        }
        confirmLabel="Odbanovat"
        isPending={unban.isPending}
        onConfirm={async () => {
          if (!unbanTarget) return;
          await unban.mutateAsync(unbanTarget.id);
          setUnbanTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!cancelDeletionTarget}
        onClose={() => setCancelDeletionTarget(null)}
        title="Zrušit plánované smazání?"
        message={
          cancelDeletionTarget ? (
            <>
              Obnovit účet <strong>{cancelDeletionTarget.username}</strong>{' '}
              (zruší pending soft-delete před hard cleanup cronem)?
            </>
          ) : null
        }
        confirmLabel="Obnovit"
        isPending={cancelDeletion.isPending}
        onConfirm={async () => {
          if (!cancelDeletionTarget) return;
          await cancelDeletion.mutateAsync(cancelDeletionTarget.id);
          setCancelDeletionTarget(null);
        }}
      />
    </>
  );
}
