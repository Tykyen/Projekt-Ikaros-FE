import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button, Input } from '@/shared/ui';
import { useMyProfile } from '@/features/auth/api/useAuth';
import {
  useDisableTotp,
  useRegenerateBackupCodes,
} from '@/features/profile/api/useProfile';
import { parseApiError } from '@/shared/api/client';
import { TotpSetupWizard } from './TotpSetupWizard';
import { BackupCodesPanel } from './BackupCodesPanel';
import sectionStyles from './ProfileSections.module.css';
import styles from './TwoFactor.module.css';

type Mode = 'idle' | 'setup' | 'disable' | 'regenerate';

/**
 * 14.1 — karta „Dvoufaktorové ověření" v profilu. Řídí zapnutí (wizard),
 * vypnutí a regeneraci záložních kódů (oboje re-auth heslem).
 */
export function TotpCard() {
  const { data: profile, isError: profileError, refetch: refetchProfile } =
    useMyProfile();
  const enabled = profile?.totpEnabled ?? false;
  // Když `/users/me` selže bez cache (`profile === undefined`), `enabled` spadne
  // na false → bez guardu níže by karta tvrdila „Vypnuto" a nabídla „Zapnout
  // 2FA" i uživateli, který 2FA MÁ → nový setup přepíše TOTP secret a zneplatní
  // jeho authenticator. Na neznámém stavu proto nelžeme ani nepouštíme setup.
  // (Na background-refetch chybě s cache `profile` zůstává → karta jede dál —
  // proto `&& profile === undefined`, ne holé `isError`; jinak by blip skryl
  // funkční kartu.)
  const statusUnknown = profileError && profile === undefined;

  const [mode, setMode] = useState<Mode>('idle');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [regenerated, setRegenerated] = useState<string[] | null>(null);

  const disable = useDisableTotp();
  const regenerate = useRegenerateBackupCodes();
  const busy = disable.isPending || regenerate.isPending;

  function reset() {
    setMode('idle');
    setPassword('');
    setError(null);
  }

  async function onDisable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await disable.mutateAsync(password);
      reset();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  async function onRegenerate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await regenerate.mutateAsync(password);
      setRegenerated(res.backupCodes);
      reset();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  function renderBody() {
    if (statusUnknown) {
      return (
        <div className={styles.intro} role="alert">
          <p>
            Stav dvoufaktorového ověření teď neumíme zjistit. Radši s ním
            nehýbeme — kdyby bylo zapnuté, nový setup by přepsal tvůj
            authenticator.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void refetchProfile()}
          >
            Zkusit znovu
          </Button>
        </div>
      );
    }
    if (regenerated) {
      return (
        <BackupCodesPanel
          codes={regenerated}
          doneLabel="Zavřít"
          onDone={() => setRegenerated(null)}
        />
      );
    }
    if (mode === 'setup') {
      return (
        <TotpSetupWizard
          onDone={() => {
            reset();
            toast.success('Dvoufaktorové ověření je aktivní.');
          }}
          onCancel={reset}
        />
      );
    }
    if (!enabled) {
      return (
        <>
          <p className={styles.intro}>
            Přidej k heslu druhý zámek — jednorázový kód z aplikace v mobilu. I
            když ti někdo uhodne heslo, bez telefonu se dovnitř nedostane.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => setMode('setup')}
          >
            Zapnout 2FA
          </Button>
        </>
      );
    }
    // enabled
    return (
      <>
        <p className={styles.intro}>
          Aktivní. Při přihlášení budeš zadávat jednorázový kód z aplikace.
        </p>
        {mode === 'idle' && (
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMode('regenerate')}
            >
              Nové záložní kódy
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => setMode('disable')}
            >
              Vypnout 2FA
            </Button>
          </div>
        )}
        {(mode === 'disable' || mode === 'regenerate') && (
          <form
            className={styles.pwForm}
            onSubmit={mode === 'disable' ? onDisable : onRegenerate}
          >
            <Input
              label="Potvrď heslem"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className={styles.banner} role="alert" aria-live="polite">
                {error}
              </div>
            )}
            <div className={styles.actions}>
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={busy}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                variant={mode === 'disable' ? 'danger' : 'primary'}
                loading={busy}
                disabled={!password}
              >
                {mode === 'disable' ? 'Vypnout 2FA' : 'Vygenerovat'}
              </Button>
            </div>
          </form>
        )}
      </>
    );
  }

  return (
    <section className={sectionStyles.card}>
      <header className={sectionStyles.headerRow}>
        <h2 className={sectionStyles.sectionTitle}>Dvoufaktorové ověření</h2>
        <span
          className={`${styles.statusBadge} ${enabled && !statusUnknown ? styles.statusOn : styles.statusOff}`}
        >
          {statusUnknown ? 'Nezjištěno' : enabled ? '🔒 Aktivní' : 'Vypnuto'}
        </span>
      </header>
      {renderBody()}
    </section>
  );
}
