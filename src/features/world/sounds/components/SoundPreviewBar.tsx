/**
 * 13.3 — „Právě hraje" náhledový bar (sticky nad seznamem).
 *
 * Lokální náhled v databázi (nepřenáší se nikam). Ekvalizér animace = vizuální
 * indikace přehrávání. Skrytý když nic nehraje.
 */
import type { Sound } from '../types';
import { MEDIA_TYPE_LABELS } from '../lib/soundEnums';
import { useSoundVolume } from '../player/soundActivation';
import styles from './SoundPreviewBar.module.css';

interface Props {
  sound: Sound | null;
  onStop: () => void;
}

export function SoundPreviewBar({
  sound,
  onStop,
}: Props): React.ReactElement | null {
  const { volume, setVolume } = useSoundVolume();
  if (!sound) return null;

  return (
    <div className={styles.bar}>
      <span className={styles.equalizer} aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </span>
      <div className={styles.info}>
        <span className={styles.label}>Právě hraje (náhled)</span>
        <span className={styles.name}>
          {sound.name}{' '}
          <span className={styles.type}>· {MEDIA_TYPE_LABELS[sound.mediaType]}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className={styles.volume}
        title="Hlasitost"
        aria-label="Hlasitost náhledu"
      />
      <button type="button" className={styles.stop} onClick={onStop}>
        ⏹ Stop
      </button>
    </div>
  );
}
