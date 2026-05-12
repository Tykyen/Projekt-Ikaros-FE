import { useState } from 'react';
import { Ban, ShieldOff, UserCog, X } from 'lucide-react';
import { Button, Modal } from '@/shared/ui';
import { UserRole, type AdminUsersListItem } from '@/shared/types';
import { ROLE_LABELS, ASSIGNABLE_ROLES } from '@/shared/types/userRoleLabels';
import {
  useAdminBulkBan,
  useAdminBulkUnban,
  useAdminBulkRoleChange,
} from '../../api/useAdminUsers';
import s from './UsersTable.module.css';

interface Props {
  selected: AdminUsersListItem[];
  onClear: () => void;
}

type Duration = 'permanent' | '1' | '7' | '30' | '90';
const DURATION_LABELS: Record<Duration, string> = {
  permanent: 'Trvalý',
  '1': '1 den',
  '7': '7 dní',
  '30': '30 dní',
  '90': '90 dní',
};

export function BulkToolbar({ selected, onClear }: Props) {
  const bulkBan = useAdminBulkBan();
  const bulkUnban = useAdminBulkUnban();
  const bulkRole = useAdminBulkRoleChange();

  const [banOpen, setBanOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<Duration>('permanent');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.Hrac);

  const count = selected.length;
  if (count === 0) return null;

  const ids = selected.map((u) => u.id);

  async function onConfirmBan() {
    const durationDays =
      duration === 'permanent' ? undefined : Number(duration);
    await bulkBan.mutateAsync({
      userIds: ids,
      reason: reason.trim() || undefined,
      durationDays,
    });
    setBanOpen(false);
    setReason('');
    setDuration('permanent');
    onClear();
  }

  async function onConfirmUnban() {
    if (!confirm(`Odbanovat ${count} uživatelů?`)) return;
    await bulkUnban.mutateAsync(ids);
    onClear();
  }

  async function onConfirmRole() {
    await bulkRole.mutateAsync({ userIds: ids, role: newRole });
    setRoleOpen(false);
    onClear();
  }

  return (
    <>
      <div className={s.bulkToolbar} role="region" aria-label="Bulk akce">
        <span className={s.bulkCount}>{count} vybráno</span>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setBanOpen(true)}
          disabled={bulkBan.isPending}
        >
          <Ban size={14} /> Banovat
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onConfirmUnban}
          disabled={bulkUnban.isPending}
        >
          <ShieldOff size={14} /> Odbanovat
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setRoleOpen(true)}
          disabled={bulkRole.isPending}
        >
          <UserCog size={14} /> Změnit roli
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X size={14} /> Zrušit výběr
        </Button>
      </div>

      <Modal
        open={banOpen}
        onClose={() => setBanOpen(false)}
        title={`Banovat ${count} uživatelů`}
        size="md"
        footer={
          <div className={s.bulkFooter}>
            <Button variant="secondary" onClick={() => setBanOpen(false)}>
              Zrušit
            </Button>
            <Button
              variant="danger"
              onClick={onConfirmBan}
              disabled={bulkBan.isPending}
            >
              Banovat
            </Button>
          </div>
        }
      >
        <div className={s.bulkBody}>
          <p>
            Opravdu chceš zabanovat <strong>{count}</strong>{' '}
            {count === 1 ? 'uživatele' : 'uživatelů'}?
          </p>
          <label className={s.bulkField}>
            <span>Trvání</span>
            <select
              className={s.bulkSelect}
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
            >
              {(Object.keys(DURATION_LABELS) as Duration[]).map((d) => (
                <option key={d} value={d}>
                  {DURATION_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <label className={s.bulkField}>
            <span>Důvod (volitelný)</span>
            <textarea
              className={s.bulkTextarea}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <p className={s.bulkWarning}>
            ⚠ Per-user hierarchy check: pokud nemáš oprávnění na některé z
            vybraných, BE je vrátí v `failed[]`.
          </p>
        </div>
      </Modal>

      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title={`Změnit roli pro ${count} uživatelů`}
        size="md"
        footer={
          <div className={s.bulkFooter}>
            <Button variant="secondary" onClick={() => setRoleOpen(false)}>
              Zrušit
            </Button>
            <Button
              onClick={onConfirmRole}
              disabled={bulkRole.isPending}
            >
              Přiřadit
            </Button>
          </div>
        }
      >
        <div className={s.bulkBody}>
          <label className={s.bulkField}>
            <span>Nová role</span>
            <select
              className={s.bulkSelect}
              value={newRole}
              onChange={(e) => setNewRole(Number(e.target.value) as UserRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </>
  );
}
