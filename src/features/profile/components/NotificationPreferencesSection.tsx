import { Bell, Smartphone } from 'lucide-react';
import type { User } from '@/shared/types';
import { usePush } from '@/features/notifications/api/usePush';
import { useUpdateNotificationPreferences } from '@/features/profile/api/useNotificationPreferences';
import {
  NOTIFICATION_GROUPS,
  resolvePref,
  type NotificationCategory,
} from '@/features/notifications/lib/notificationPreferences';
import styles from './ProfileSections.module.css';

interface Props {
  user: User;
}

/**
 * 15.9 — Notifikace: master vypínač push + kategorie v 5 skupinách
 * (Můj svět / Můj obsah / Novinky / Komunita / Správa platformy)
 * + per-device brána. Kategorie a defaulty: `NOTIFICATION_GROUPS`.
 *
 * Dvě vrstvy: (1) zařízení musí mít upozornění povolená (`usePush`),
 * (2) preference vybírají, na CO chodí push. Vypnutí kategorie ztlumí jen
 * push bublinu — notifikační centrum (zvoneček) zůstává kompletní.
 */
export function NotificationPreferencesSection({ user }: Props) {
  const prefs = user.notificationPreferences;
  const update = useUpdateNotificationPreferences();
  const push = usePush();

  const pushEnabled = resolvePref(prefs, 'pushEnabled');

  const toggle = (
    key: NotificationCategory | 'pushEnabled',
    current: boolean,
  ) => update.mutate({ [key]: !current });

  return (
    <section className={styles.card}>
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Notifikace</h2>
      </header>

      {/* Per-device brána (hardware): bez povolení na zařízení push nedorazí. */}
      {push.supported && (
        <>
          <div className={styles.notifDeviceRow}>
            <span className={styles.toggleLabelTitle}>
              <Smartphone size={16} aria-hidden="true" /> Upozornění na tomto
              zařízení
            </span>
            {push.denied ? (
              <span className={styles.notifHint}>Zakázáno v prohlížeči</span>
            ) : (
              <button
                type="button"
                className={styles.notifDeviceBtn}
                onClick={() =>
                  void (push.isSubscribed ? push.disable() : push.enable())
                }
                disabled={push.busy}
                aria-pressed={push.isSubscribed}
              >
                {push.busy ? '…' : push.isSubscribed ? 'Vypnout' : 'Zapnout'}
              </button>
            )}
          </div>
          <p className={styles.notifHint}>
            Nejdřív povol upozornění na zařízení; níže si pak vybereš, na co
            chceš být upozorněn/a. Na jiném zařízení (telefon, počítač) se
            povoluje zvlášť.
          </p>
          <hr className={styles.notifDivider} />
        </>
      )}

      {/* Master vypínač */}
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={pushEnabled}
          onChange={() => toggle('pushEnabled', pushEnabled)}
          disabled={update.isPending}
          aria-label="Push notifikace"
        />
        <span className={styles.toggleLabel}>
          <span className={styles.toggleLabelTitle}>
            <Bell size={16} aria-hidden="true" /> Push notifikace
          </span>
          <span className={styles.toggleLabelDesc}>
            Hlavní vypínač. Když ho vypneš, nepřijde žádné push upozornění bez
            ohledu na volby níže. Notifikační centrum (zvoneček) zůstává.
          </span>
        </span>
      </label>

      {/* Kategorie po skupinách — disabled, když je master vypnutý. */}
      <div className={pushEnabled ? undefined : styles.notifDisabledGroup}>
        {NOTIFICATION_GROUPS.map((group) => (
          <div key={group.title} className={styles.notifGroup}>
            <h3 className={styles.notifGroupTitle}>{group.title}</h3>
            {group.items.map((item) => {
              const checked = resolvePref(prefs, item.key);
              return (
                <label key={item.key} className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.key, checked)}
                    disabled={update.isPending || !pushEnabled}
                    aria-label={item.title}
                  />
                  <span className={styles.toggleLabel}>
                    <span className={styles.toggleLabelTitle}>
                      {item.title}
                    </span>
                    <span className={styles.toggleLabelDesc}>{item.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
