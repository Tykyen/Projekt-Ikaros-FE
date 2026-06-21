/**
 * 15.2 — výběr `GridAdapter` dle typu mřížky scény.
 *
 * `undefined` (legacy scény bez `gridType`) → hex (BC, žádná migrace).
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.1.
 */
import { hexAdapter } from './hexAdapter';
import { squareAdapter, noneAdapter } from './squareAdapter';
import type { GridAdapter, GridType } from './types';

export type { GridAdapter, GridType } from './types';
export { hexAdapter } from './hexAdapter';
export { squareAdapter, noneAdapter } from './squareAdapter';

export function getGridAdapter(type?: GridType): GridAdapter {
  switch (type) {
    case 'square':
      return squareAdapter;
    case 'none':
      return noneAdapter;
    case 'hex':
    default:
      return hexAdapter;
  }
}
