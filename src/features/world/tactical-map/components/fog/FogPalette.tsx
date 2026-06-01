/**
 * 10.2h — paleta nástroje mlhy (PJ). Obsah docku „🌫️ Mlha" (MapToolDock) —
 * panel je přímo uvnitř docku (jediná otvíračka = hlavička docku, žádné vnitřní
 * tlačítko). Mlhový accent `var(--map-ui-blue-solid)` (chladná stříbrno-modrá — odliší mlhu od
 * teplých/fialových efektů).
 *
 * Kreslicí režim: dokud je dock otevřený (paleta mountovaná) A mlha zapnutá,
 * je `fogTool.active = true` → left-drag kreslí mlhu (sbalení docku / vypnutí
 * mlhy → levé tlačítko zase panuje). Effect tool má v kreslení přednost
 * (handler), takže oba nástroje nekolidují.
 *
 * Čistá UI — stav drží `useFogTool`, scéna stav + akce delegovány nahoru.
 *
 * Spec: docs/arch/phase-10/spec-10.2h.md.
 */
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/shared/ui';
import type { FogToolState, FogBrushSize } from '../../hooks/useFogTool';
import styles from './FogPalette.module.css';

const FOG_ACCENT = 'var(--map-ui-blue-solid)';

const BRUSH_OPTIONS: { size: FogBrushSize; glyph: string; hexes: number }[] = [
  { size: 0, glyph: '●', hexes: 1 },
  { size: 1, glyph: '⬡', hexes: 7 },
  { size: 2, glyph: '⬢', hexes: 19 },
];

interface Props {
  tool: FogToolState;
  /** scene.fogEnabled (zdroj pravdy je scéna, ne tool). */
  fogEnabled: boolean;
  onToggleFog: (enabled: boolean) => void;
  /** Počet odhalených hexů — gate pro „Zahalit vše". */
  revealedCount: number;
  onReset: () => void;
}

export function FogPalette({
  tool,
  fogEnabled,
  onToggleFog,
  revealedCount,
  onReset,
}: Props): React.ReactElement {
  const { setActive, mode, setMode, brushSize, setBrushSize } = tool;
  const [confirmReset, setConfirmReset] = useState(false);

  // Dock otevřený (paleta mountovaná) + mlha zapnutá = kreslicí režim aktivní.
  // Cleanup při unmountu (sbalení docku) / vypnutí mlhy → left-pan zase funguje.
  useEffect(() => {
    setActive(fogEnabled);
    return () => setActive(false);
  }, [fogEnabled, setActive]);

  const brushHexes =
    BRUSH_OPTIONS.find((b) => b.size === brushSize)?.hexes ?? 1;

  return (
    <div
      className={styles.panel}
      style={{ '--accent': FOG_ACCENT } as React.CSSProperties}
    >
      {/* Master switch — scene.fogEnabled */}
      <label className={styles.switchRow}>
        <input
          type="checkbox"
          className={styles.switch}
          checked={fogEnabled}
          onChange={(e) => onToggleFog(e.target.checked)}
        />
        <span>{fogEnabled ? 'Mlha zapnutá' : 'Mlha vypnutá'}</span>
      </label>

      {/* Kreslení — disabled dokud není mlha zapnutá */}
      <div
        className={`${styles.drawSection} ${fogEnabled ? '' : styles.disabled}`}
      >
        <div className={styles.segmented}>
          {(['reveal', 'fog'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`${styles.segBtn} ${mode === m ? styles.segBtnActive : ''}`}
              onClick={() => setMode(m)}
              disabled={!fogEnabled}
            >
              {m === 'reveal' ? '👁 Odhalit' : '☁ Zahalit'}
            </button>
          ))}
        </div>

        <span className={styles.label}>Velikost štětce</span>
        <div className={styles.segmented}>
          {BRUSH_OPTIONS.map((b) => (
            <button
              key={b.size}
              type="button"
              className={`${styles.brushBtn} ${brushSize === b.size ? styles.segBtnActive : ''}`}
              onClick={() => setBrushSize(b.size)}
              disabled={!fogEnabled}
              aria-label={`${b.hexes} hexů`}
            >
              {b.glyph}
            </button>
          ))}
        </div>
        <span className={styles.hexCount}>
          {brushHexes} {brushHexes === 1 ? 'hex' : brushHexes < 5 ? 'hexy' : 'hexů'}
        </span>

        <p className={styles.hint}>
          {mode === 'reveal'
            ? 'Táhni po mapě — odhalíš mlhu.'
            : 'Táhni po mapě — zahalíš mlhou.'}
        </p>
      </div>

      <button
        type="button"
        className={styles.resetBtn}
        onClick={() => setConfirmReset(true)}
        disabled={revealedCount === 0}
      >
        🌫 Zahalit vše
      </button>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Zahalit celou mapu?"
        message="Všechny odhalené oblasti zmizí a celá mapa se znovu zahalí mlhou. Tuto akci nelze vrátit zpět (kromě nového odhalování)."
        confirmLabel="Zahalit vše"
        confirmVariant="danger"
        onConfirm={() => {
          onReset();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
