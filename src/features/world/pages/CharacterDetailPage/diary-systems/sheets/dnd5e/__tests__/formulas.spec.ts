import { describe, it, expect } from 'vitest';
import {
  abilityMod,
  calcSaveMod,
  calcSkillMod,
  fmtMod,
} from '../formulas';

describe('DnD5e formulas (8.7d)', () => {
  describe('abilityMod', () => {
    it('vrátí 0 pro score 10', () => {
      expect(abilityMod(10)).toBe(0);
    });
    it('vrátí +2 pro score 14', () => {
      expect(abilityMod(14)).toBe(2);
    });
    it('vrátí -1 pro score 9', () => {
      expect(abilityMod(9)).toBe(-1);
    });
    it('vrátí +4 pro score 18', () => {
      expect(abilityMod(18)).toBe(4);
    });
  });

  describe('fmtMod', () => {
    it('formátuje kladné s plusem', () => {
      expect(fmtMod(3)).toBe('+3');
    });
    it('formátuje záporné s minusem', () => {
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
