import { EyeOff } from 'lucide-react';
import { useUpdateProfile } from '@/features/profile/api/useProfile';
import { reconnectSocket } from '@/features/chat/api/socket';
import styles from './ProfileSections.module.css';

interface Props {
  hiddenPresence: boolean;
}

/**
 * 1.5 D-052 — Soukromí (privacy „neviditelný" mód).
 * Toggle skryje online stav uživatele před ostatními (registry stále drží spojení,
 * pouze nebroadcasting + vyloučení ze snapshotu pro ostatní).
 * Po toggle: reconnect socketu, ať BE přečte aktuální flag z DB.
 */
export function PrivacySection({ hiddenPresence }: Props) {
  const update = useUpdateProfile();

  async function toggle() {
    const next = !hiddenPresence;
    await update.mutateAsync({ hiddenPresence: next });
    reconnectSocket();
  }

  return (
    <section className={styles.card}>
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Soukromí</h2>
      </header>

      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={hiddenPresence}
          onChange={toggle}
          disabled={update.isPending}
          aria-label="Neviditelný mód"
        />
        <span className={styles.toggleLabel}>
          <span className={styles.toggleLabelTitle}>
            <EyeOff size={16} aria-hidden="true" /> Neviditelný mód
          </span>
          <span className={styles.toggleLabelDesc}>
            Skryje tvůj online stav před ostatními uživateli. Ty vidíš ostatní
            beze změny, ale tvá zelená tečka u jména pro ostatní zmizí. Vlastní
            online tečku ve své hlavičce uvidíš až po zrušení tohoto módu.
          </span>
        </span>
      </label>
    </section>
  );
}
