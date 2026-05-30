/**
 * 10.2g — paleta nástrojů efektů (PJ). Plovoucí svislý toolbar vpravo dole
 * nad zoom controls; rozbalovací panel vyjede doleva.
 *
 * Port Matrix `EffectsPalette.tsx` (bez fog — ten je 10.2h) + redesign dle
 * frontend-design auditu: aktivní nástroj nese svou barvu jako identitu
 * (glow + puls), čísla mono fontem, panel doleva.
 *
 * Čistá UI — stav drží `useEffectTool`, akce delegovány nahoru.
 *
 * Spec: docs/arch/phase-10/spec-10.2g.md.
 */
import type { ExplosionRing } from '../../types';
import type {
  BarrierShape,
  EffectTool,
  EffectToolState,
} from '../../hooks/useEffectTool';
import {
  PALETTE_COLORS,
  VARIANT_CONFIG,
  type ExplosionVariant,
} from './effectColors';
import styles from './EffectsPalette.module.css';

interface Props {
  tool: EffectToolState;
  /** Počet efektů ve scéně — gate pro „smazat vše" + 🗑 badge. */
  effectCount: number;
  onClearAll: () => void;
}

export function EffectsPalette({
  tool,
  effectCount,
  onClearAll,
}: Props): React.ReactElement {
  const {
    activeTool,
    setTool,
    selectedColor,
    setSelectedColor,
    barrierDC,
    setBarrierDC,
    barrierShape,
    setBarrierShape,
    barrierRadius,
    setBarrierRadius,
    explosionRings,
    setExplosionRings,
    explosionVariant,
    setExplosionVariant,
  } = tool;

  const currentVariant =
    VARIANT_CONFIG.find((v) => v.key === explosionVariant) ?? VARIANT_CONFIG[0];

  const handleToolClick = (t: Exclude<EffectTool, null>): void => {
    setTool(activeTool === t ? null : t);
  };

  const addRing = (): void => {
    if (explosionRings.length >= 6) return;
    setExplosionRings([
      ...explosionRings,
      { radius: explosionRings.length, damage: 1 },
    ]);
  };
  const removeRing = (idx: number): void => {
    setExplosionRings(
      explosionRings
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, radius: i })),
    );
  };
  const updateRingDamage = (idx: number, damage: number): void => {
    const next = [...explosionRings];
    next[idx] = { ...next[idx], damage };
    setExplosionRings(next);
  };

  // Akcentová barva aktivního nástroje (pro glow toolbar tlačítka).
  const accent =
    activeTool === 'barrier'
      ? '#ffd200'
      : activeTool === 'explosion'
        ? currentVariant.color
        : activeTool === 'color'
          ? '#b48cff'
          : activeTool === 'erase'
            ? '#ff7090'
            : undefined;

  return (
    <div className={styles.palette}>
      {/* Rozbalovací panel — vlevo od toolbaru */}
      {activeTool && (
        <div
          className={styles.panel}
          style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}
        >
          <div className={styles.panelHeader}>
            <span>
              {activeTool === 'color' && '🎨 Barevná pole'}
              {activeTool === 'barrier' && '🛡️ Bariéra'}
              {activeTool === 'explosion' &&
                `${currentVariant.icon} ${currentVariant.label}`}
              {activeTool === 'erase' && '🧽 Guma'}
            </span>
            <button
              type="button"
              className={styles.panelClose}
              onClick={() => setTool(null)}
              aria-label="Zavřít"
            >
              ✕
            </button>
          </div>

          {activeTool === 'color' && (
            <div className={styles.colorGrid}>
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.swatch} ${selectedColor === c.value ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: c.dot }}
                  onClick={() => setSelectedColor(c.value)}
                  title={c.label}
                  aria-label={c.label}
                />
              ))}
              <p className={styles.hint}>
                Klikni na hex pro přidání pole. V režimu mazání klikni na efekt
                pro smazání.
              </p>
            </div>
          )}

          {activeTool === 'barrier' && (
            <div className={styles.config}>
              <div className={styles.segmented}>
                {(['brush', 'circle'] as BarrierShape[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.segBtn} ${barrierShape === s ? styles.segBtnActive : ''}`}
                    onClick={() => setBarrierShape(s)}
                  >
                    {s === 'brush' ? '🖌️ Štětec' : '⭕ Kruh'}
                  </button>
                ))}
              </div>
              <label className={styles.field}>
                <span>Obtížnost (DC)</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={barrierDC}
                  onChange={(e) => setBarrierDC(parseInt(e.target.value) || 0)}
                  className={styles.numInput}
                />
              </label>
              {barrierShape === 'circle' && (
                <label className={styles.field}>
                  <span>Poloměr: {barrierRadius}</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={barrierRadius}
                    onChange={(e) =>
                      setBarrierRadius(parseInt(e.target.value) || 1)
                    }
                  />
                </label>
              )}
              <p className={styles.hint}>
                {barrierShape === 'brush'
                  ? 'Kresli tažením po mapě.'
                  : 'Klikni na mapu pro umístění kruhu.'}
              </p>
            </div>
          )}

          {activeTool === 'explosion' && (
            <div className={styles.config}>
              <div className={styles.variantRow}>
                {VARIANT_CONFIG.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    className={`${styles.variantBtn} ${explosionVariant === v.key ? styles.variantBtnActive : ''}`}
                    style={
                      explosionVariant === v.key
                        ? ({ '--accent': v.color } as React.CSSProperties)
                        : undefined
                    }
                    onClick={() =>
                      setExplosionVariant(v.key as ExplosionVariant)
                    }
                    title={v.label}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>
              <div className={styles.ringsList}>
                {explosionRings.map((ring: ExplosionRing, idx: number) => (
                  <div key={idx} className={styles.ringRow}>
                    <span className={styles.ringLabel}>
                      {idx === 0 ? 'Střed' : `Kruh ${idx}`}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={ring.damage}
                      onChange={(e) =>
                        updateRingDamage(idx, parseInt(e.target.value) || 0)
                      }
                      className={styles.numInput}
                    />
                    <span className={styles.ringDmg}>zranění</span>
                    <button
                      type="button"
                      className={styles.ringRemove}
                      onClick={() => removeRing(idx)}
                      aria-label="Odebrat kruh"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {explosionRings.length < 6 && (
                <button
                  type="button"
                  className={styles.addRing}
                  onClick={addRing}
                >
                  + Přidat kruh
                </button>
              )}
              <p className={styles.hint}>
                {explosionRings.length === 0
                  ? 'Přidej alespoň jeden kruh.'
                  : 'Klikni na hex pro umístění.'}
              </p>
            </div>
          )}

          {activeTool === 'erase' && (
            <p className={styles.hint}>
              Klikni nebo táhni přes mapu pro smazání efektů. Barevné pole
              zmizí po jednom hexu; bariéra a výbuch se smažou celé.
            </p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolBtn} ${activeTool === 'color' ? styles.toolBtnActive : ''}`}
          style={
            activeTool === 'color'
              ? ({ '--accent': '#b48cff' } as React.CSSProperties)
              : undefined
          }
          onClick={() => handleToolClick('color')}
          title="Barevná pole"
        >
          🎨
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${activeTool === 'barrier' ? styles.toolBtnActive : ''}`}
          style={
            activeTool === 'barrier'
              ? ({ '--accent': '#ffd200' } as React.CSSProperties)
              : undefined
          }
          onClick={() => handleToolClick('barrier')}
          title="Štítová bariéra"
        >
          🛡️
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${activeTool === 'explosion' ? styles.toolBtnActive : ''}`}
          style={
            activeTool === 'explosion'
              ? ({ '--accent': currentVariant.color } as React.CSSProperties)
              : undefined
          }
          onClick={() => handleToolClick('explosion')}
          title="Výbuch / oblast (oheň / plyn / kouř)"
        >
          💥
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${activeTool === 'erase' ? styles.toolBtnActive : ''}`}
          style={
            activeTool === 'erase'
              ? ({ '--accent': '#ff7090' } as React.CSSProperties)
              : undefined
          }
          onClick={() => handleToolClick('erase')}
          title="Guma — klikni nebo táhni přes efekt pro smazání"
        >
          🧽
        </button>
        {effectCount > 0 && (
          <button
            type="button"
            className={`${styles.toolBtn} ${styles.clearBtn}`}
            onClick={onClearAll}
            title="Smazat všechny efekty"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
