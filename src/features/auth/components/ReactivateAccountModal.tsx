import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/shared/ui';
import { useReactivateDeletion } from '@/features/profile/api/useDeleteAccount';
import { consumeLoginIntent } from '@/shared/lib/loginIntent';
import type { LoginOkResponse } from '@/shared/types';
import styles from './ReactivateAccountModal.module.css';

type Promotions = NonNullable<LoginOkResponse['revertablePromotions']>;

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
  // D-034b — info o povýšených Pomocných PJ; po reaktivaci se zobrazí dialog před redirectem
  const [pendingPromotions, setPendingPromotions] = useState<Promotions | null>(
    null,
  );

  const handleReactivate = () => {
    reactivate.mutate(credentials, {
      onSuccess: (response) => {
        if (
          response.revertablePromotions &&
          response.revertablePromotions.length > 0
        ) {
          setPendingPromotions(response.revertablePromotions);
          return;
        }
        const intent = consumeLoginIntent();
        navigate(intent ?? '/');
      },
    });
  };

  const dismissPromotions = () => {
    setPendingPromotions(null);
    const intent = consumeLoginIntent();
    navigate(intent ?? '/');
  };

  // Info modal po reaktivaci s promotions
  if (pendingPromotions) {
    return (
      <Modal
        open
        onClose={dismissPromotions}
        title="Tvůj svět má teď 2 PJ"
        size="md"
      >
        <div className={styles.body}>
          <p className={styles.intro}>
            Při plánování smazání byli tito Pomocní PJ automaticky povýšeni na
            PJ. Nyní máš ve svých světech 2 PJ — uprav role v nastavení světa,
            pokud chceš svou PJ roli odebrat.
          </p>
          <ul className={styles.dates} style={{ listStyle: 'disc inside' }}>
            {pendingPromotions.map((p) => (
              <li key={p.worldId}>
                <strong>{p.worldName}</strong> — povýšen{' '}
                <code>{p.promotedUsername}</code>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Button type="button" variant="primary" onClick={dismissPromotions}>
              Rozumím
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

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
