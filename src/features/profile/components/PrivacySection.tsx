import { EyeOff, Users, UserX } from 'lucide-react';
import { useUpdateProfile } from '@/features/profile/api/useProfile';
import { reconnectSocket } from '@/features/chat/api/socket';
import styles from './ProfileSections.module.css';

interface Props {
  hiddenPresence: boolean;
  hiddenInDirectory: boolean;
  /** 3.5 D-057 — `friends` = jen přátelé vidí profil a mohou psát. */
  profileVisibility: 'public' | 'friends';
}

/**
 * Soukromí — tři nezávislé přepínače:
 *  - 1.5 D-052: „neviditelný mód" (skrýt online stav).
 *  - D-045: „skrýt v adresáři" (nebudu v `/ikaros/uzivatele` seznamu pro běžné uživatele).
 *  - 3.5 D-057: friend-only viditelnost profilu a pošty.
 */
export function PrivacySection({
  hiddenPresence,
  hiddenInDirectory,
  profileVisibility,
}: Props) {
  const update = useUpdateProfile();

  async function togglePresence() {
    await update.mutateAsync({ hiddenPresence: !hiddenPresence });
    reconnectSocket();
  }

  async function toggleDirectory() {
    await update.mutateAsync({ hiddenInDirectory: !hiddenInDirectory });
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
          checked={hiddenInDirectory}
          onChange={toggleDirectory}
          disabled={update.isPending}
          aria-label="Skrýt v adresáři uživatelů"
        />
        <span className={styles.toggleLabel}>
          <span className={styles.toggleLabelTitle}>
            <UserX size={16} aria-hidden="true" /> Skrýt v adresáři uživatelů
          </span>
          <span className={styles.toggleLabelDesc}>
            Nezobrazíš se v seznamu uživatelů na `/ikaros/uzivatele`. Administrátoři
            tě vidí dál (audit). Sám sobě zůstaneš normálně dostupný.
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
