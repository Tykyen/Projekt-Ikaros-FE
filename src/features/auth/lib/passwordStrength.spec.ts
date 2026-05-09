import { describe, it, expect } from 'vitest';
import { passwordStrength } from '../lib/passwordStrength';

describe('passwordStrength', () => {
  it('prázdné heslo → score 0 ("Velmi slabé")', () => {
    const result = passwordStrength('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('Velmi slabé');
  });

  it('krátké jednodruhové heslo → score 0', () => {
    const result = passwordStrength('abc');
    expect(result.score).toBe(0);
  });

  it('8+ znaků pouze lowercase → score 1 ("Slabé")', () => {
    const result = passwordStrength('abcdefgh');
    expect(result.score).toBe(1);
    expect(result.label).toBe('Slabé');
  });

  it('8+ znaků mixed case → score 2', () => {
    const result = passwordStrength('AbcdEfgh');
    expect(result.score).toBe(2);
  });

  it('8+ znaků mixed case + číslice → score 3 ("Silné")', () => {
    const result = passwordStrength('Abcd1234');
    expect(result.score).toBe(3);
    expect(result.label).toBe('Silné');
  });

  it('12+ znaků mixed case + číslice + symbol → score 4 ("Velmi silné")', () => {
    const result = passwordStrength('Abcdef1234!@');
    expect(result.score).toBe(4);
    expect(result.label).toBe('Velmi silné');
  });

  it('skóre nikdy nepřekročí 4 (clamp)', () => {
    const result = passwordStrength('SuperLongPassword1234567890!@#$');
    expect(result.score).toBe(4);
  });

  it('color je definovaná pro každé skóre', () => {
    for (const pw of ['', 'abc', 'abcdefgh', 'AbcdEfgh', 'Abcd1234', 'Abcdef1234!@']) {
      const result = passwordStrength(pw);
      expect(result.color).toMatch(/^var\(--/);
    }
  });
});
