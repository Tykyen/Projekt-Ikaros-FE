const WEEKDAYS_SHORT_CS = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatHM(d: Date): string {
  return `${d.getHours()}:${pad2(d.getMinutes())}`;
}

/**
 * Relativní český formát data pro dashboard eventy.
 *
 * - dnes → `"dnes HH:mm"`
 * - zítra → `"zítra HH:mm"`
 * - +2 až +6 dní (stejný rok) → `"<weekday> HH:mm"` (`po 19:00`)
 * - +7 a více dní (stejný rok) → `"<weekday> D.M. HH:mm"` (`čt 8.5. 19:00`)
 * - jiný rok → `"D.M.YYYY HH:mm"`
 * - minulé datum → fallback `"D.M.YYYY HH:mm"`
 */
export function relativeEventDate(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return '';

  const todayStart = startOfDay(now);
  const targetStart = startOfDay(target);
  const dayDiff = Math.round(
    (targetStart.getTime() - todayStart.getTime()) / 86_400_000,
  );

  const time = formatHM(target);
  const sameYear = target.getFullYear() === now.getFullYear();

  if (dayDiff === 0) return `dnes ${time}`;
  if (dayDiff === 1) return `zítra ${time}`;

  if (dayDiff > 1 && dayDiff <= 6 && sameYear) {
    return `${WEEKDAYS_SHORT_CS[target.getDay()]} ${time}`;
  }

  if (dayDiff > 6 && sameYear) {
    return `${WEEKDAYS_SHORT_CS[target.getDay()]} ${target.getDate()}.${target.getMonth() + 1}. ${time}`;
  }

  return `${target.getDate()}.${target.getMonth() + 1}.${target.getFullYear()} ${time}`;
}

/**
 * True pokud event začíná do 24 hodin od `now` (urgency hint).
 */
export function isWithin24h(iso: string, now: Date = new Date()): boolean {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return false;
  const diff = target.getTime() - now.getTime();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}
