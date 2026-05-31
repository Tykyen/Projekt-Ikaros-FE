import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Skull, Heart } from 'lucide-react';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DEFAULT_SKIN_ID,
  getSkinsByCategory,
} from '../lib/diceSkins';
import type { FateDiceSkin } from '../lib/diceSkins';
import { useDiceSkinMapping } from '../api/useDiceSkinMapping';
import styles from './SkinPickerPanel.module.css';

interface SkinPickerPanelProps {
  open: boolean;
  onClose: () => void;
  worldId: string;
}

/** Typ kostky pro top chips. `default` = fallback pro všechny typy. */
const DICE_TYPES = [
  { key: 'default', label: 'Výchozí', preview: 'd20' as const },
  { key: 'fate', label: 'Fate', preview: 'fate' as const },
  { key: 'd4', label: 'k4', preview: 'd4' as const },
  { key: 'd6', label: 'k6', preview: 'd6' as const },
  { key: 'd8', label: 'k8', preview: 'd8' as const },
  { key: 'd10', label: 'k10', preview: 'd10' as const },
  { key: 'd12', label: 'k12', preview: 'd12' as const },
  { key: 'd20', label: 'k20', preview: 'd20' as const },
  { key: 'd100', label: 'k%', preview: 'd100' as const },
];

type PreviewType = 'fate' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

/**
 * Krok 6.3 perf fix — vrátí URL **jediné reprezentativní tváře** skinu pro
 * daný typ kostky (typicky nejvyšší / „hrdinská" hodnota). Náhled v skin
 * kartě je 2D snapshot, ne plný 3D model (drasticky méně HTTP requestů
 * při otevření modalu).
 */
function pickRepresentativeImg(
  skin: FateDiceSkin,
  type: PreviewType,
): string | undefined {
  switch (type) {
    case 'fate':
      return skin.facePlusImg;
    case 'd4':
      return skin.d4_4Img;
    case 'd6':
      return skin.d6_6Img;
    case 'd8':
      return skin.d8_8Img;
    case 'd10':
      return skin.d10_0Img; // 0 = 10
    case 'd12':
      return skin.d12_12Img;
    case 'd20':
      return skin.d20_20Img;
    case 'd100':
      return skin.d100_00Img;
  }
}

/**
 * 2D preview tváře — jediný `<img loading="lazy">`. Pokud skin nemá pro
 * daný typ texturu, fallback na CSS gradient + glyf z bgGradient.
 */
function SkinPreviewFace({
  skin,
  type,
}: {
  skin: FateDiceSkin;
  type: PreviewType;
}) {
  const imgUrl = pickRepresentativeImg(skin, type);

  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={skin.name}
        loading="lazy"
        decoding="async"
        className={styles.previewImg}
        style={{
          borderRadius: skin.borderRadius || '14%',
          borderColor: skin.borderColor,
        }}
      />
    );
  }

  // Skin pro daný typ nemá texturu — CSS fallback s gradientem.
  return (
    <div
      className={styles.previewFallback}
      style={{
        background: skin.bgGradient,
        color: skin.symbolColor || '#fff',
        textShadow: skin.symbolShadow,
        borderColor: skin.borderColor,
        borderRadius: skin.borderRadius || '14%',
      }}
    >
      {skin.ornamentChar || '?'}
    </div>
  );
}

/**
 * Krok 6.3e — Modal pro výběr skinu kostek.
 *
 * Top: chips „Typ kostky" (Výchozí + Fate + k4..k%). Aktivní chip určuje
 *   pro který typ uživatel nastavuje skin (ukládá do `WorldMembership.
 *   diceSkinMapping`).
 * Sidebar (desktop): kategorie skinů (Základní / Živelné / Dračí /
 *   Nemrtví / Přírodní).
 * Main: grid karet (140×180) s 3D cube náhledem dle aktivního typu.
 *   Aktivní skin = ✓ medallion + accent border.
 *
 * Mobile (≤ 768): sidebar zaniká, kategorie jako horizontální chips
 * nad gridem. Skin karty se zužují.
 */
export function SkinPickerPanel({
  open,
  onClose,
  worldId,
}: SkinPickerPanelProps) {
  const { getSkin, setSkin, jailed, toggleJail, isJailed } =
    useDiceSkinMapping(worldId);
  const [activeType, setActiveType] = useState<string>('default');
  const [activeCategory, setActiveCategory] = useState<string>('core');
  // Krok 6.3 D-NEW-dice-jail — záložka „Vězení" je separátní view skinů,
  // které uživatel uvěznil. Není mezi kategoriemi, žije jako vlastní pseudo-cat.
  const [showingJail, setShowingJail] = useState(false);

  const grouped = useMemo(() => getSkinsByCategory(), []);
  const allSkins = useMemo(
    () => Object.values(grouped).flat(),
    [grouped],
  );
  const skinsInCategory = useMemo(() => {
    if (showingJail) {
      return allSkins.filter((s) => jailed.includes(s.id));
    }
    // Hlavní grid skrývá uvězněné skiny — najdou se jen v záložce „Vězení".
    return (grouped[activeCategory] ?? []).filter(
      (s) => !jailed.includes(s.id),
    );
  }, [showingJail, allSkins, grouped, activeCategory, jailed]);

  const previewType =
    DICE_TYPES.find((t) => t.key === activeType)?.preview ?? 'd20';

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 6.3 perf — odstraněno: `preloadSkin` v useEffect tahalo všech ~70 textur
  // per skin × 8 skinů = 560 paralelních requestů. Místo toho karta používá
  // `<img loading="lazy">` na jednu reprezentativní tvář, browser sám
  // odhadne kdy stáhnout. Z 560 → max 8 requestů na otevření modalu.

  if (!open) return null;

  const activeSkinId = getSkin(activeType) || DEFAULT_SKIN_ID;

  // Portál do body — `position: fixed` backdrop se jinak vztahuje k předkovi s
  // `transform` (mapa pan/zoom container), takže modal skončil nalepený nahoře
  // pod lištou místo vystředění přes celý viewport.
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
            {CATEGORY_ORDER.map((cat) => {
              // Spočítat nezavřené skiny v kategorii (do counts).
              const skinsInCat = grouped[cat] ?? [];
              const free = skinsInCat.filter(
                (s) => !jailed.includes(s.id),
              ).length;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catBtn} ${
                    !showingJail && activeCategory === cat
                      ? styles.catBtnActive
                      : ''
                  }`}
                  onClick={() => {
                    setShowingJail(false);
                    setActiveCategory(cat);
                  }}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className={styles.catCount}>({free})</span>
                </button>
              );
            })}
            {/* D-NEW-dice-jail — tab Vězení, zobrazený vždy (i prázdný). */}
            <button
              type="button"
              className={`${styles.catBtn} ${styles.jailBtn} ${
                showingJail ? styles.catBtnActive : ''
              }`}
              onClick={() => setShowingJail(true)}
              title="Skiny, které jste poslal do vězení za smolné hody"
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
                  Klikni na ☠ u libovolné karty pro uvěznění skinu, který
                  ti vyhodil smolný hod.
                </p>
              </div>
            )}
            {skinsInCategory.map((skin) => {
              const isActive = skin.id === activeSkinId;
              const jailedSkin = isJailed(skin.id);
              return (
                <div
                  key={skin.id}
                  className={`${styles.card} ${isActive ? styles.cardActive : ''} ${jailedSkin ? styles.cardJailed : ''}`}
                  title={skin.name}
                >
                  <button
                    type="button"
                    className={styles.cardMainBtn}
                    onClick={() => {
                      if (jailedSkin) return; // ve Vězení nelze vybírat
                      setSkin(activeType, skin.id);
                    }}
                    disabled={jailedSkin && !showingJail}
                  >
                    <div className={styles.preview}>
                      <SkinPreviewFace skin={skin} type={previewType} />
                    </div>
                    <div className={styles.cardFoot}>
                      <span className={styles.cardName}>{skin.name}</span>
                      {skin.ornamentChar && (
                        <span className={styles.cardOrnament}>
                          {skin.ornamentChar}
                        </span>
                      )}
                    </div>
                  </button>
                  {isActive && !jailedSkin && (
                    <span className={styles.medallion} aria-hidden="true">
                      <Check size={12} />
                    </span>
                  )}
                  {/* Krok 6.3 D-NEW-dice-jail — toggle uvězněn/omilostněn. */}
                  <button
                    type="button"
                    className={`${styles.jailToggle} ${jailedSkin ? styles.jailToggleFree : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleJail(skin.id);
                    }}
                    title={jailedSkin ? 'Omilostnit' : 'Uvěznit'}
                    aria-label={
                      jailedSkin
                        ? `Omilostnit skin ${skin.name}`
                        : `Uvěznit skin ${skin.name}`
                    }
                  >
                    {jailedSkin ? (
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
