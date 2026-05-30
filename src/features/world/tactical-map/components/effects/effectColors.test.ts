import { describe, it, expect } from 'vitest';
import {
  getVariantColors,
  getRingColor,
  VARIANT_CONFIG,
  PALETTE_COLORS,
} from './effectColors';

describe('effectColors', () => {
  describe('getVariantColors', () => {
    it('vrací 6-tier škálu pro každou variantu', () => {
      expect(getVariantColors('fire')).toHaveLength(6);
      expect(getVariantColors('gas')).toHaveLength(6);
      expect(getVariantColors('smoke')).toHaveLength(6);
    });

    it('neznámá / chybějící varianta → fallback fire', () => {
      expect(getVariantColors(undefined)).toEqual(getVariantColors('fire'));
      expect(getVariantColors('nonsense')).toEqual(getVariantColors('fire'));
    });

    it('plyn je zelený, kouř šedý (rozlišitelné škály)', () => {
      expect(getVariantColors('gas')[0]).toContain('140, 30');
      expect(getVariantColors('smoke')[0]).toContain('60, 60, 60');
    });
  });

  describe('getRingColor', () => {
    it('index = radius', () => {
      expect(getRingColor('fire', 0)).toBe(getVariantColors('fire')[0]);
      expect(getRingColor('fire', 2)).toBe(getVariantColors('fire')[2]);
    });

    it('radius nad rozsah → clamp na poslední tier (žádné undefined)', () => {
      const last = getVariantColors('fire')[5];
      expect(getRingColor('fire', 6)).toBe(last);
      expect(getRingColor('fire', 99)).toBe(last);
    });

    it('záporný radius → clamp na 0', () => {
      expect(getRingColor('gas', -3)).toBe(getVariantColors('gas')[0]);
    });
  });

  describe('konstanty palety', () => {
    it('3 varianty s ikonou a barvou', () => {
      expect(VARIANT_CONFIG).toHaveLength(3);
      VARIANT_CONFIG.forEach((v) => {
        expect(v.icon).toBeTruthy();
        expect(v.color).toMatch(/^#/);
      });
    });

    it('8 přednastavených barev, každá rgba value + dot', () => {
      expect(PALETTE_COLORS).toHaveLength(8);
      PALETTE_COLORS.forEach((c) => {
        expect(c.value).toMatch(/^rgba\(/);
        expect(c.dot).toBeTruthy();
      });
    });
  });
});
