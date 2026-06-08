import { describe, it, expect } from 'vitest';
import {
  calendarColorSlot,
  resolveCalendarColor,
  isExplicitCalendarColor,
  slotColorVar,
  CALENDAR_COLOR_SLOTS,
} from './calendarColor';

describe('calendarColor', () => {
  it('slot je deterministický pro stejné id', () => {
    expect(calendarColorSlot('char-abc')).toBe(calendarColorSlot('char-abc'));
  });

  it('slot je vždy 0..11', () => {
    for (const id of ['a', 'bb', 'ccc', 'x1y2', 'char-42', 'Δåß', '']) {
      const slot = calendarColorSlot(id);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(CALENDAR_COLOR_SLOTS);
    }
  });

  describe('resolveCalendarColor', () => {
    it('explicit slot přebije hash', () => {
      expect(resolveCalendarColor('any', '5')).toBe('var(--chat-group-6)');
      expect(resolveCalendarColor('any', '0')).toBe('var(--chat-group-1)');
      expect(resolveCalendarColor('any', '11')).toBe('var(--chat-group-12)');
    });

    it('prázdné/undefined → auto hash', () => {
      expect(resolveCalendarColor('seed-x')).toBe(
        slotColorVar(calendarColorSlot('seed-x')),
      );
      expect(resolveCalendarColor('seed-x', '')).toBe(
        slotColorVar(calendarColorSlot('seed-x')),
      );
    });

    it('legacy default #3B82F6 se bere jako auto (case-insensitive)', () => {
      expect(resolveCalendarColor('seed-y', '#3B82F6')).toBe(
        slotColorVar(calendarColorSlot('seed-y')),
      );
      expect(resolveCalendarColor('seed-y', '#3b82f6')).toBe(
        slotColorVar(calendarColorSlot('seed-y')),
      );
    });

    it('custom HEX override je respektován', () => {
      expect(resolveCalendarColor('any', '#ff0000')).toBe('#ff0000');
    });

    it('mimo rozsah slot (12) → padá na auto hash, ne na slot', () => {
      expect(resolveCalendarColor('seed-z', '12')).toBe(
        slotColorVar(calendarColorSlot('seed-z')),
      );
    });
  });

  describe('isExplicitCalendarColor', () => {
    it('slot a custom HEX = explicit, default/prázdné = auto', () => {
      expect(isExplicitCalendarColor('3')).toBe(true);
      expect(isExplicitCalendarColor('#abcdef')).toBe(true);
      expect(isExplicitCalendarColor('#3B82F6')).toBe(false);
      expect(isExplicitCalendarColor('')).toBe(false);
      expect(isExplicitCalendarColor(undefined)).toBe(false);
    });
  });
});
