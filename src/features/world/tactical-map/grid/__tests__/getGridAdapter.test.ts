/**
 * 15.2 — výběr adaptéru dle typu + default hex pro legacy scény.
 */
import { describe, it, expect } from 'vitest';
import { getGridAdapter, hexAdapter, squareAdapter, noneAdapter } from '..';

describe('getGridAdapter', () => {
  it('hex → hexAdapter', () => {
    expect(getGridAdapter('hex')).toBe(hexAdapter);
  });

  it('square → squareAdapter', () => {
    expect(getGridAdapter('square')).toBe(squareAdapter);
  });

  it('none → noneAdapter', () => {
    expect(getGridAdapter('none')).toBe(noneAdapter);
  });

  it('undefined (legacy scéna bez gridType) → hex (BC)', () => {
    expect(getGridAdapter(undefined)).toBe(hexAdapter);
  });
});
