/**
 * Spec 3.1b — pomocné funkce pro měsíční kalendář akcí. Týden začíná pondělím
 * (české zvyklosti). Vše v lokálním čase prohlížeče.
 */

/** Vrátí 42 dat (6 týdnů) pokrývajících daný měsíc; první sloupec = pondělí. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // getDay(): 0=Ne … 6=So → posun tak, aby pondělí bylo 0.
  const mondayOffset = (first.getDay() + 6) % 7;
  return Array.from(
    { length: 42 },
    (_, i) => new Date(year, month, 1 - mondayOffset + i),
  );
}

/** Lokální klíč dne `YYYY-MM-DD` pro grupování akcí. */
export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** True pokud jsou obě data tentýž kalendářní den (lokální čas). */
export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** Názvy dnů v týdnu, pondělím počínaje. */
export const WEEKDAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
