import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input } from '@/shared/ui';
import { useTotpSetup, useEnableTotp } from '@/features/profile/api/useProfile';
import { parseApiError } from '@/shared/api/client';
import { BackupCodesPanel } from './BackupCodesPanel';
import styles from './TwoFactor.module.css';

interface Props {
  /** Aktivace dokončena (2FA zapnuto, backup kódy potvrzeny). */
  onDone: () => void;
  onCancel: () => void;
}

/**
 * 14.1 — průvodce zapnutím 2FA: 1) QR + secret, 2) ověření kódem, 3) záložní
 * kódy (zobrazí se JEN jednou, nutné potvrdit uložení).
 */
export function TotpSetupWizard({ onDone, onCancel }: Props) {
  const setup = useTotpSetup();
  const enable = useEnableTotp();
  const [qr, setQr] = useState<{ qrDataUrl: string; secret: string } | null>(
    null,
  );
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Spustí setup hned po otevření průvodce (vygeneruje secret + QR).
  useEffect(() => {
    setup.mutate(undefined, {
      onSuccess: (data) => setQr(data),
      onError: () =>
        setError('Nepodařilo se spustit nastavení 2FA. Zkus to prosím znovu.'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await enable.mutateAsync(code.trim());
      setBackupCodes(res.backupCodes);
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  // Fáze 3 — záložní kódy (po úspěšné aktivaci)
  if (backupCodes) {
    return (
      <BackupCodesPanel codes={backupCodes} requireAck onDone={onDone} />
    );
  }

  // Fáze 1+2 — QR + kód
  return (
    <form onSubmit={submitCode}>
      <p className={styles.intro}>
        Naskenuj QR kód v authenticator aplikaci (Google Authenticator, Authy…)
        a opiš vygenerovaný 6místný kód.
      </p>

      {qr ? (
        <div className={styles.qrBox}>
          <img
            className={styles.qrImg}
            src={qr.qrDataUrl}
            alt="QR kód pro spárování authenticatoru"
          />
          <p className={styles.secretHint}>
            Nejde naskenovat? Zadej ručně klíč:
            <br />
            <span className={styles.secret}>{qr.secret}</span>
          </p>
        </div>
      ) : (
        <p className={styles.intro}>Generuji QR kód…</p>
      )}

      <Input
        label="Ověřovací kód"
        autoComplete="one-time-code"
        inputMode="numeric"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={code}
        onChange={(e) => setCode(e.target.value)}
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
          onClick={onCancel}
          disabled={enable.isPending}
        >
          Zrušit
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={enable.isPending}
          disabled={!qr || !code.trim()}
        >
          Aktivovat
        </Button>
      </div>
    </form>
  );
}
