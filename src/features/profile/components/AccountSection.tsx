import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { useDataExport } from '../api/useDataExport';
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
 * 20C §C1 — tlačítko „Stáhnout moje data (JSON)" (GDPR čl. 15). Sekundární,
 * dostupné vždy (i v pending-delete stavu — rámec „mazání = nejdřív nabídnout export").
 */
function DataExportButton() {
  const { mutate, isPending } = useDataExport();
  return (
    <Button
      type="button"
      variant="secondary"
      loading={isPending}
      onClick={() => mutate()}
    >
      Stáhnout moje data (JSON)
    </Button>
  );
}

/**
 * 20C §C3 — nenápadná informativní hláška pro nezletilého (< 15). Zapíná se jen
 * když `currentUser.isMinor`. Vysvětluje omezený režim (neveřejný profil).
 */
function MinorNotice() {
  return (
    <p className={styles.placeholderHint} role="note">
      Účet v režimu ochrany nezletilých — neveřejný profil, skrytý v adresáři.
    </p>
  );
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
          {me.isMinor && <MinorNotice />}
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
          <DataExportButton />
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
        {me?.isMinor && <MinorNotice />}
        <p className={styles.text}>
          Smazání účtu spustí 30denní hold; po něm dojde k trvalému anonymizování
          v komunitních příspěvcích (chat, články, galerie, diskuze zůstanou).
        </p>
        <p className={styles.placeholderHint}>
          Před smazáním si můžeš stáhnout svá data.
        </p>
        <div className={styles.accountActions}>
          <DataExportButton />
          <Button
            type="button"
            variant="danger"
            onClick={() => setModalOpen(true)}
          >
            Smazat účet
          </Button>
        </div>
      </div>
      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}
