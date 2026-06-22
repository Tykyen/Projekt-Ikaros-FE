import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'jotai';
import { anonSessionAtom, anonNameAtom } from './anonSession';

describe('anonSession', () => {
  beforeEach(() => localStorage.clear());

  it('default = null (žádná host session)', () => {
    const store = createStore();
    expect(store.get(anonSessionAtom)).toBeNull();
    expect(store.get(anonNameAtom)).toBeNull();
  });

  it('po set drží session a anonNameAtom derivuje jméno', () => {
    const store = createStore();
    store.set(anonSessionAtom, {
      token: 'guest.jwt',
      anonName: 'anonym1234',
      anonId: 'anon_1',
    });
    expect(store.get(anonSessionAtom)?.token).toBe('guest.jwt');
    expect(store.get(anonNameAtom)).toBe('anonym1234');
  });
});
