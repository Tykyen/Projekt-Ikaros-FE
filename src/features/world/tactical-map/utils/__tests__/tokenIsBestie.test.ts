import { describe, it, expect } from 'vitest';
import { tokenIsBestie } from '../tokenIsBestie';

describe('tokenIsBestie', () => {
  it('returns true pro templateId set', () => {
    expect(tokenIsBestie({ characterId: 'anything', templateId: 'tpl1' })).toBe(true);
  });

  it('returns true pro characterId "bestie:..."', () => {
    expect(tokenIsBestie({ characterId: 'bestie:507f1f' })).toBe(true);
  });

  it('returns false pro real characterId', () => {
    expect(tokenIsBestie({ characterId: '507f1f77bcf86cd799439011' })).toBe(false);
  });
});
