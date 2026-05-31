/**
 * 10.2m — detekce double-tapu z pointer eventů (pro ping na ploše).
 *
 * `onDoubleClick` se na dotykových zařízeních (`touch-action: none` na viewportu)
 * nechová spolehlivě — pan/pinch běží na pointer eventech a mouse-compat dblclick
 * nemusí vzniknout. Proto vlastní detekce: tap = pointerdown→pointerup bez velkého
 * pohybu (jinak je to pan/drag); double-tap = dva tapy blízko sebe v čase i prostoru.
 * Funguje deterministicky na myši, peru i dotyku.
 */
export interface TapPoint {
  t: number;
  x: number;
  y: number;
}

/** Max posun (px) mezi down a up, aby šlo ještě o tap a ne o drag/pan. */
export const TAP_MAX_MOVE_PX = 10;
/** Max prodleva (ms) mezi dvěma tapy pro double-tap. */
export const DOUBLE_TAP_MAX_DELAY_MS = 300;
/** Max vzdálenost (px) mezi dvěma tapy pro double-tap. */
export const DOUBLE_TAP_MAX_DIST_PX = 24;

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** Pohnul se pointer mezi down a up natolik, že to není tap (= drag/pan)? */
export function movedTooFar(
  down: { x: number; y: number },
  up: { x: number; y: number },
): boolean {
  return dist(down.x, down.y, up.x, up.y) > TAP_MAX_MOVE_PX;
}

/** Navazuje `curr` tap na `prev` jako rychlý double-tap (čas i prostor)? */
export function isDoubleTap(prev: TapPoint | null, curr: TapPoint): boolean {
  if (!prev) return false;
  return (
    curr.t - prev.t <= DOUBLE_TAP_MAX_DELAY_MS &&
    dist(prev.x, prev.y, curr.x, curr.y) <= DOUBLE_TAP_MAX_DIST_PX
  );
}
