import { useEffect, useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Modal, Button, Input } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { parseApiErrorCode, parseApiError } from '@/shared/api/client';
import {
  useRequestSelfDeletion,
  type DeletionPreview,
} from '../api/useDeleteAccount';
import styles from './DeleteAccountModal.module.css';

/**
 * 1.3c — modal pro self-delete s typing-username confirm + checkbox.
 *
 * Workflow:
 * 1. Otevřu modal → dryRun=true → BE vrátí preview (PJ handover plán)
 * 2. Pokud blocking.length > 0 → switch na PJBlockView (seznam blokujících světů)
 * 3. Jinak: zobrazím promotion list (informativní) + form pro typing username + checkbox
 * 4. Submit s typing=username + ack=true → dryRun=false → BE provede + auto-logout
 *
 * Auto-logout se děje v useRequestSelfDeletion onSuccess — modal jen zavře.
 */
interface Props {
  onClose: () => void;
}

export function DeleteAccountModal({ onClose }: Props) {
  const me = useAtomValue(currentUserAtom);
  const { mutate, isPending } = useRequestSelfDeletion();

  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [blocking, setBlocking] = useState<DeletionPreview['blocking'] | null>(
    null,
  );
  const [typedUsername, setTypedUsername] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const ackId = useId();

  // Pre-load preview (dryRun) při otevření. `previewLoading` startuje true (initial state),
  // takže nepotřebujeme jej znovu set v effectu (lint pravidlo cascading renders).
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    mutate(
      { confirmUsername: me.username, dryRun: true },
      {
        onSuccess: (data) => {
          if (cancelled) return;
          setPreview(data.preview);
          setPreviewLoading(false);
        },
        onError: (err) => {
          if (cancelled) return;
          setPreviewLoading(false);
          const code = parseApiErrorCode(err);
          if (code === 'SOLE_PJ_BLOCK') {
            const payload = (err as { response?: { data?: { error?: { worlds?: DeletionPreview['blocking'] } } } }).response?.data?.error;
            setBlocking(payload?.worlds ?? []);
          } else {
            toast.error(parseApiError(err));
            onClose();
          }
        },
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!me) {
    onClose();
    return null;
  }

  // PJ blokace — switch view
  if (blocking) {
    return (
      <Modal open onClose={onClose} title="Nelze smazat účet">
        <div className={styles.pjBlockView}>
          <p className={styles.intro}>
            Jsi jediný PJ ve světech, které nemají Pomocného PJ. Předej PJ jinému
            uživateli nebo přidej Pomocného PJ a zkus to znovu.
          </p>
          <ul className={styles.worldList}>
            {blocking.map((w) => (
              <li key={w.worldId}>
                <strong>{w.worldName}</strong>
                <span className={styles.worldSlug}>/{w.worldSlug}</span>
              </li>
            ))}
          </ul>
          <div className={styles.footerActions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Zavřít
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const usernameMatch =
    typedUsername.toLowerCase().trim() === me.username.toLowerCase();
  const canSubmit = usernameMatch && acknowledged && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    mutate({ confirmUsername: typedUsername, dryRun: false }, { onSuccess: onClose });
  };

  return (
    <Modal open onClose={onClose} title="Smazat účet" size="md">
      <div className={styles.body}>
        <ul className={styles.warningList}>
          <li>Účet bude okamžitě odhlášen ze všech zařízení.</li>
          <li>
            Můžeš se vrátit jediným loginem do <strong>30 dnů</strong>.
          </li>
          <li>Po 30 dnech proběhne nevratná anonymizace.</li>
          <li>
            Komunitní příspěvky (chat, články, galerie, diskuze) zůstanou s
            anonymním autorem.
          </li>
        </ul>

        {previewLoading && (
          <p className={styles.placeholder}>Načítám PJ handover plán…</p>
        )}

        {preview && preview.promotions.length > 0 && (
          <div className={styles.promotionsBlock}>
            <p className={styles.intro}>
              Tito Pomocní PJ budou automaticky povýšeni na PJ:
            </p>
            <ul className={styles.worldList}>
              {preview.promotions.map((p) => (
                <li key={p.worldId}>
                  <strong>{p.promotedUsername}</strong> →{' '}
                  <span>{p.worldName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.confirmField}>
          <label htmlFor="confirmUsername" className={styles.label}>
            Pro potvrzení napiš svůj username: <code>{me.username}</code>
          </label>
          <Input
            id="confirmUsername"
            value={typedUsername}
            onChange={(e) => setTypedUsername(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.checkboxRow}>
          <input
            id={ackId}
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <label htmlFor={ackId} className={styles.ackLabel}>
            Rozumím, smazání spustí 30denní hold.
          </label>
        </div>

        <div className={styles.footerActions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Zrušit
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isPending ? 'Plánuji…' : 'Naplánovat smazání'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
