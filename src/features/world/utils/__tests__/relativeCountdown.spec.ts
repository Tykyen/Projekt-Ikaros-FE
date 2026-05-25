import { describe, it, expect } from 'vitest';
import {
  relativeCountdown,
  countdownVariant,
  isInActiveWindow,
  activeWindowCutoffIso,
} from '../relativeCountdown';

describe('relativeCountdown — precize odpočet', () => {
  const now = new Date('2026-05-25T12:00:00');

  it('PROBÍHÁ pro akci od now − 1h (v running window)', () => {
    expect(relativeCountdown('2026-05-25T11:00:00', now)).toBe('PROBÍHÁ');
  });

  it('PROBÍHÁ pro akci od now − 3h59min (v running window)', () => {
    expect(relativeCountdown('2026-05-25T08:01:00', now)).toBe('PROBÍHÁ');
  });

  it('ZAČÍNÁ pro akci v aktuální minutě', () => {
    expect(relativeCountdown('2026-05-25T12:00:30', now)).toBe('ZAČÍNÁ');
  });

  it('„za N min" pro minuty', () => {
    expect(relativeCountdown('2026-05-25T12:10:00', now)).toBe('za 10 min');
    expect(relativeCountdown('2026-05-25T12:45:00', now)).toBe('za 45 min');
  });

  it('„za N hodinami/hodinou" pro hodiny', () => {
    expect(relativeCountdown('2026-05-25T13:00:00', now)).toBe(
      'za 1 hodinou',
    );
    expect(relativeCountdown('2026-05-25T15:00:00', now)).toBe(
      'za 3 hodinami',
    );
  });

  it('ZÍTRA pro +1 den (25+ h, kalendářně zítra)', () => {
    // 26h dopředu = ZÍTRA, ne „za 26 hodinami" (urgent končí na 24h)
    expect(relativeCountdown('2026-05-26T14:00:00', now)).toBe('ZÍTRA');
  });

  it('„za N dní" pro +2 dny a více', () => {
    expect(relativeCountdown('2026-05-30T19:00:00', now)).toBe('za 5 dny');
    expect(relativeCountdown('2026-06-24T19:00:00', now)).toBe('za 30 dny');
  });

  it('proběhlo před N min (mimo running window)', () => {
    // 5h zpět = mimo 4h window
    expect(relativeCountdown('2026-05-25T07:00:00', now)).toBe(
      'proběhlo před 5 hodinami',
    );
  });

  it('proběhlo před N dny (delší minulost)', () => {
    expect(relativeCountdown('2026-05-20T19:00:00', now)).toBe(
      'proběhlo před 4 dny',
    );
  });

  it('prázdný string pro nevalidní ISO', () => {
    expect(relativeCountdown('not-a-date', now)).toBe('');
  });
});

describe('countdownVariant', () => {
  const now = new Date('2026-05-25T12:00:00');

  it('running pro akci v 4h okně po startu', () => {
    expect(countdownVariant('2026-05-25T11:00:00', now)).toBe('running');
    expect(countdownVariant('2026-05-25T12:00:00', now)).toBe('running');
  });

  it('past pro akci starší 4h', () => {
    expect(countdownVariant('2026-05-25T07:00:00', now)).toBe('past');
  });

  it('urgent pro < 24h do startu', () => {
    expect(countdownVariant('2026-05-25T20:00:00', now)).toBe('urgent');
    expect(countdownVariant('2026-05-26T11:00:00', now)).toBe('urgent');
  });

  it('soon pro DNES / ZÍTRA / +2-6 dní', () => {
    // ZÍTRA ráno (≥24h ale < 7 dní + ne urgent)
    expect(countdownVariant('2026-05-27T09:00:00', now)).toBe('soon');
    expect(countdownVariant('2026-05-30T19:00:00', now)).toBe('soon');
  });

  it('future pro 7+ dní', () => {
    expect(countdownVariant('2026-06-05T19:00:00', now)).toBe('future');
  });
});

describe('isInActiveWindow', () => {
  const now = new Date('2026-05-24T12:00:00');

  it('budoucí akce → true', () => {
    expect(isInActiveWindow('2026-05-30T19:00', now)).toBe(true);
  });

  it('akce −23h → true (v aktivním okně)', () => {
    expect(isInActiveWindow('2026-05-23T13:00', now)).toBe(true);
  });

  it('akce −25h → false (mimo aktivní okno = archiv)', () => {
    expect(isInActiveWindow('2026-05-23T11:00', now)).toBe(false);
  });
});

describe('activeWindowCutoffIso', () => {
  it('vrací ISO timestamp now − 24h, zaokrouhlený na minutu', () => {
    const now = new Date('2026-05-24T12:34:56.789');
    const iso = activeWindowCutoffIso(now);
    const cutoff = new Date(iso);
    // 24h před = 2026-05-23T12:34:00 (sekundy odstřižené)
    expect(cutoff.getUTCSeconds()).toBe(0);
    expect(cutoff.getUTCMilliseconds()).toBe(0);
    // 24h rozdíl
    expect(now.getTime() - cutoff.getTime()).toBeGreaterThanOrEqual(
      24 * 60 * 60 * 1000 - 60_000,
    );
    expect(now.getTime() - cutoff.getTime()).toBeLessThanOrEqual(
      24 * 60 * 60 * 1000 + 60_000,
    );
  });
});
