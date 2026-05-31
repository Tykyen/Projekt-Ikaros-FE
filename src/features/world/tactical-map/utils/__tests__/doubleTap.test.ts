/**
 * 10.2m — testy detekce double-tapu (ping na ploše, cross-platform).
 */
import { describe, it, expect } from 'vitest';
import { movedTooFar, isDoubleTap, type TapPoint } from '../doubleTap';

describe('movedTooFar', () => {
  it('malý posun = pořád tap', () => {
    expect(movedTooFar({ x: 100, y: 100 }, { x: 105, y: 103 })).toBe(false);
  });
  it('velký posun = drag/pan', () => {
    expect(movedTooFar({ x: 100, y: 100 }, { x: 140, y: 100 })).toBe(true);
  });
});

describe('isDoubleTap', () => {
  const base: TapPoint = { t: 1000, x: 200, y: 200 };

  it('první tap (prev=null) není double', () => {
    expect(isDoubleTap(null, base)).toBe(false);
  });
  it('rychlý druhý tap blízko = double', () => {
    expect(isDoubleTap(base, { t: 1200, x: 205, y: 198 })).toBe(true);
  });
  it('pozdní druhý tap (>300 ms) = ne', () => {
    expect(isDoubleTap(base, { t: 1400, x: 200, y: 200 })).toBe(false);
  });
  it('vzdálený druhý tap (>24 px) = ne', () => {
    expect(isDoubleTap(base, { t: 1100, x: 240, y: 200 })).toBe(false);
  });
});
