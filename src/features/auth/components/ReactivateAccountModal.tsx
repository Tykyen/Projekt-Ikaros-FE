import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/shared/ui';
import { useReactivateDeletion } from '@/features/profile/api/useDeleteAccount';
import { consumeLoginIntent } from '@/shared/lib/loginIntent';
import styles from './ReactivateAccountModal.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface Props {
  open: boolean;
  credentials: { identifier: string; password: string };
  deletionRequestedAt: string;
  scheduledHardDeleteAt: string;
  /** Called pokud uživatel zvolí "Nepřihlašovat" (modal se zavře a session zůstává odhlášená). */
  onCancel: () => void;
}

/**
 * 1.3c — confirmační modal po `login` → `deletion_pending` response.
 *
 * Workflow:
 * 1. LoginModal dostane `status: 'deletion_pending'` z useLogin
 * 2. Switche na ReactivateAccountModal s předanými credentials + dates
 * 3. User klikne "Obnovit a přihlásit" → POST /auth/reactivate-deletion
 *    → BE vyčistí deletion flagy + vrátí standardní login pair → setAuth + redirect
 */
export function ReactivateAccountModal({
  open,
  credentials,
  deletionRequestedAt,
  scheduledHardDeleteAt,
  onCancel,
}: Props) {
  const reactivate = useReactivateDeletion();
  const navigate = useNavigate();

  const handleReactivate = () => {
    reactivate.mutate(credentials, {
      onSuccess: () => {
        const intent = consumeLoginIntent();
        navigate(intent ?? '/');
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Tvůj účet čeká na smazání"
      size="sm"
      closeOnBackdrop={false}
    >
      <div className={styles.body}>
        <p className={styles.intro}>
          Tento účet byl naplánován na smazání. Pokud chceš pokračovat
          s přihlášením, smazání bude zrušeno.
        </p>
        <dl className={styles.dates}>
          <div>
            <dt>Naplánováno:</dt>
            <dd>{formatDate(deletionRequestedAt)}</dd>
          </div>
          <div>
            <dt>Hard delete:</dt>
            <dd>{formatDate(scheduledHardDeleteAt)}</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={reactivate.isPending}>
            Nepřihlašovat
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={reactivate.isPending}
            onClick={handleReactivate}
          >
            Obnovit a přihlásit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
