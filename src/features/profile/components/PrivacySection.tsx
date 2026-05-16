import { EyeOff, Users } from 'lucide-react';
import { useUpdateProfile } from '@/features/profile/api/useProfile';
import { reconnectSocket } from '@/features/chat/api/socket';
import styles from './ProfileSections.module.css';

interface Props {
  hiddenPresence: boolean;
  /** 3.5 D-057 — `friends` = jen přátelé vidí profil a mohou psát. */
  profileVisibility: 'public' | 'friends';
}

/**
 * Soukromí — dva nezávislé přepínače:
 *  - 1.5 D-052: „neviditelný mód" (skrýt online stav).
 *  - 3.5 D-057: friend-only viditelnost profilu a pošty.
 */
export function PrivacySection({ hiddenPresence, profileVisibility }: Props) {
  const update = useUpdateProfile();

  async function togglePresence() {
    await update.mutateAsync({ hiddenPresence: !hiddenPresence });
    reconnectSocket();
  }

  async function toggleVisibility() {
    await update.mutateAsync({
      profileVisibility: profileVisibility === 'friends' ? 'public' : 'friends',
    });
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
          onChange={togglePresence}
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

      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={profileVisibility === 'friends'}
          onChange={toggleVisibility}
          disabled={update.isPending}
          aria-label="Jen pro přátele"
        />
        <span className={styles.toggleLabel}>
          <span className={styles.toggleLabelTitle}>
            <Users size={16} aria-hidden="true" /> Jen pro přátele
          </span>
          <span className={styles.toggleLabelDesc}>
            Tvůj veřejný profil uvidí a soukromou zprávu ti napíše jen tvůj
            přítel. Administrátoři a lidé, kterým jsi psal/a jako první, mají
            přístup vždy.
          </span>
        </span>
      </label>
    </section>
  );
}
