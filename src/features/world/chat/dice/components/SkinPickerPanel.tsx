import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Skull, Heart } from 'lucide-react';
import {
  GROUP_ORDER,
  GROUP_LABELS,
  DEFAULT_MATERIAL_ID,
  getMaterialsByGroup,
  materialPreviewUrl,
} from '../lib/dice3dMaterials';
import { useDiceSkinMapping } from '../api/useDiceSkinMapping';
import styles from './SkinPickerPanel.module.css';

interface SkinPickerPanelProps {
  open: boolean;
  onClose: () => void;
  worldId: string;
  /** Otevřít rovnou na záložce „Vězení". */
  initialJail?: boolean;
}

/** Typ kostky pro top chips. `default` = fallback pro všechny typy. */
const DICE_TYPES = [
  { key: 'default', label: 'Výchozí' },
  { key: 'fate', label: 'Fate' },
  { key: 'd4', label: 'k4' },
  { key: 'd6', label: 'k6' },
  { key: 'd8', label: 'k8' },
  { key: 'd10', label: 'k10' },
  { key: 'd12', label: 'k12' },
  { key: 'd20', label: 'k20' },
  { key: 'd100', label: 'k%' },
];

/**
 * Krok 6.3-fix4 — Výběr materiálu 3D kostek.
 *
 * Top: chips „Typ kostky" (Výchozí + Fate + k4..k%) — pro který typ se
 *   materiál nastavuje (ukládá do `WorldMembership.diceSkinMapping`).
 * Sidebar: skupiny materiálů (Běžné / Kámen / Kov / Dračí / Element / Mystické).
 * Main: grid karet s náhledem povrchu materiálu (webp swatch). Aktivní = ✓.
 *
 * Číslo na kostce kreslí 3D engine — materiál nese jen povrch, proto je
 * náhled stejný pro všechny typy kostek.
 */
export function SkinPickerPanel({
  open,
  onClose,
  worldId,
  initialJail = false,
}: SkinPickerPanelProps) {
  const { getSkin, setSkin, jailed, toggleJail, isJailed } =
    useDiceSkinMapping(worldId);
  const [activeType, setActiveType] = useState<string>('default');
  const [activeGroup, setActiveGroup] = useState<string>(GROUP_ORDER[0]);
  const [showingJail, setShowingJail] = useState(false);

  const grouped = useMemo(() => getMaterialsByGroup(), []);
  const allMaterials = useMemo(() => Object.values(grouped).flat(), [grouped]);
  const materialsInGroup = useMemo(() => {
    if (showingJail) return allMaterials.filter((m) => jailed.includes(m.id));
    return (grouped[activeGroup] ?? []).filter((m) => !jailed.includes(m.id));
  }, [showingJail, allMaterials, grouped, activeGroup, jailed]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setShowingJail(initialJail);
  }

  if (!open) return null;

  const activeMaterialId = getSkin(activeType) || DEFAULT_MATERIAL_ID;

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-label="Vzhled kostek"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Vzhled kostek</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.typeBar}>
          {DICE_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.typeChip} ${activeType === t.key ? styles.typeChipActive : ''}`}
              onClick={() => setActiveType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            {GROUP_ORDER.map((slug) => {
              const free = (grouped[slug] ?? []).filter(
                (m) => !jailed.includes(m.id),
              ).length;
              return (
                <button
                  key={slug}
                  type="button"
                  className={`${styles.catBtn} ${
                    !showingJail && activeGroup === slug
                      ? styles.catBtnActive
                      : ''
                  }`}
                  onClick={() => {
                    setShowingJail(false);
                    setActiveGroup(slug);
                  }}
                >
                  <span>{GROUP_LABELS[slug] ?? slug}</span>
                  <span className={styles.catCount}>({free})</span>
                </button>
              );
            })}
            <button
              type="button"
              className={`${styles.catBtn} ${styles.jailBtn} ${
                showingJail ? styles.catBtnActive : ''
              }`}
              onClick={() => setShowingJail(true)}
              title="Materiály, které jste poslal do vězení za smolné hody"
            >
              <span>
                <Skull size={12} aria-hidden="true" /> Vězení
              </span>
              <span className={styles.catCount}>({jailed.length})</span>
            </button>
          </aside>

          <main className={styles.grid}>
            {showingJail && jailed.length === 0 && (
              <div className={styles.jailEmpty}>
                <Skull size={32} aria-hidden="true" />
                <p>Vězení je prázdné.</p>
                <p className={styles.jailEmptyHint}>
                  Klikni na ☠ u libovolné karty pro uvěznění materiálu, který
                  ti vyhodil smolný hod.
                </p>
              </div>
            )}
            {materialsInGroup.map((mat) => {
              const isActive = mat.id === activeMaterialId;
              const jailedMat = isJailed(mat.id);
              return (
                <div
                  key={mat.id}
                  className={`${styles.card} ${isActive ? styles.cardActive : ''} ${jailedMat ? styles.cardJailed : ''}`}
                  title={mat.name}
                >
                  <button
                    type="button"
                    className={styles.cardMainBtn}
                    onClick={() => {
                      if (jailedMat) return;
                      setSkin(activeType, mat.id);
                    }}
                    disabled={jailedMat && !showingJail}
                  >
                    <div className={styles.preview}>
                      <img
                        src={materialPreviewUrl(mat.id)}
                        alt={mat.name}
                        loading="lazy"
                        decoding="async"
                        className={styles.previewImg}
                        style={{ borderRadius: '14%' }}
                      />
                    </div>
                    <div className={styles.cardFoot}>
                      <span className={styles.cardName}>{mat.name}</span>
                    </div>
                  </button>
                  {isActive && !jailedMat && (
                    <span className={styles.medallion} aria-hidden="true">
                      <Check size={12} />
                    </span>
                  )}
                  <button
                    type="button"
                    className={`${styles.jailToggle} ${jailedMat ? styles.jailToggleFree : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleJail(mat.id);
                    }}
                    title={jailedMat ? 'Omilostnit' : 'Uvěznit'}
                    aria-label={
                      jailedMat
                        ? `Omilostnit materiál ${mat.name}`
                        : `Uvěznit materiál ${mat.name}`
                    }
                  >
                    {jailedMat ? (
                      <Heart size={12} aria-hidden="true" />
                    ) : (
                      <Skull size={12} aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })}
          </main>
        </div>
      </div>
    </div>,
    document.body,
  );
}
