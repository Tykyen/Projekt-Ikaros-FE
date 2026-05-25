import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor, type TimelineCursor } from './cursorCodec';

const sample: TimelineCursor = {
  year: 1453,
  month: 5,
  day: 14,
  hour: 12,
  id: '507f1f77bcf86cd799439011',
};

describe('cursorCodec (FE)', () => {
  it('round-trip preserves all fields', () => {
    const enc = encodeCursor(sample);
    expect(decodeCursor(enc)).toEqual(sample);
  });

  it('záporný rok (BC) round-trip', () => {
    const bc: TimelineCursor = { ...sample, year: -487 };
    expect(decodeCursor(encodeCursor(bc))).toEqual(bc);
  });

  it('hour=-1 sentinel round-trip', () => {
    const noHour: TimelineCursor = { ...sample, hour: -1 };
    expect(decodeCursor(encodeCursor(noHour))).toEqual(noHour);
  });

  it('invalid base64 → null', () => {
    expect(decodeCursor('@@not-base64@@')).toBeNull();
  });

  it('valid base64 ale špatný shape → null', () => {
    const bad = encodeCursor({
      foo: 'bar',
    } as unknown as TimelineCursor);
    expect(decodeCursor(bad)).toBeNull();
  });

  it('výstup neobsahuje + / = (base64url)', () => {
    const enc = encodeCursor(sample);
    expect(enc).not.toMatch(/[+/=]/);
  });
});
