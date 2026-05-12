import { describe, it, expect } from 'vitest';
import { relativeTimeCs } from '../relativeTime';

const NOW = new Date('2026-05-12T12:00:00Z').getTime();

describe('relativeTimeCs', () => {
  it('< 60 s → "právě teď"', () => {
    expect(
      relativeTimeCs(new Date(NOW - 30 * 1000).toISOString(), NOW),
    ).toBe('právě teď');
  });

  it('1 minuta → "před 1 minutou"', () => {
    expect(
      relativeTimeCs(new Date(NOW - 1 * 60 * 1000).toISOString(), NOW),
    ).toBe('před 1 minutou');
  });

  it('5 minut → "před 5 minutami"', () => {
    expect(
      relativeTimeCs(new Date(NOW - 5 * 60 * 1000).toISOString(), NOW),
    ).toBe('před 5 minutami');
  });

  it('1 hodina → "před 1 hodinou"', () => {
    expect(
      relativeTimeCs(new Date(NOW - 60 * 60 * 1000).toISOString(), NOW),
    ).toBe('před 1 hodinou');
  });

  it('3 hodiny → "před 3 hodinami"', () => {
    expect(
      relativeTimeCs(new Date(NOW - 3 * 60 * 60 * 1000).toISOString(), NOW),
    ).toBe('před 3 hodinami');
  });

  it('1 den → "před 1 dnem"', () => {
    expect(
      relativeTimeCs(new Date(NOW - 24 * 60 * 60 * 1000).toISOString(), NOW),
    ).toBe('před 1 dnem');
  });

  it('3 dny → "před 3 dny"', () => {
    expect(
      relativeTimeCs(new Date(NOW - 3 * 24 * 60 * 60 * 1000).toISOString(), NOW),
    ).toBe('před 3 dny');
  });

  it('≥ 7 dní → absolutní datum cs-CZ', () => {
    const result = relativeTimeCs(
      new Date(NOW - 10 * 24 * 60 * 60 * 1000).toISOString(),
      NOW,
    );
    expect(result).toMatch(/květen|května/i);
  });

  it('budoucí čas → "právě teď" (clamp na 0)', () => {
    expect(
      relativeTimeCs(new Date(NOW + 60 * 1000).toISOString(), NOW),
    ).toBe('právě teď');
  });

  it('invalid ISO → prázdný string', () => {
    expect(relativeTimeCs('not-a-date', NOW)).toBe('');
  });
});
