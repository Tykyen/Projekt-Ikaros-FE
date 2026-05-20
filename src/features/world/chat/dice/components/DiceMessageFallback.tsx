import type { DicePayload } from '../lib/dicePayload';
import styles from './DiceMessageFallback.module.css';

/**
 * Krok 6.3d — Statický 2D fallback pro `DiceMessage`.
 *
 * Vykreslí se v případech:
 * - prohlížeč nepodporuje CSS 3D transforms (vzácné, dnes všude funguje),
 * - dev mode s vypnutými animacemi pro debugging,
 * - error boundary catch v `RollingDie`.
 *
 * Drží minimální čitelnost: tváře jako 2D dlaždice s číslem / glyfem.
 */
interface FallbackProps {
  payload: DicePayload;
}

export const DiceMessageFallback: React.FC<FallbackProps> = ({ payload }) => {
  const items: { label: string; glow?: 'positive' | 'negative' | 'zero' }[] =
    [];

  if (payload.type === 'fate') {
    for (const f of payload.faces) {
      items.push({
        label: f === '+' ? '+' : f === '-' ? '−' : '·',
        glow: f === '+' ? 'positive' : f === '-' ? 'negative' : 'zero',
      });
    }
  } else if (payload.type === 'd100') {
    items.push({ label: String(payload.tens === 0 ? '00' : payload.tens) });
    items.push({ label: String(payload.ones) });
  } else if (payload.type === 'mixed') {
    payload.faces.forEach((f, i) => {
      const t = payload.faceTypes[i];
      if (t === 'fate') {
        items.push({
          label: f === 1 ? '+' : f === -1 ? '−' : '·',
          glow: f === 1 ? 'positive' : f === -1 ? 'negative' : 'zero',
        });
      } else {
        items.push({ label: String(f) });
      }
    });
  } else {
    payload.faces.forEach((f) => items.push({ label: String(f) }));
  }

  return (
    <div className={styles.fallback}>
      {items.map((it, i) => (
        <div
          key={i}
          className={`${styles.tile} ${it.glow ? styles[`glow_${it.glow}`] : ''}`}
        >
          {it.label}
        </div>
      ))}
    </div>
  );
};

export default DiceMessageFallback;
