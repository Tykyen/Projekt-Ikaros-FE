/**
 * 10.2c-edit-7 — confirm dialog pro vyčištění scény od tokenů.
 *
 * Quick variant: clear-all bez selektivních checkboxů. Pokud běží combat,
 * implicit ukončí (BE handler nastaví `combat: null` v jedné atomické op).
 *
 * Selektivní mód (po sub-typech) můžeme přidat později — `scene.tokens.clear`
 * BE op je dnes "vyčistit vše". Pro selective by se přidal filter parametr
 * + UI checkboxy.
 *
 * Spec: 10.2c-edit-7.
 */
import { useState } from 'react';
import type { MapScene } from '../../types';
import styles from './ClearSceneDialog.module.css';

interface Props {
  scene: MapScene;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ClearSceneDialog({
  scene,
  onClose,
  onConfirm,
}: Props): React.ReactElement {
  const [pending, setPending] = useState(false);

  const pcCount = scene.tokens.filter((t) => !t.isNpc).length;
  const npcCount = scene.tokens.filter((t) => t.isNpc && !t.templateId).length;
  const bestieCount = scene.tokens.filter((t) => t.isNpc && !!t.templateId)
    .length;
  const total = pcCount + npcCount + bestieCount;
  const combatActive = !!scene.combat?.isActive;

  const handleConfirm = async (): Promise<void> => {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Chybu už toastuje volající (`onConfirm`) — dialog necháme otevřený
      // pro retry, jen ukončíme "Čistím…" stav.
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-scene-title"
      >
        <h3 id="clear-scene-title" className={styles.title}>
          🧹 Vyčistit scénu „{scene.name || 'Nepojmenovaná'}"?
        </h3>

        {total === 0 ? (
          <p className={styles.empty}>Scéna nemá žádné tokeny.</p>
        ) : (
          <ul className={styles.counts}>
            <li>
              <span className={styles.label}>PC postavy</span>
              <span className={styles.count}>{pcCount}</span>
            </li>
            <li>
              <span className={styles.label}>NPC postavy</span>
              <span className={styles.count}>{npcCount}</span>
            </li>
            <li>
              <span className={styles.label}>Bestie</span>
              <span className={styles.count}>{bestieCount}</span>
            </li>
          </ul>
        )}

        {combatActive && (
          <p className={styles.warn}>
            ⚠ Probíhající boj se ukončí.
          </p>
        )}

        <p className={styles.note}>
          Aktivní set (předvybrané postavy v paletě) zůstane zachovaný.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={pending}
          >
            Zrušit
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={pending || total === 0}
          >
            {pending ? 'Čistím…' : 'Vyčistit'}
          </button>
        </div>
      </div>
    </div>
  );
}
