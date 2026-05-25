import { formatYearLabel } from '../lib/formatFantasyDate';
import s from './YearMarker.module.css';

interface Props {
  year: number;
}

/**
 * 9.3 — sticky bublina roku mezi skupinami eventů ze stejného roku.
 * `data-year` atribut slouží jako scroll target pro YearScrubber (Fáze 7).
 */
export function YearMarker({ year }: Props) {
  return (
    <div className={s.marker} data-year={year} aria-label={formatYearLabel(year)}>
      <span className={s.label}>{formatYearLabel(year)}</span>
    </div>
  );
}
