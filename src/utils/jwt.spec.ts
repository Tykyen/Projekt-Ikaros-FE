import { describe, it, expect } from 'vitest';
import { decodeJwt, isJwtValid } from './jwt';

// Helper: vytvoří fake JWT (header.payload.signature, base64url)
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.fake-signature`;
}

describe('decodeJwt', () => {
  it('vrátí payload pro validní token', () => {
    const token = makeJwt({ sub: '1', username: 'alice', exp: 9999999999 });
    expect(decodeJwt(token)).toEqual({ sub: '1', username: 'alice', exp: 9999999999 });
  });

  it('vrátí null pro malformed token', () => {
    expect(decodeJwt('not-a-token')).toBeNull();
    expect(decodeJwt('only.two')).toBeNull();
    expect(decodeJwt('')).toBeNull();
  });

  it('vrátí null pro non-string vstup', () => {
    expect(decodeJwt(null as unknown as string)).toBeNull();
  });

  it('vrátí null pro token s nevalidním JSON v payloadu', () => {
    const token = `header.${btoa('not-json')}.sig`;
    expect(decodeJwt(token)).toBeNull();
  });
});

describe('isJwtValid', () => {
  it('vrátí true pro token s exp v budoucnosti', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isJwtValid(makeJwt({ exp: future }))).toBe(true);
  });

  it('vrátí false pro token s exp v minulosti', () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    expect(isJwtValid(makeJwt({ exp: past }))).toBe(false);
  });

  it('vrátí false pro null', () => {
    expect(isJwtValid(null)).toBe(false);
  });

  it('vrátí false pro token bez exp claim', () => {
    expect(isJwtValid(makeJwt({ sub: '1' }))).toBe(false);
  });
});
