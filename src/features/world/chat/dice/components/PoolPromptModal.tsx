import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus } from 'lucide-react';
import { DICE_CATALOG, resolveDiceKeys } from '../lib/worldDiceCatalog';
import { buildPoolRoll, type DiceRollResult } from './DicePickerPopover';
import styles from './PoolPromptModal.module.css';

interface PoolPromptModalProps {
  open: boolean;
  onClose: () => void;
  /** `'pool'` = single typ kostky × count, `'mixed'` = různé typy zároveň. */
  kind: 'pool' | 'mixed';
  worldDice: string[];
  getSkin: (typeKey: string) => string;
  onRoll: (result: DiceRollResult) => void;
}

const STEPPER_MAX = 20;

/**
 * Krok 6.3c — Modal pro výběr počtu kostek.
 *
 * `pool` režim = vyžaduje aktivní pouze JEDEN typ kostky (UI ostatní disabluje
 * po prvním výběru). `mixed` režim = libovolný počet typů zároveň.
 *
 * Steppery +/− long-press = continuous increment (250 ms repeat).
 */
export const PoolPromptModal: React.FC<PoolPromptModalProps> = ({
  open,
  onClose,
  kind,
  worldDice,
  getSkin,
  onRoll,
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [label, setLabel] = useState('');
  const [modifier, setModifier] = useState('');

  const allowedKeys = resolveDiceKeys(worldDice);
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeTypeCount = Object.values(counts).filter((n) => n > 0).length;

  // R19 adjustment-during-render: reset při zavření (open je primitivní).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setCounts({});
      setLabel('');
      setModifier('');
    }
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const adjust = (key: string, delta: number) => {
    setCounts((prev) => {
      const current = prev[key] ?? 0;
      const next = Math.max(0, Math.min(STEPPER_MAX, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const isDisabled = (key: string): boolean => {
    if (kind !== 'pool') return false;
    // Pool: po prvním aktivním typu zbytek disabled.
    if (activeTypeCount === 0) return false;
    return (counts[key] ?? 0) === 0;
  };

  const performRoll = () => {
    if (totalCount === 0) return;
    const trimmedLabel = label.trim() || undefined;
    const parsedMod = parseInt(modifier, 10);
    const mod = Number.isFinite(parsedMod) ? parsedMod : undefined;

    // Pro single-pool s jedním typem konvertujeme `counts['d6']: 3` na rollPool(6, 3).
    // Pro mixed se vše prochází přes rollMixedDice.
    // Klíče `worldDiceCatalog` jsou 'd6', mixed engine očekává 'd6' → konverze 1:1.
    const counts2: Record<string, number> = {};
    for (const [k, n] of Object.entries(counts)) {
      if (n > 0) counts2[k] = n;
    }

    const result = buildPoolRoll(counts2, {
      label: trimmedLabel,
      modifier: mod,
      getSkin,
    });
    onRoll(result);
    onClose();
  };

  // Portál do body — stejný důvod jako u SkinPickerPanel: `fixed` backdrop se
  // jinak vztahuje k předkovi s `transform` (mapa) a modal skončí mimo střed.
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-label={kind === 'pool' ? 'Pool roll' : 'Mixed roll'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>
            {kind === 'pool' ? 'Pool — více kostek jednoho typu' : 'Mixed — různé kostky zároveň'}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.grid}>
          {allowedKeys.map((key) => {
            const cat = DICE_CATALOG[key];
            const count = counts[key] ?? 0;
            const disabled = isDisabled(key);
            const active = count > 0;
            return (
              <div
                key={key}
                className={`${styles.card} ${active ? styles.cardActive : ''} ${disabled ? styles.cardDisabled : ''}`}
              >
                <div className={styles.cardGlyph}>{cat.glyph}</div>
                <div className={styles.cardLabel}>{cat.label}</div>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => adjust(key, -1)}
                    disabled={disabled || count === 0}
                    aria-label={`Méně ${cat.label}`}
                  >
                    <Minus size={12} aria-hidden="true" />
                  </button>
                  <span className={styles.count}>{count}</span>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => adjust(key, 1)}
                    disabled={disabled || count >= STEPPER_MAX}
                    aria-label={`Více ${cat.label}`}
                  >
                    <Plus size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.inputs}>
          <label className={styles.inputRow}>
            <span className={styles.inputLabel}>Popis</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={64}
              placeholder="Magie / Vnímání…"
              className={styles.input}
            />
          </label>
          <label className={styles.inputRow}>
            <span className={styles.inputLabel}>Modifier</span>
            <input
              type="text"
              value={modifier}
              onChange={(e) => {
                const v = e.target.value;
                if (/^[+-]?\d*$/.test(v)) setModifier(v);
              }}
              placeholder="+0"
              className={`${styles.input} ${styles.modInput}`}
            />
          </label>
        </div>

        <footer className={styles.footer}>
          <div className={styles.totalCounter}>
            Celkem <strong>{totalCount}</strong>{' '}
            {totalCount === 1 ? 'kostka' : totalCount < 5 ? 'kostky' : 'kostek'}
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Zrušit
            </button>
            <button
              type="button"
              className={styles.rollBtn}
              onClick={performRoll}
              disabled={totalCount === 0}
            >
              Hodit ▸
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
