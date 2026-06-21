/**
 * 15.3 — geometrie šablon oblastí (kužel / linie / koule / čtverec).
 *
 * Tvar se testuje v **pixel-space** (mapa-space px) a teprve výsledné buňky se
 * vrací jako `HexCoord[]` → uniformní napříč typy mřížky (hex/čtverec/none) bez
 * per-typ větvení. Výsledek se ukládá jako stávající `color` effect (reuse).
 *
 * `origin` = bod kliknutí, `target` = konec tažení (určuje směr i dosah:
 * dosah/poloměr = |target − origin|).
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.2c.
 */
import { getGridAdapter } from '../grid';
import type { HexConfig, HexCoord, Point } from '../types';

export type TemplateShape = 'cone' | 'line' | 'circle' | 'square';

/** Půlúhel kužele (°). 30 → kužel 60°. */
const CONE_HALF_ANGLE_DEG = 30;
/** Bezpečnostní strop počtu buněk (malá buňka × dlouhé tažení). */
const MAX_CELLS = 4000;

export function templateCells(
  shape: TemplateShape,
  origin: Point,
  target: Point,
  config: HexConfig,
): HexCoord[] {
  const adapter = getGridAdapter(config.gridType);
  const toCell = (x: number, y: number): HexCoord =>
    adapter.toCell(x - config.originX, y - config.originY, config.size);

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return [toCell(origin.x, origin.y)];

  const ux = dx / len;
  const uy = dy / len;
  const halfWidth = config.size * 0.6;
  const cosCone = Math.cos((Math.PI / 180) * CONE_HALF_ANGLE_DEG);

  // Kandidátní buňky = bbox tvaru (origin ± dosah) převedený na buňky.
  const reach = len + config.size;
  const c1 = toCell(origin.x - reach, origin.y - reach);
  const c2 = toCell(origin.x + reach, origin.y + reach);
  const qLo = Math.min(c1.q, c2.q) - 1;
  const qHi = Math.max(c1.q, c2.q) + 1;
  const rLo = Math.min(c1.r, c2.r) - 1;
  const rHi = Math.max(c1.r, c2.r) + 1;

  const out: HexCoord[] = [];
  for (let q = qLo; q <= qHi && out.length < MAX_CELLS; q++) {
    for (let r = rLo; r <= rHi && out.length < MAX_CELLS; r++) {
      const ctr = adapter.toPixel(q, r, config.size);
      const cx = ctr.x + config.originX;
      const cy = ctr.y + config.originY;
      const vx = cx - origin.x;
      const vy = cy - origin.y;
      const dist = Math.hypot(vx, vy);

      let inside = false;
      switch (shape) {
        case 'circle':
          inside = dist <= len;
          break;
        case 'square':
          inside =
            Math.abs(cx - origin.x) <= len && Math.abs(cy - origin.y) <= len;
          break;
        case 'line': {
          const proj = vx * ux + vy * uy; // podél směru
          const perp = Math.abs(vx * -uy + vy * ux); // kolmo
          inside =
            proj >= -config.size * 0.5 && proj <= len && perp <= halfWidth;
          break;
        }
        case 'cone':
          if (dist <= len) {
            inside = dist < 0.01 || (vx * ux + vy * uy) / dist >= cosCone;
          }
          break;
      }
      if (inside) out.push({ q, r });
    }
  }
  return out;
}
