import { Calendar } from 'lucide-react';
import s from './RpDateBadge.module.css';

/**
 * Krok 6.2d — drobný badge u zprávy: „📅 21. dubna 1453" / „21. 4. 1453".
 *
 * Vstupní `rpDate` je vždy ISO `YYYY-MM-DD` (BE validuje regexem). Pokud
 * `Intl` selže (extrémní rok), fallback na holý ISO string.
 *
 * Zobrazujeme **nad jménem** odesílatele — datum je in-game kontext odehrání,
 * ne součást textu. Lokalizace `cs-CZ`.
 */

const FORMATTER = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatRpDate(iso: string): string {
  try {
    // `new Date('YYYY-MM-DD')` interpretuje jako UTC midnight → správně.
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return FORMATTER.format(d);
  } catch {
    return iso;
  }
}

interface Props {
  rpDate: string;
}

export function RpDateBadge({ rpDate }: Props) {
  return (
    <span className={s.badge} title={`Datum ve hře: ${rpDate}`}>
      <Calendar size={11} className={s.icon} />
      <span>{formatRpDate(rpDate)}</span>
    </span>
  );
}
