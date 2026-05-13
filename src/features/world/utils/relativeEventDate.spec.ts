import { describe, it, expect } from 'vitest';
import { relativeEventDate, isWithin24h } from './relativeEventDate';

describe('relativeEventDate', () => {
  const now = new Date('2026-05-13T10:00:00');

  it('dnes večer', () => {
    expect(relativeEventDate('2026-05-13T19:00:00', now)).toBe('dnes 19:00');
  });

  it('zítra ráno', () => {
    expect(relativeEventDate('2026-05-14T09:00:00', now)).toBe('zítra 9:00');
  });

  it('+3 dny (stejný týden) → weekday short', () => {
    // 2026-05-16 je sobota
    expect(relativeEventDate('2026-05-16T15:00:00', now)).toBe('so 15:00');
  });

  it('+6 dní → weekday short', () => {
    // 2026-05-19 je úterý
    expect(relativeEventDate('2026-05-19T19:00:00', now)).toBe('út 19:00');
  });

  it('+10 dní (stejný rok) → weekday + D.M.', () => {
    // 2026-05-23 je sobota
    expect(relativeEventDate('2026-05-23T20:00:00', now)).toBe(
      'so 23.5. 20:00',
    );
  });

  it('jiný rok → D.M.YYYY', () => {
    expect(relativeEventDate('2027-01-15T18:00:00', now)).toBe(
      '15.1.2027 18:00',
    );
  });

  it('půlnoc dnes', () => {
    const morning = new Date('2026-05-13T01:00:00');
    expect(relativeEventDate('2026-05-13T00:00:00', morning)).toBe('dnes 0:00');
  });

  it('invalid ISO → empty', () => {
    expect(relativeEventDate('not-a-date', now)).toBe('');
  });
});

describe('isWithin24h', () => {
  const now = new Date('2026-05-13T10:00:00');

  it('za 6 hodin → true', () => {
    expect(isWithin24h('2026-05-13T16:00:00', now)).toBe(true);
  });

  it('za 23 hodin 59 minut → true', () => {
    expect(isWithin24h('2026-05-14T09:59:00', now)).toBe(true);
  });

  it('za 25 hodin → false', () => {
    expect(isWithin24h('2026-05-14T11:00:00', now)).toBe(false);
  });

  it('už proběhlo → false', () => {
    expect(isWithin24h('2026-05-13T09:00:00', now)).toBe(false);
  });
});
