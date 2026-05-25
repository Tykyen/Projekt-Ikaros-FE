/**
 * 9.1-I — countdown badge formát pro `GameEventCard` (Matrix vzor + precize).
 *
 * Precizní odpočet — uživatel vidí, jak daleko akce je:
 * - běží právě teď (start ≤ now < start + 4 h) → `"PROBÍHÁ"`
 * - < 1 minuta → `"ZAČÍNÁ"`
 * - < 60 minut → `"za N min"`
 * - < 24 hodin (stejný kalendářní den nebo zítra do startu) → `"za N h"`
 * - +1 den ráno (mezi 24-48 h, zítra) → `"ZÍTRA"`
 * - +2 až +6 dní → `"za N dní"`
 * - +7+ dní → `"za N dní"`
 * - minulost → `"proběhlo před N..."`
 *
 * „PROBÍHÁ" okno 4 hodin = typická délka herní seance; po 4 h se přeřadí
 * na „proběhlo před…". Konzervativní heuristika bez `event.duration`.
 */
const RUNNING_WINDOW_MS = 4 * 60 * 60 * 1000;

export function relativeCountdown(
  isoDate: string,
  now: Date = new Date(),
): string {
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return '';

  const diffMs = target.getTime() - now.getTime();

  // Probíhá — start už byl, ale ne dávno (typická herní seance)
  if (diffMs <= 0 && diffMs > -RUNNING_WINDOW_MS) {
    return 'PROBÍHÁ';
  }

  // Budoucnost — precizní
  if (diffMs > 0) {
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'ZAČÍNÁ';
    if (diffMin < 60) return `za ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `za ${diffHr} ${pluralHr(diffHr)}`;

    // Ve dnech — používej kalendářní rozdíl, ne Math.floor (jinak zítra
    // ráno = „za 0 dní" pokud teď je pozdě večer)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const targetStart = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
    );
    const diffDays = Math.round(
      (targetStart.getTime() - todayStart.getTime()) / 86_400_000,
    );
    if (diffDays === 1) return 'ZÍTRA';
    return `za ${diffDays} ${pluralDay(diffDays)}`;
  }

  // Minulost (mimo running window)
  const absMin = Math.floor(-diffMs / 60_000);
  if (absMin < 60) return `proběhlo před ${absMin} min`;
  const absHr = Math.floor(absMin / 60);
  if (absHr < 24) return `proběhlo před ${absHr} ${pluralHr(absHr)}`;
  const absDays = Math.floor(absHr / 24);
  return `proběhlo před ${absDays} ${pluralDay(absDays)}`;
}

function pluralHr(n: number): string {
  if (n === 1) return 'hodinou';
  if (n >= 2 && n <= 4) return 'hodinami';
  return 'hodinami';
}

function pluralDay(n: number): string {
  if (n === 1) return 'dnem';
  if (n >= 2 && n <= 4) return 'dny';
  return 'dny';
}

/**
 * 9.1-I — variantní klasifikace události pro vizuální styling karty:
 * - `running` — PROBÍHÁ (start ≤ now < start + 4 h)
 * - `urgent` — < 24 h do startu (red glow)
 * - `soon` — DNES / ZÍTRA / +2-6 dní
 * - `future` — +7+ dní
 * - `past` — proběhlo (start + 4 h < now)
 */
export type CountdownVariant =
  | 'running'
  | 'urgent'
  | 'soon'
  | 'future'
  | 'past';

export function countdownVariant(
  isoDate: string,
  now: Date = new Date(),
): CountdownVariant {
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return 'past';
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0 && diffMs > -RUNNING_WINDOW_MS) return 'running';
  if (diffMs <= -RUNNING_WINDOW_MS) return 'past';
  if (diffMs < 24 * 60 * 60 * 1000) return 'urgent';
  // DNES/ZÍTRA/+2-6 = soon; +7+ = future
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const targetStart = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const diffDays = Math.round(
    (targetStart.getTime() - todayStart.getTime()) / 86_400_000,
  );
  return diffDays >= 7 ? 'future' : 'soon';
}

/** True pokud akce je v aktivním 24h okně (Matrix-style — pro `Nadcházející` view). */
export function isInActiveWindow(
  isoDate: string,
  now: Date = new Date(),
): boolean {
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return false;
  const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;
  return target.getTime() >= now.getTime() - ACTIVE_WINDOW_MS;
}

/** ISO timestamp pro cut-off `now − 24h`, zaokrouhlený na minutu (stabilní query klíč). */
export function activeWindowCutoffIso(now: Date = new Date()): string {
  const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;
  const cutoffMs = Math.floor((now.getTime() - ACTIVE_WINDOW_MS) / 60_000) * 60_000;
  return new Date(cutoffMs).toISOString();
}
