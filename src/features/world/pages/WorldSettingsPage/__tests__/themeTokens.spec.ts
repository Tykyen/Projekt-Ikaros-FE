import { describe, it, expect } from 'vitest';
import { parseColor, toCssColor, rgbToHex } from '../lib/themeTokens';

describe('themeTokens', () => {
  describe('rgbToHex', () => {
    it('převede RGB na hex a ořízne přesahy', () => {
      expect(rgbToHex(255, 0, 128)).toBe('#ff0080');
      expect(rgbToHex(300, -10, 0)).toBe('#ff0000');
    });
  });

  describe('parseColor', () => {
    it('rozloží hex barvu', () => {
      expect(parseColor('#aabbcc')).toEqual({ hex: '#aabbcc', alpha: 1 });
    });

    it('rozloží rgba na hex + alpha', () => {
      expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({
        hex: '#ff0000',
        alpha: 0.5,
      });
    });

    it('rgb bez alpha → alpha 1', () => {
      expect(parseColor('rgb(0, 128, 255)')).toEqual({
        hex: '#0080ff',
        alpha: 1,
      });
    });

    it('prázdná/nevalidní hodnota → fallback', () => {
      expect(parseColor(undefined).hex).toBe('#888888');
      expect(parseColor('linear-gradient(...)').hex).toBe('#888888');
    });
  });

  describe('toCssColor', () => {
    it('color token vrací hex bez ohledu na alpha', () => {
      expect(toCssColor('#112233', 0.4, 'color')).toBe('#112233');
    });

    it('alpha token s plnou neprůhledností vrací hex', () => {
      expect(toCssColor('#112233', 1, 'alpha')).toBe('#112233');
    });

    it('alpha token s průhledností vrací rgba', () => {
      expect(toCssColor('#ff0000', 0.5, 'alpha')).toBe('rgba(255, 0, 0, 0.5)');
    });
  });
});
