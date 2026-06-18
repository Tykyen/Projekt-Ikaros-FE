import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import styles from './TwoFactor.module.css';

interface Props {
  codes: string[];
  /** true = vyžaduj potvrzení „uložil jsem si je" před zavřením (první zapnutí). */
  requireAck?: boolean;
  doneLabel?: string;
  onDone: () => void;
}

/**
 * 14.1 — zobrazení jednorázových záložních kódů (po enable i po regeneraci).
 * Kódy se ukazují JEN jednou; copy/stažení + volitelné potvrzení uložení.
 */
export function BackupCodesPanel({
  codes,
  requireAck = false,
  doneLabel = 'Hotovo',
  onDone,
}: Props) {
  const [ack, setAck] = useState(false);

  function copy() {
    void navigator.clipboard
      ?.writeText(codes.join('\n'))
      .then(() => toast.success('Záložní kódy zkopírovány.'));
  }

  function download() {
    const blob = new Blob([codes.join('\n') + '\n'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ikaros-zalozni-kody.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <p className={styles.intro}>
        Ulož si těchto {codes.length} záložních kódů na bezpečné místo. Každý
        funguje <strong>jednou</strong> a poslouží, když nebudeš mít po ruce
        telefon. Zobrazují se naposledy.
      </p>
      <div className={styles.codesGrid}>
        {codes.map((c) => (
          <span key={c} className={styles.codeItem}>
            {c}
          </span>
        ))}
      </div>
      <div className={styles.codesActions}>
        <Button type="button" variant="secondary" onClick={copy}>
          Zkopírovat
        </Button>
        <Button type="button" variant="secondary" onClick={download}>
          Stáhnout .txt
        </Button>
      </div>
      {requireAck && (
        <label className={styles.ackRow}>
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          <span>Uložil/a jsem si záložní kódy.</span>
        </label>
      )}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="primary"
          disabled={requireAck && !ack}
          onClick={onDone}
        >
          {doneLabel}
        </Button>
      </div>
    </div>
  );
}
