/**
 * 13.3 — Tlačítko „Aktivovat zvuk" (autoplay gate).
 *
 * Sdílené mapou i chatem. Zobrazí se, když PJ vysílá zvuk, ale prohlížeč
 * uživatele ho ještě nesmí přehrát (chybí gesto). Klik = gesto → od té chvíle
 * hraje automaticky. Po aktivaci se tlačítko skryje (vrací null).
 */
import { useSoundActivation } from './soundActivation';
import styles from './SoundActivateButton.module.css';

interface Props {
  /** Volitelný text místo defaultního. */
  label?: string;
  className?: string;
}

export function SoundActivateButton({
  label = 'Aktivovat zvuk',
  className,
}: Props): React.ReactElement | null {
  const { activated, activate } = useSoundActivation();
  if (activated) return null;

  return (
    <button
      type="button"
      className={`${styles.btn} ${className ?? ''}`}
      onClick={activate}
      title="Prohlížeč vyžaduje kliknutí, než smí přehrát zvuk"
    >
      <span className={styles.icon} aria-hidden>
        🔊
      </span>
      {label}
    </button>
  );
}
