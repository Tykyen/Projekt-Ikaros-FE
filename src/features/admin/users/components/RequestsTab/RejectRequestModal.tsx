import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useAdminRejectUsernameRequest } from '../../api/useAdminUsers';
import type { AdminUsernameRequestListItem } from '@/shared/types';
import s from './RejectRequestModal.module.css';

interface Props {
  target: AdminUsernameRequestListItem | null;
  onClose: () => void;
}

export function RejectRequestModal({ target, onClose }: Props) {
  const reject = useAdminRejectUsernameRequest();
  const [reason, setReason] = useState('');

  function handleClose() {
    setReason('');
    onClose();
  }

  async function onSubmit() {
    if (!target) return;
    await reject.mutateAsync({
      requestId: target.id,
      reason: reason.trim() || undefined,
    });
    setReason('');
    onClose();
  }

  return (
    <Modal
      open={!!target}
      onClose={handleClose}
      title="Odmítnout žádost"
      size="md"
      footer={
        <div className={s.modalFooter}>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={reject.isPending}
          >
            Zrušit
          </Button>
          <Button
            variant="danger"
            onClick={onSubmit}
            disabled={reject.isPending}
          >
            Odmítnout
          </Button>
        </div>
      }
    >
      {target && (
        <div className={s.modalBody}>
          <p>
            Odmítnout žádost{' '}
            <strong>{target.user?.username ?? '(neznámý)'}</strong> o změnu
            username na{' '}
            <strong>{target.requestedUsername}</strong>?
          </p>
          <label className={s.modalField}>
            <span>Důvod (volitelný)</span>
            <textarea
              className={s.modalTextarea}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Např. nevhodný název..."
            />
          </label>
        </div>
      )}
    </Modal>
  );
}
