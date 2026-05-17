import { describe, it, expect } from 'vitest';
import { contrastRatio, AA_THRESHOLD } from '../lib/contrastGuard';

describe('contrastGuard', () => {
  it('černá na bílé má maximální poměr 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('shodné barvy mají poměr 1:1', () => {
    expect(contrastRatio('#3366aa', '#3366aa')).toBeCloseTo(1, 5);
  });

  it('poměr je symetrický (pořadí argumentů nehraje roli)', () => {
    const a = contrastRatio('#222222', '#dddddd');
    const b = contrastRatio('#dddddd', '#222222');
    expect(a).toBeCloseTo(b, 5);
  });

  it('nevalidní vstup vrací 1', () => {
    expect(contrastRatio('rgba(0,0,0,1)', '#ffffff')).toBe(1);
    expect(contrastRatio('#fff', 'bezbarvý')).toBe(1);
  });

  it('AA práh je 4.5', () => {
    expect(AA_THRESHOLD).toBe(4.5);
    // bílá na bílé pod prahem, černá na bílé nad prahem
    expect(contrastRatio('#ffffff', '#ffffff')).toBeLessThan(AA_THRESHOLD);
    expect(contrastRatio('#000000', '#ffffff')).toBeGreaterThan(AA_THRESHOLD);
  });
});
