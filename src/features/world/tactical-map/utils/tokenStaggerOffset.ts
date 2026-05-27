/**
 * 10.2d — multi-token stagger offset.
 *
 * Pokud ≥2 tokeny na stejném (q,r), rozprostře je do malého kruhu kolem
 * středu hexu (radius = `size/4`, equal-angle distribution). Pro single
 * token: žádný offset.
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C2.
 */
import type { MapToken, Point } from '../types';

const RADIUS = 12;

export function computeStaggerOffsets(
  tokens: MapToken[],
): Record<string, Point> {
  const byCell = new Map<string, MapToken[]>();
  for (const t of tokens) {
    const key = `${t.q},${t.r}`;
    const arr = byCell.get(key) ?? [];
    arr.push(t);
    byCell.set(key, arr);
  }
  const out: Record<string, Point> = {};
  for (const group of byCell.values()) {
    if (group.length === 1) {
      out[group[0].id] = { x: 0, y: 0 };
      continue;
    }
    group.forEach((t, i) => {
      const angle = (i / group.length) * 2 * Math.PI;
      out[t.id] = {
        x: Math.cos(angle) * RADIUS,
        y: Math.sin(angle) * RADIUS,
      };
    });
  }
  return out;
}
