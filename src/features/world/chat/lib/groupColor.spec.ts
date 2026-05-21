import { describe, it, expect } from 'vitest';
import {
  groupColorSlot,
  groupColorVar,
  groupColorVarFor,
  GROUP_COLOR_SLOTS,
} from './groupColor';

describe('groupColor', () => {
  it('slot je deterministický pro stejné id', () => {
    expect(groupColorSlot('group-abc')).toBe(groupColorSlot('group-abc'));
  });

  it('slot je vždy v rozsahu 0..11 (12 slotů od 6.5c)', () => {
    for (const id of ['a', 'bb', 'ccc', 'x1y2', 'group-42', 'Δåß', '']) {
      const slot = groupColorSlot(id);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(GROUP_COLOR_SLOTS);
    }
  });

  it('GROUP_COLOR_SLOTS = 12', () => {
    expect(GROUP_COLOR_SLOTS).toBe(12);
  });

  it('groupColorVar vrací CSS proměnnou --chat-group-1..12', () => {
    expect(groupColorVar('group-abc')).toMatch(
      /^var\(--chat-group-(1[012]?|[2-9])\)$/,
    );
  });

  // Krok 6.5c — explicit color override
  describe('groupColorVarFor', () => {
    it('PJ explicit color přebije hash', () => {
      expect(groupColorVarFor({ id: 'group-abc', color: '5' })).toBe(
        'var(--chat-group-6)',
      );
      expect(groupColorVarFor({ id: 'jiny-id', color: '0' })).toBe(
        'var(--chat-group-1)',
      );
      expect(groupColorVarFor({ id: 'jiny-id', color: '11' })).toBe(
        'var(--chat-group-12)',
      );
    });

    it('undefined color = fallback na hash', () => {
      const fromHash = groupColorVar('group-abc');
      expect(groupColorVarFor({ id: 'group-abc' })).toBe(fromHash);
    });

    it('invalid color string = fallback na hash (defensivní)', () => {
      const fromHash = groupColorVar('group-abc');
      expect(groupColorVarFor({ id: 'group-abc', color: '12' })).toBe(fromHash);
      expect(groupColorVarFor({ id: 'group-abc', color: 'foo' })).toBe(fromHash);
      expect(groupColorVarFor({ id: 'group-abc', color: '' })).toBe(fromHash);
    });
  });
});
