import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useAdminBanUser } from '../../api/useAdminUsers';
import type { AdminUsersListItem } from '@/shared/types';
import s from './BanModal.module.css';

interface Props {
  target: AdminUsersListItem | null;
  onClose: () => void;
}

type Duration = 'permanent' | '1' | '7' | '30' | '90';

const DURATION_LABELS: Record<Duration, string> = {
  permanent: 'Trvalý',
  '1': '1 den',
  '7': '7 dní',
  '30': '30 dní',
  '90': '90 dní',
};

export function BanModal({ target, onClose }: Props) {
  const ban = useAdminBanUser();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<Duration>('permanent');

  function handleClose() {
    setReason('');
    setDuration('permanent');
    onClose();
  }

  async function onSubmit() {
    if (!target) return;
    const durationDays = duration === 'permanent' ? undefined : Number(duration);
    await ban.mutateAsync({
      userId: target.id,
      reason: reason.trim() || undefined,
      durationDays,
    });
    setReason('');
    setDuration('permanent');
    onClose();
  }

  return (
    <Modal
      open={!!target}
      onClose={handleClose}
      title={target ? `Banovat ${target.username}` : 'Banovat'}
      size="md"
      footer={
        <div className={s.footer}>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={ban.isPending}
          >
            Zrušit
          </Button>
          <Button
            variant="danger"
            onClick={onSubmit}
            disabled={ban.isPending}
          >
            ⛔ Banovat
          </Button>
        </div>
      }
    >
      {target && (
        <div className={s.body}>
          <p className={s.confirm}>
            Opravdu chceš zabanovat uživatele <strong>{target.username}</strong>?
          </p>
          <label className={s.field}>
            <span>Trvání</span>
            <select
              className={s.select}
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
          <label className={s.field}>
            <span>Důvod (volitelný)</span>
            <textarea
              className={s.textarea}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Např. opakované porušení pravidel..."
            />
          </label>
          <p className={s.warning}>
            ⚠ Zabanování okamžitě odhlásí všechna jeho zařízení.
          </p>
        </div>
      )}
    </Modal>
  );
}
