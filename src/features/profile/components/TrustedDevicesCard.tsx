import { Button } from '@/shared/ui';
import { useMyProfile } from '@/features/auth/api/useAuth';
import {
  useTrustedDevices,
  useRevokeTrustedDevice,
} from '@/features/profile/api/useProfile';
import sectionStyles from './ProfileSections.module.css';
import styles from './TwoFactor.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * 14.1 — karta „Důvěryhodná zařízení". Zobrazí se jen když má uživatel 2FA
 * (jinak nedává smysl). Umožní odvolat jedno nebo všechna zařízení.
 */
export function TrustedDevicesCard() {
  const { data: profile } = useMyProfile();
  const enabled = profile?.totpEnabled ?? false;
  const { data: devices } = useTrustedDevices(enabled);
  const revoke = useRevokeTrustedDevice();

  if (!enabled) return null;

  const hasDevices = devices && devices.length > 0;

  return (
    <section className={sectionStyles.card}>
      <header className={sectionStyles.headerRow}>
        <h2 className={sectionStyles.sectionTitle}>Důvěryhodná zařízení</h2>
        {hasDevices && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => revoke.mutate(null)}
            disabled={revoke.isPending}
          >
            Odvolat všechna
          </Button>
        )}
      </header>

      {!hasDevices ? (
        <p className={styles.empty}>
          Žádná důvěryhodná zařízení. Při přihlášení můžeš zařízení označit jako
          důvěryhodné — pak na něm 2FA na 30 dní přeskočí.
        </p>
      ) : (
        <div className={styles.deviceList}>
          {devices.map((d) => (
            <div key={d.id} className={styles.deviceRow}>
              <div>
                <div className={styles.deviceLabel}>
                  {d.label}
                  {d.current && (
                    <span className={styles.currentBadge}> · toto zařízení</span>
                  )}
                </div>
                <div className={styles.deviceMeta}>
                  Naposledy {formatDate(d.lastUsedAt)}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => revoke.mutate(d.id)}
                disabled={revoke.isPending}
              >
                Odvolat
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
