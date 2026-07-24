import { describe, it, expect } from 'vitest';
import {
  PREVIEW_FEATURES,
  HIDDEN_FEATURES,
  isPreview,
  isHidden,
  scopeTier,
} from './scope';

describe('scope registr 27.3', () => {
  it('B klíče = Preview (badge), A default', () => {
    expect(isPreview('tvorba')).toBe(true); // platforma B
    expect(isPreview('pavucina')).toBe(true); // svět B
    expect(isPreview('takticka-mapa')).toBe(false); // A (zlatá cesta ③)
    expect(isPreview(undefined)).toBe(false);
  });

  it('C klíče = skryté (flag)', () => {
    expect(isHidden('systemy')).toBe(true); // blokované licencí (25.8)
    expect(isHidden('pavucina')).toBe(false);
    expect(isHidden(undefined)).toBe(false);
  });

  it('scopeTier vrací A/B/C dle setů (C má přednost)', () => {
    expect(scopeTier('takticka-mapa')).toBe('A');
    expect(scopeTier('kalendar')).toBe('B');
    expect(scopeTier('systemy')).toBe('C');
  });

  it('žádný klíč není zároveň B i C (disjunktní tiery)', () => {
    for (const key of PREVIEW_FEATURES) {
      expect(HIDDEN_FEATURES.has(key)).toBe(false);
    }
  });
});
