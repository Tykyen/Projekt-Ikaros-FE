/**
 * 1.5 D-050 — relativní český čas pro „naposledy online před X" tooltip.
 * Bez závislosti na `date-fns`. Vstup ISO string, výstup česká fráze.
 */
export function relativeTimeCs(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return 'právě teď';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `před ${diffMin} ${pluralMin(diffMin)}`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `před ${diffHr} ${pluralHr(diffHr)}`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `před ${diffDay} ${pluralDay(diffDay)}`;

  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function pluralMin(n: number): string {
  if (n === 1) return 'minutou';
  if (n >= 2 && n <= 4) return 'minutami';
  return 'minutami';
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
