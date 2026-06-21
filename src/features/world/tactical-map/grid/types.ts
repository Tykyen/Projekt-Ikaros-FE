/**
 * 15.2 — abstrakce typu mřížky (strategy pattern).
 *
 * Tři typy: `hex` (flat-top axial, dnešní default), `square` (čtvercová mřížka),
 * `none` (čtvercová geometrie, ale bez kreslených čar). Konzumenti volají
 * `getGridAdapter(config.gridType)` místo přímého importu `hexUtils` → render,
 * snapping, fog, efekty a měření jsou nezávislé na konkrétním typu.
 *
 * Souřadnice zůstávají integer `q`/`r` napříč všemi typy (žádná migrace) —
 * adaptér mění jen *geometrii* převodu buňka↔pixel, ne úložiště.
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.1, spec-15.2.md §3.
 */
import type { HexCoord, Point } from '../types';

export type GridType = 'hex' | 'square' | 'none';

export interface GridAdapter {
  /** Identita adaptéru. */
  readonly type: GridType;
  /** Kreslit čáry mřížky? `false` pro `none`. */
  readonly drawsGrid: boolean;
  /** Směrové vektory sousedů (6 pro hex, 8 vč. diagonál pro square/none). */
  readonly neighbors: HexCoord[];

  /** Buňka (q,r) → střed v map-space px (BEZ origin). */
  toPixel(q: number, r: number, size: number): Point;
  /** Map-space px (BEZ origin) → nejbližší buňka (q,r). */
  toCell(x: number, y: number, size: number): HexCoord;
  /**
   * Obrys buňky pro `Graphics.poly()` (flat number[] `[x0,y0,...]`).
   * `scaled` = efektivní velikost (volající passuje `size` × multiplikátor pro
   * inset/overlap, např. `size*1.05`). Každý adaptér ho interpretuje ve své
   * jednotce (hex = délka hrany, square = délka strany).
   */
  cellPoly(center: Point, scaled: number): number[];
  /** Vzdálenost v buňkách (hex distance / Chebyshev). */
  distance(a: HexCoord, b: HexCoord): number;
  /** Vyplněný disk 0..radius od středu (fog štětec, bariéra). */
  cellsInRadius(q: number, r: number, radius: number): HexCoord[];
  /** Jen prstenec přesně ve vzdálenosti radius (explosion rings). */
  cellsInRing(q: number, r: number, radius: number): HexCoord[];
  /** Poloměr tokenu = vepsaná kružnice buňky (px). */
  tokenRadius(size: number): number;
}
