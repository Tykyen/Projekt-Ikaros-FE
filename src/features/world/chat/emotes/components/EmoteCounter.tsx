import clsx from 'clsx';
import s from './EmoteCounter.module.css';

interface EmoteCounterProps {
  count: number;
  max: number;
}

/** Krok 6.4 — progress bar 8/100 (per-svět) nebo 12/200 (globální). */
export function EmoteCounter({ count, max }: EmoteCounterProps) {
  const filled = Math.min(count, max);
  const ratio = max === 0 ? 0 : filled / max;
  const warning = ratio >= 0.9;

  // Vykreslujeme 20 segmentů (vždy stejný počet, jen ratio se vyplní).
  const SEGMENTS = 20;
  const filledSegments = Math.round(ratio * SEGMENTS);

  return (
    <div className={s.counter}>
      <div className={s.barWrap} aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={clsx(
              s.segment,
              i < filledSegments && s.segmentFilled,
              i < filledSegments && warning && s.segmentWarning,
            )}
          />
        ))}
      </div>
      <span
        className={clsx(s.label, warning && s.labelWarning)}
        aria-live="polite"
      >
        {count} / {max} emotů
      </span>
      {warning && (
        <span className={s.hint}>Blížíš se limitu — zvaž úklid.</span>
      )}
    </div>
  );
}
