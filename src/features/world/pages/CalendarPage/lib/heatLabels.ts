/**
 * 9.4 — Helper pro screen reader label cell v Heat density.
 * Český gramatický plural (1 / 2-4 / 5+).
 */
export function heatA11yLabel(eventCount: number): string {
  if (eventCount === 0) return '';
  if (eventCount === 1) return '1 událost';
  if (eventCount < 5) return `${eventCount} události`;
  return `${eventCount} událostí`;
}
