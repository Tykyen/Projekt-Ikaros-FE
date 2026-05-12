import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { DeleteAccountModal } from './DeleteAccountModal';
import styles from './ProfileSections.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * 1.3c — Sekce Účet (plnohodnotně).
 * - Pokud je accountu naplánováno smazání → banner se scheduledHardDeleteAt + návod
 * - Jinak → tlačítko otevírající DeleteAccountModal (typing username + checkbox + PJ handover preview)
 *
 * Reaktivace probíhá přes login flow (LoginModal → ReactivateAccountModal), ne tady.
 */
export function AccountSection() {
  const me = useAtomValue(currentUserAtom);
  const [modalOpen, setModalOpen] = useState(false);

  if (me?.deletionRequestedAt) {
    return (
      <section className={styles.card} aria-label="Účet" role="status" aria-live="polite">
        <header className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Účet</h2>
        </header>
        <div className={styles.body}>
          <p className={styles.text}>
            <strong>Účet je naplánovaný na smazání.</strong>
            {'\n'}
            Naplánováno: {formatDate(me.deletionRequestedAt)}
            {me.scheduledHardDeleteAt && (
              <>
                {'\n'}Hard delete: {formatDate(me.scheduledHardDeleteAt)}
              </>
            )}
          </p>
          <p className={styles.placeholderHint}>
            Pro obnovení se odhlas a přihlas znovu — login během 30denního hold
            spustí reaktivaci.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card} aria-label="Účet">
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Účet</h2>
      </header>
      <div className={styles.body}>
        <p className={styles.text}>
          Smazání účtu spustí 30denní hold; po něm dojde k trvalému anonymizování
          v komunitních příspěvcích (chat, články, galerie, diskuze zůstanou).
        </p>
        <Button
          type="button"
          variant="danger"
          onClick={() => setModalOpen(true)}
        >
          Smazat účet
        </Button>
      </div>
      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}
