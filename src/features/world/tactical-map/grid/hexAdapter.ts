/**
 * 15.2 — hex implementace `GridAdapter`. Tenký obal nad stávajícím
 * `hexUtils` (flat-top axial) — žádná nová matematika, existující testy
 * `hexUtils.test.ts` zůstávají zdrojem pravdy.
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.1.
 */
import {
  AXIAL_DIRECTIONS,
  axialToPixel,
  pixelToAxial,
  getHexPolyPoints,
  hexDistance,
  getHexesInRadius,
  getHexRing,
} from '../hexUtils';
import type { GridAdapter } from './types';

const SQRT3_HALF = Math.sqrt(3) / 2;

export const hexAdapter: GridAdapter = {
  type: 'hex',
  drawsGrid: true,
  neighbors: AXIAL_DIRECTIONS,
  toPixel: axialToPixel,
  toCell: pixelToAxial,
  cellPoly: getHexPolyPoints,
  distance: hexDistance,
  cellsInRadius: getHexesInRadius,
  cellsInRing: getHexRing,
  // Vepsaná kružnice flat-top hexu = apotéma √3/2·size.
  tokenRadius: (size) => Math.round(size * SQRT3_HALF),
};
