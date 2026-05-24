import { describe, it, expect } from 'vitest';
import {
  calcMod,
  calcSaveMod,
  calcSkillMod,
  fmtMod,
} from '../formulas';

describe('JaD formulas (8.7b)', () => {
  describe('calcMod', () => {
    it('vrátí 0 pro score 10', () => {
      expect(calcMod(10)).toBe(0);
    });
    it('vrátí +1 pro score 12', () => {
      expect(calcMod(12)).toBe(1);
    });
    it('vrátí -1 pro score 8', () => {
      expect(calcMod(8)).toBe(-1);
    });
    it('vrátí +3 pro score 16', () => {
      expect(calcMod(16)).toBe(3);
    });
    it('vrátí -5 pro score 1', () => {
      expect(calcMod(1)).toBe(-5);
    });
  });

  describe('fmtMod', () => {
    it('formátuje kladné s plusem', () => {
      expect(fmtMod(3)).toBe('+3');
    });
    it('formátuje zápor s minusem (default JS)', () => {
      expect(fmtMod(-2)).toBe('-2');
    });
    it('formátuje nulu jako +0', () => {
      expect(fmtMod(0)).toBe('+0');
    });
  });

  describe('calcSkillMod', () => {
    it('vrátí abilityMod bez zdatnosti', () => {
      expect(calcSkillMod(2, 0, 3)).toBe(2);
    });
    it('přidá profBonus při zdatnosti', () => {
      expect(calcSkillMod(2, 1, 3)).toBe(5);
    });
    it('přidá 2× profBonus při expertíze', () => {
      expect(calcSkillMod(2, 2, 3)).toBe(8);
    });
  });

  describe('calcSaveMod', () => {
    it('vrátí abilityMod bez zdatnosti', () => {
      expect(calcSaveMod(1, false, 2)).toBe(1);
    });
    it('přidá profBonus se zdatností', () => {
      expect(calcSaveMod(1, true, 2)).toBe(3);
    });
  });
});
