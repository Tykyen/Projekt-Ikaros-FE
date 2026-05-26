import s from './EventChipCompact.module.css';

interface Props {
  title: string;
  color: string;
  position: 'start' | 'middle' | 'end' | 'single';
  isWeekRestart: boolean;
  onClick: () => void;
}

/**
 * 9.4 — Compact density variant. 4px barevný proužek bez textu.
 * Multi-day spojitost přebírá z chipSpan* paterny (margin overlap přes cell gap).
 * Tooltip on hover via native `title` attribute (browser default).
 */
export function EventChipCompact({
  title,
  color,
  position,
  isWeekRestart,
  onClick,
}: Props) {
  const isOriginStart = position === 'start' || position === 'single';
  const classes = [
    s.chip,
    position === 'start' && s.spanStart,
    position === 'middle' && s.spanMiddle,
    position === 'end' && s.spanEnd,
    position === 'single' && s.single,
    isWeekRestart && !isOriginStart && s.weekRestart,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      style={{ ['--chip-color' as string]: color }}
      onClick={onClick}
      title={isOriginStart ? title : `${title} — pokračování`}
      aria-label={isOriginStart ? title : `${title} — pokračování`}
    />
  );
}
