import { describe, it, expect } from 'vitest';
import { formatLastSeen } from './lastSeen';

const agoIso = (ms: number) => new Date(Date.now() - ms).toISOString();
const H = 3_600_000;
const D = 86_400_000;

describe('formatLastSeen', () => {
  it('online → „teď", tier online', () => {
    expect(formatLastSeen(undefined, true)).toEqual({
      label: 'teď',
      tier: 'online',
    });
  });

  it('bez lastSeenAt (neviditelný mód) → tier unknown', () => {
    expect(formatLastSeen(undefined, false)).toEqual({
      label: '—',
      tier: 'unknown',
    });
  });

  it('před hodinami → „N h", tier recent', () => {
    const r = formatLastSeen(agoIso(3 * H), false);
    expect(r.label).toBe('3 h');
    expect(r.tier).toBe('recent');
  });

  it('před dny → „N d", tier week', () => {
    const r = formatLastSeen(agoIso(3 * D), false);
    expect(r.label).toBe('3 d');
    expect(r.tier).toBe('week');
  });

  it('staré (>7 dní) → datum, tier old', () => {
    const r = formatLastSeen(agoIso(30 * D), false);
    expect(r.tier).toBe('old');
    expect(r.label).toMatch(/\d/);
  });

  it('nevalidní datum → tier unknown', () => {
    expect(formatLastSeen('není-datum', false).tier).toBe('unknown');
  });
});
