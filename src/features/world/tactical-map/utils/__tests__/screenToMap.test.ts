/**
 * 10.2m — testy převodu screen → map-space (pro ping pod přesným kurzorem).
 */
import { describe, it, expect } from 'vitest';
import { screenToMap } from '../screenToMap';

const rect = { left: 100, top: 50 } as DOMRect;

describe('screenToMap', () => {
  it('bez panu a zoom=1 odečte jen offset viewportu', () => {
    const r = screenToMap(150, 90, rect, { offsetX: 0, offsetY: 0, zoom: 1 });
    expect(r).toEqual({ x: 50, y: 40 });
  });

  it('aplikuje pan offset', () => {
    const r = screenToMap(150, 90, rect, { offsetX: 20, offsetY: 10, zoom: 1 });
    expect(r).toEqual({ x: 30, y: 30 });
  });

  it('aplikuje zoom (inverze)', () => {
    const r = screenToMap(200, 150, rect, { offsetX: 0, offsetY: 0, zoom: 2 });
    // localX=100, localY=100 → /2
    expect(r).toEqual({ x: 50, y: 50 });
  });

  it('pan + zoom kombinace', () => {
    const r = screenToMap(300, 250, rect, { offsetX: 40, offsetY: 20, zoom: 2 });
    // localX=200, (200-40)/2=80 ; localY=200, (200-20)/2=90
    expect(r).toEqual({ x: 80, y: 90 });
  });
});
