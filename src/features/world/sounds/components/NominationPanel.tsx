/**
 * 13.3 — Admin panel nominací (approve/reject zvuků čekajících na schválení).
 *
 * Viditelné jen Admin+. Plné admin-hub zapojení → fáze 12; zde minimální gate.
 */
import { useState } from 'react';
import { Button } from '@/shared/ui';
import { usePendingSounds } from '../hooks/useSounds';
import { useSoundMutations } from '../hooks/useSoundMutations';
import { MEDIA_TYPE_LABELS } from '../lib/soundEnums';
import styles from './NominationPanel.module.css';

interface Props {
  worldId: string | null;
}

export function NominationPanel({ worldId }: Props): React.ReactElement {
  const pending = usePendingSounds();
  const { approve, reject } = useSoundMutations(worldId);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (pending.isLoading) {
    return <p className={styles.empty}>Načítání nominací…</p>;
  }
  if (!pending.data || pending.data.length === 0) {
    return <p className={styles.empty}>Žádné zvuky nečekají na schválení.</p>;
  }

  return (
    <div className={styles.list}>
      {pending.data.map((s) => (
        <div key={s.id} className={styles.row}>
          <div className={styles.info}>
            <span className={styles.name}>{s.name}</span>
            <span className={styles.meta}>{MEDIA_TYPE_LABELS[s.mediaType]}</span>
          </div>
          {rejectingId === s.id ? (
            <div className={styles.rejectForm}>
              <input
                className={styles.reasonInput}
                placeholder="Důvod zamítnutí…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={!reason.trim() || reject.isPending}
                onClick={async () => {
                  await reject.mutateAsync({ id: s.id, reason: reason.trim() });
                  setRejectingId(null);
                  setReason('');
                }}
              >
                Potvrdit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRejectingId(null);
                  setReason('');
                }}
              >
                Zpět
              </Button>
            </div>
          ) : (
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="sm"
                disabled={approve.isPending}
                onClick={() => approve.mutate(s.id)}
              >
                Schválit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingId(s.id)}
              >
                Zamítnout
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
