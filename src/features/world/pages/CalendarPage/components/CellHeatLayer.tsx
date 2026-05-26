import s from './CellHeatLayer.module.css';

interface Props {
  eventCount: number;
}

/**
 * 9.4 — Heat density overlay pro cell. Gradient opacity podle eventCount:
 *   0      → žádný overlay
 *   1–5    → 12%
 *   6–20   → 24%
 *   21–50  → 40%
 *   51+    → 60%
 * Klik je obsluhován cellem (CalendarPage), tato vrstva je čistě dekorativní.
 */
export function CellHeatLayer({ eventCount }: Props) {
  if (eventCount === 0) return null;
  const opacity =
    eventCount > 50 ? 0.6 :
    eventCount > 20 ? 0.4 :
    eventCount > 5  ? 0.24 :
                      0.12;
  return (
    <div
      className={s.layer}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

