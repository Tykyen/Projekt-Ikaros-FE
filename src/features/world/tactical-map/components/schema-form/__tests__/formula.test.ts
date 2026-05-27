import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluateFormula } from '../formula';

describe('evaluateFormula', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('arithmetic: +', () => {
    expect(evaluateFormula('1 + 2', {})).toBe(3);
  });

  it('arithmetic: precedence (* before +)', () => {
    expect(evaluateFormula('1 + 2 * 3', {})).toBe(7);
  });

  it('parentheses override precedence', () => {
    expect(evaluateFormula('(1 + 2) * 3', {})).toBe(9);
  });

  it('unary minus', () => {
    expect(evaluateFormula('-5 + 3', {})).toBe(-2);
  });

  it('dot-path identifier lookup', () => {
    expect(evaluateFormula('health.max - injury', { 'health.max': 10, injury: 3 })).toBe(7);
  });

  it('missing identifier → 0', () => {
    expect(evaluateFormula('missing.key + 5', {})).toBe(5);
  });

  it('min function', () => {
    expect(evaluateFormula('min(5, 10)', {})).toBe(5);
  });

  it('max function', () => {
    expect(evaluateFormula('max(5, 10)', {})).toBe(10);
  });

  it('floor function', () => {
    expect(evaluateFormula('floor(3.7)', {})).toBe(3);
  });

  it('ceil function', () => {
    expect(evaluateFormula('ceil(3.2)', {})).toBe(4);
  });

  it('division by zero → null', () => {
    expect(evaluateFormula('1 / 0', {})).toBeNull();
  });

  it('invalid syntax → null + warn', () => {
    expect(evaluateFormula('1 +', {})).toBeNull();
  });

  it('unknown function → null', () => {
    expect(evaluateFormula('unknown(1, 2)', {})).toBeNull();
  });
});
