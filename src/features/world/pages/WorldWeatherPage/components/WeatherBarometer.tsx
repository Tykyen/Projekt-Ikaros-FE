/**
 * 9.4-I M3.2 — SVG kruhový barometr (signature element karty).
 *
 * Outer ring + filled arc dle tlaku (982 hPa = 0%, 1040 hPa = 100%). Center
 * pak ukazuje hodnotu + jednotku s trend arrow (z `pressure.trend`).
 *
 * Skin-agnostic — všechny barvy přes `var(--accent)` a `var(--border-soft)`.
 */
import s from './WeatherBarometer.module.css';

interface Props {
  /** Tlak v hPa. */
  value: number;
  /** Trend ze `WeatherResult.pressure.trend` (může být cokoli BE pošle). */
  trend: string;
}

const PRESSURE_MIN = 982;
const PRESSURE_MAX = 1040;
const CIRCUMFERENCE = 264; // 2π × r=42 ≈ 263.9 — pro stroke-dasharray

/** Mapování BE trend stringu na šipku. BE může poslat různé hodnoty, fallback = horizontální. */
function trendArrow(trend: string): string {
  const t = trend.toLowerCase();
  if (t.includes('stoup') || t === 'up' || t === 'rising' || t === '↑') return '↑';
  if (t.includes('kles') || t === 'down' || t === 'falling' || t === '↓') return '↓';
  if (t.includes('siln') || t.includes('rapid') || t === '↓↓' || t === '↑↑') {
    return t.includes('kles') || t.includes('falling') ? '↓↓' : '↑↑';
  }
  return '→';
}

export function WeatherBarometer({ value, trend }: Props) {
  // 0..1 normalizace tlaku do kruhového fillu.
  const norm = Math.max(
    0,
    Math.min(1, (value - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN)),
  );
  const dashOffset = CIRCUMFERENCE * (1 - norm);
  const arrow = trendArrow(trend);

  return (
    <div
      className={s.barometer}
      role="img"
      aria-label={`Tlak ${value} hPa, trend ${trend || 'stabilní'}`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="42"
          strokeWidth="6"
          fill="none"
          className={s.bg}
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          strokeWidth="6"
          fill="none"
          className={s.fill}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={s.center}>
        <div className={s.value}>{Math.round(value)}</div>
        <div className={s.unit}>
          HPA <span aria-hidden="true">{arrow}</span>
        </div>
      </div>
    </div>
  );
}
