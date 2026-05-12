import { useState } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import { useAdminRequestDeletion } from '../../api/useAdminUsers';
import type { AdminUsersListItem } from '@/shared/types';
import styles from './AdminDeleteUserModal.module.css';

interface Props {
  target: AdminUsersListItem | null;
  onClose: () => void;
}

/**
 * 1.3c — moderační smazání cizího účtu (admin/superadmin).
 * - Typing target username + povinný reason
 * - Hierarchy guards (self / Superadmin / canManageAdmins) jsou BE-side;
 *   pokud kombinace nevyhoví, BE vrátí 403 a hook zobrazí toast.
 * - PJ blokace (SOLE_PJ_BLOCK) — pro moderační akci taky BE vyhodí 400,
 *   moderace musí jako self-delete prvně vyřešit PJ. 1.3c verze ignoruje
 *   handover preview v admin UI (vykonává se silently při requestDeletion).
 */
export function AdminDeleteUserModal({ target, onClose }: Props) {
  const requestDeletion = useAdminRequestDeletion();
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState('');

  if (!target) return null;

  const usernameMatch =
    typed.toLowerCase().trim() === target.username.toLowerCase();
  const reasonOk = reason.trim().length > 0 && reason.trim().length <= 500;
  const canSubmit = usernameMatch && reasonOk && !requestDeletion.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    requestDeletion.mutate(
      { userId: target.id, reason: reason.trim() },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open onClose={onClose} title="Naplánovat smazání účtu" size="md">
      <div className={styles.body}>
        <p className={styles.intro}>
          Tato akce nastaví 30denní hold. Hard cleanup proběhne automaticky po
          30 dnech, ale do té doby můžeš plánované smazání revertnout.
        </p>

        <div className={styles.field}>
          <label htmlFor="adm-delete-confirm" className={styles.label}>
            Pro potvrzení napiš username uživatele:{' '}
            <code>{target.username}</code>
          </label>
          <Input
            id="adm-delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="adm-delete-reason" className={styles.label}>
            Důvod (povinný, max 500 znaků):
          </label>
          <textarea
            id="adm-delete-reason"
            className={styles.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <span className={styles.counter}>{reason.length} / 500</span>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={requestDeletion.isPending}
          >
            Zrušit
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {requestDeletion.isPending ? 'Plánuji…' : 'Naplánovat smazání'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
