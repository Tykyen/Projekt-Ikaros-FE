/**
 * 17.9 — ovládání stream režimu (OBS). Sedí uvnitř docku „🖥️ Zobrazení".
 *
 * Volba pozadí (chroma zelená / modrá / průhledné) + přepínače „nechat viditelné"
 * jsou persistované přes `useStreamMode`. Vlastní spuštění (zapnout + fullscreen)
 * deleguje na rodiče přes `onStart` — fullscreen potřebuje `viewportRef`, který
 * drží TacticalMapView.
 *
 * Spec: docs/arch/phase-17/spec-17.9.md §3.4.
 */
import { useStreamMode, type StreamBg } from '../stream/streamMode';
import styles from './StreamModeControls.module.css';

const BG_OPTIONS: { key: StreamBg; label: string; title: string }[] = [
  { key: 'green', label: 'Zelená', title: 'Chroma zelená (OBS Window Capture)' },
  { key: 'blue', label: 'Modrá', title: 'Chroma modrá (OBS Window Capture)' },
  {
    key: 'transparent',
    label: 'Průhledné',
    title: 'Průhledné — funguje jen v OBS Browser Source',
  },
];

interface Props {
  /** Spustit stream režim (zapnout + vstoupit do fullscreenu). */
  onStart: () => void;
}

export function StreamModeControls({ onStart }: Props): React.ReactElement {
  const { bg, setBg, keep, setKeep } = useStreamMode();

  return (
    <div className={styles.wrap}>
      <div className={styles.bgRow} role="group" aria-label="Pozadí streamu">
        {BG_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            data-bg={opt.key}
            className={`${styles.bgBtn} ${bg === opt.key ? styles.bgBtnActive : ''}`}
            onClick={() => setBg(opt.key)}
            aria-pressed={bg === opt.key}
            title={opt.title}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={keep.initiative}
          onChange={(e) => setKeep({ ...keep, initiative: e.target.checked })}
        />
        Nechat iniciativu
      </label>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={keep.diceLog}
          onChange={(e) => setKeep({ ...keep, diceLog: e.target.checked })}
        />
        Nechat deník hodů
      </label>

      <button type="button" className={styles.startBtn} onClick={onStart}>
        🎥 Spustit stream režim
      </button>
      <p className={styles.hint}>Ukončíš klávesou Esc nebo tlačítkem v rohu.</p>
    </div>
  );
}
