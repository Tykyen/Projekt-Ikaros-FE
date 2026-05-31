import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Layers, Plus, Sliders, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  rollFate,
  rollGenericDice,
  rollPool,
  rollMixedDice,
} from '../lib/rollEngine';
import {
  formatFateMessage,
  formatGenericDiceMessage,
} from '../lib/formatMessage';
import {
  buildFatePayload,
  buildGenericPayload,
  buildMixedPayload,
} from '../lib/dicePayload';
import type { DicePayload } from '../lib/dicePayload';
import {
  DICE_CATALOG,
  resolveDiceKeys,
} from '../lib/worldDiceCatalog';
import styles from './DicePickerPopover.module.css';

export interface DiceRollResult {
  content: string;
  dicePayload: DicePayload;
  diceSkin: string | null;
}

interface DicePickerPopoverProps {
  /** Anchor element pro pozici popoveru (composer 🎲 button). */
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  /** Whitelist kostek z `World.dice`. */
  worldDice: string[];
  worldSlug: string;
  /** PJ/PomocnyPJ — vidí CTA „Otevřít nastavení" pokud World.dice = []. */
  canManageWorld: boolean;
  /** Aktivní skin pro daný typ kostky (vrací `useDiceSkinMapping.getSkin`). */
  getSkin: (typeKey: string) => string;
  /** Otevře `SkinPickerPanel` (renderovaný výš). */
  onOpenSkinPicker: () => void;
  /** Otevře `PoolPromptModal` v Pool / Mixed režimu. */
  onOpenPoolPrompt: (kind: 'pool' | 'mixed') => void;
  /** Finální send hodu. Picker se po sendu automaticky zavře. */
  onRoll: (result: DiceRollResult) => void;
  /**
   * Horizontální zarovnání popoveru vůči anchoru. `'left'` (default, chat
   * composer) otevírá doprava; `'right'` (mapa, pravý dock) otevírá doleva, aby
   * popover neutekl mimo pravý okraj obrazovky.
   */
  align?: 'left' | 'right';
}

/**
 * Krok 6.3a — Popover s rychlou volbou kostek z `World.dice`.
 *
 * Layout:
 *   1. Grid kruhových dlaždic (Fate, k4..k20, k%)
 *   2. Linky „Pool…" / „Mixed…" pro komplexní hody
 *   3. Inputy Popis (label) + Mod (modifier)
 *   4. Link „⚙ Vzhled mých kostek" → otevře skin picker
 *
 * Prázdný stav (`World.dice = []`):
 *   - hráč: jen sdělení „PJ tomuto světu nedovolil kostky"
 *   - PJ:   CTA „Otevřít nastavení světa" (link na 5.3a editaci)
 */
export const DicePickerPopover: React.FC<DicePickerPopoverProps> = ({
  anchorRef,
  open,
  onClose,
  worldDice,
  worldSlug,
  canManageWorld,
  getSkin,
  onOpenSkinPicker,
  onOpenPoolPrompt,
  onRoll,
  align = 'left',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [modifier, setModifier] = useState('');
  // Pool/Mixed + Popis/Mod schované za „Možnosti", rozbalí se na vyžádání
  // (šetří místo — platí pro chat i mapu).
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const allowedKeys = resolveDiceKeys(worldDice);

  // Esc / klik mimo → zavřít.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const trimmedLabel = label.trim() || undefined;
  const parsedMod = parseInt(modifier, 10);
  const mod = Number.isFinite(parsedMod) ? parsedMod : undefined;

  const performRoll = (typeKey: string) => {
    const catalog = DICE_CATALOG[typeKey];
    if (!catalog) return;
    const skin = getSkin(catalog.rollType);

    let payload: DicePayload;
    let content: string;

    if (catalog.rollType === 'fate') {
      const roll = rollFate();
      payload = buildFatePayload(roll, { label: trimmedLabel, modifier: mod });
      content = formatFateMessage(trimmedLabel ?? null, mod ?? null, roll);
    } else {
      const roll = rollGenericDice(catalog.rollType);
      payload = buildGenericPayload(roll, {
        label: trimmedLabel,
        modifier: mod,
      });
      content = formatGenericDiceMessage(
        trimmedLabel ?? null,
        mod ?? null,
        roll,
      );
    }

    onRoll({ content, dicePayload: payload, diceSkin: skin });
    // Vyprázdnit label/mod po sendu (jako 6.2 RP datum).
    setLabel('');
    setModifier('');
    onClose();
  };

  return (
    <div
      className={`${styles.popover} ${align === 'right' ? styles.alignRight : ''}`}
      ref={popoverRef}
      role="dialog"
    >
      <div className={styles.header}>
        <span className={styles.headerTitle}>Hod kostkou</span>
        <button
          type="button"
          className={styles.headerGear}
          title="Vzhled mých kostek"
          aria-label="Vzhled mých kostek"
          onClick={() => {
            onOpenSkinPicker();
            onClose();
          }}
        >
          <Settings size={15} aria-hidden="true" />
        </button>
      </div>

      {allowedKeys.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyText}>
            PJ tomuto světu zatím nedovolil žádné kostky.
          </div>
          {canManageWorld && (
            <Link
              to={`/svet/${worldSlug}/nastaveni`}
              className={styles.emptyCta}
              onClick={onClose}
            >
              Otevřít nastavení světa →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {allowedKeys.map((key) => {
              const cat = DICE_CATALOG[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.chip} ${styles[`chip_${cat.glyphSize ?? 'md'}`]}`}
                  onClick={() => performRoll(key)}
                  title={`Hodit ${cat.label}`}
                >
                  <span className={styles.chipGlyph}>{cat.glyph}</span>
                  <span className={styles.chipLabel}>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.divider} />

          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            <span>Možnosti — pool, mixed, popis, mod</span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`${styles.advancedChevron} ${
                advancedOpen ? styles.advancedChevronOpen : ''
              }`}
            />
          </button>

          {advancedOpen && (
            <>
              <div className={styles.complexRow}>
                <button
                  type="button"
                  className={styles.complexLink}
                  onClick={() => {
                    onOpenPoolPrompt('pool');
                    onClose();
                  }}
                >
                  <Plus size={14} aria-hidden="true" />
                  Pool…
                </button>
                <button
                  type="button"
                  className={styles.complexLink}
                  onClick={() => {
                    onOpenPoolPrompt('mixed');
                    onClose();
                  }}
                >
                  <Layers size={14} aria-hidden="true" />
                  Mixed…
                </button>
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
                <label className={`${styles.inputRow} ${styles.inputRowMod}`}>
                  <span className={styles.inputLabel}>
                    <Sliders size={12} aria-hidden="true" /> Mod
                  </span>
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
            </>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Build payload + content pro mixed/pool roll z `PoolPromptModal`. Voláno
 * externě (z modalu), který sám obstará UI countů.
 */
export function buildPoolRoll(
  counts: Record<string, number>,
  opts: { label?: string; modifier?: number; getSkin: (key: string) => string },
): DiceRollResult {
  // Single-type pool (jen jeden typ) → rollPool, jinak mixed.
  const activeTypes = Object.entries(counts).filter(([, n]) => n > 0);
  if (activeTypes.length === 1) {
    const [type, n] = activeTypes[0];
    const sides = parseInt(type.replace('d', ''), 10);
    const roll = rollPool(sides, n);
    const payload = buildGenericPayload(roll, {
      label: opts.label,
      modifier: opts.modifier,
    });
    const content = formatGenericDiceMessage(
      opts.label ?? null,
      opts.modifier ?? null,
      roll,
    );
    return {
      content,
      dicePayload: payload,
      diceSkin: opts.getSkin(`pool-d${sides}`),
    };
  }

  // Mixed roll.
  const roll = rollMixedDice(counts);
  const payload = buildMixedPayload(roll, {
    label: opts.label,
    modifier: opts.modifier,
  });
  const content = formatGenericDiceMessage(
    opts.label ?? null,
    opts.modifier ?? null,
    roll,
  );
  return {
    content,
    dicePayload: payload,
    diceSkin: opts.getSkin('mixed'),
  };
}
