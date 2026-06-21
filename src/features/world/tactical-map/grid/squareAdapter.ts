/**
 * 15.2 — čtvercová implementace `GridAdapter` + `none` (sdílí geometrii,
 * jen nekreslí čáry).
 *
 * Geometrie: buňka (q,r) má střed `(q·size, r·size)`, stranu `size` → buňky
 * dokonale dlaždicují (rozteč = strana). Vzdálenost = Chebyshev (král v šachu),
 * tj. diagonála stojí stejně jako rovně — standard pro čtvercové VTT mřížky.
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.1.
 */
import type { HexCoord, Point } from '../types';
import type { GridAdapter } from './types';

/** 8 směrů vč. diagonál (pro BFS hledání volné buňky). */
const SQUARE_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
  { q: 1, r: 1 },
];

function squareToPixel(q: number, r: number, size: number): Point {
  return { x: q * size, y: r * size };
}

function squareToCell(x: number, y: number, size: number): HexCoord {
  return { q: Math.round(x / size), r: Math.round(y / size) };
}

function squarePoly(center: Point, scaled: number): number[] {
  const h = scaled / 2;
  return [
    center.x - h,
    center.y - h,
    center.x + h,
    center.y - h,
    center.x + h,
    center.y + h,
    center.x - h,
    center.y + h,
  ];
}

/** Chebyshev: diagonála = 1 (max z absolutních delt). */
function squareDistance(a: HexCoord, b: HexCoord): number {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r));
}

/** Vyplněný čtvercový blok |Δq|≤radius ∧ |Δr|≤radius. */
function squareCellsInRadius(
  q: number,
  r: number,
  radius: number,
): HexCoord[] {
  const out: HexCoord[] = [];
  for (let dq = -radius; dq <= radius; dq++) {
    for (let dr = -radius; dr <= radius; dr++) {
      out.push({ q: q + dq, r: r + dr });
    }
  }
  return out;
}

/** Chebyshev prstenec: buňky kde max(|Δq|,|Δr|) === radius. */
function squareCellsInRing(
  q: number,
  r: number,
  radius: number,
): HexCoord[] {
  if (radius === 0) return [{ q, r }];
  const out: HexCoord[] = [];
  for (let dq = -radius; dq <= radius; dq++) {
    for (let dr = -radius; dr <= radius; dr++) {
      if (Math.max(Math.abs(dq), Math.abs(dr)) === radius) {
        out.push({ q: q + dq, r: r + dr });
      }
    }
  }
  return out;
}

const squareCore = {
  drawsGrid: true as boolean,
  neighbors: SQUARE_DIRECTIONS,
  toPixel: squareToPixel,
  toCell: squareToCell,
  cellPoly: squarePoly,
  distance: squareDistance,
  cellsInRadius: squareCellsInRadius,
  cellsInRing: squareCellsInRing,
  // Vepsaná kružnice čtverce o straně size = size/2.
  tokenRadius: (size: number): number => Math.round(size / 2),
};

export const squareAdapter: GridAdapter = {
  type: 'square',
  ...squareCore,
};

/** `none` = čtvercová geometrie + snapping, ale grid se nekreslí. */
export const noneAdapter: GridAdapter = {
  type: 'none',
  ...squareCore,
  drawsGrid: false,
};
