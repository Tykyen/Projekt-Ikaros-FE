import { describe, it, expect } from 'vitest';
import { payloadToNotation } from './diceNotation';
import type { DicePayload } from './dicePayload';

describe('payloadToNotation', () => {
  it('d20 → 1d20@hodnota', () => {
    const p = {
      type: 'd20',
      faces: [13],
      sum: 13,
      total: 15,
    } as DicePayload;
    expect(payloadToNotation(p)).toBe('1d20@13');
  });

  it('8.7q mixed → null (3D engine neumí predetermined `@` pro víc typů kostek; overlay fallback ukáže odznaky)', () => {
    const p = {
      type: 'mixed',
      faces: [2, 3, 4, 5],
      faceTypes: ['d4', 'd4', 'd6', 'd6'],
      sum: 14,
      total: 19,
    } as DicePayload;
    expect(payloadToNotation(p)).toBeNull();
  });

  it('fate → df notace', () => {
    const p = {
      type: 'fate',
      faces: ['+', '-', '0', '0'],
      sum: 0,
      total: 0,
    } as DicePayload;
    expect(payloadToNotation(p)).toBe('4df@1,-1,0,0');
  });
});
