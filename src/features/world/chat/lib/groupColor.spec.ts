import { describe, it, expect } from 'vitest';
import { groupColorSlot, groupColorVar, GROUP_COLOR_SLOTS } from './groupColor';

describe('groupColor', () => {
  it('slot je deterministický pro stejné id', () => {
    expect(groupColorSlot('group-abc')).toBe(groupColorSlot('group-abc'));
  });

  it('slot je vždy v rozsahu 0..5', () => {
    for (const id of ['a', 'bb', 'ccc', 'x1y2', 'group-42', 'Δåß', '']) {
      const slot = groupColorSlot(id);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(GROUP_COLOR_SLOTS);
    }
  });

  it('groupColorVar vrací CSS proměnnou --chat-group-N', () => {
    expect(groupColorVar('group-abc')).toMatch(/^var\(--chat-group-[1-6]\)$/);
  });
});
