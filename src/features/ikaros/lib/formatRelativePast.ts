/**
 * Český relativní formát pro pastované datum (novinky, audit log).
 *
 * - <60s → "právě teď"
 * - <60min → "před X min"
 * - <24h → "před X h"
 * - <7 dní → "před X dny"
 * - jinak → "D.M.YYYY"
 */
export function formatRelativePast(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return '';

  const diffMs = now.getTime() - target.getTime();
  if (diffMs < 0) {
    // budoucí datum — fallback na absolutní
    return `${target.getDate()}.${target.getMonth() + 1}.${target.getFullYear()}`;
  }

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'právě teď';

  const min = Math.floor(sec / 60);
  if (min < 60) return `před ${min} min`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `před ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) {
    if (days === 1) return 'včera';
    return `před ${days} dny`;
  }

  return `${target.getDate()}.${target.getMonth() + 1}.${target.getFullYear()}`;
}

/** Absolutní český formát data — pro rozbalený detail (D. M. YYYY). */
export function formatAbsoluteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}
