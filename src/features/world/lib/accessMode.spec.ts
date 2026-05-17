import { describe, it, expect } from 'vitest';
import { accessModeLabel, ACCESS_LABELS } from './accessMode';

describe('accessModeLabel', () => {
  it('vrací český label pro všechny 4 režimy', () => {
    expect(accessModeLabel('public')).toBe('Veřejný');
    expect(accessModeLabel('open')).toBe('Veřejný se schválením');
    expect(accessModeLabel('private')).toBe('Soukromý');
    expect(accessModeLabel('closed')).toBe('Uzavřený');
  });

  it('fallback na surovou hodnotu pro neznámý režim', () => {
    expect(accessModeLabel('neznamy')).toBe('neznamy');
  });

  it('ACCESS_LABELS pokrývá přesně 4 režimy', () => {
    expect(Object.keys(ACCESS_LABELS)).toHaveLength(4);
  });
});
