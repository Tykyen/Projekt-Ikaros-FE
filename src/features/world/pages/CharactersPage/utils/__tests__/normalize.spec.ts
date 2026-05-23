import { describe, it, expect } from 'vitest';
import { normalize } from '../normalize';

describe('normalize (8.3 search util)', () => {
  it('převede na lowercase a smaže diakritiku', () => {
    expect(normalize('Žluťoučký kůň')).toBe('zlutoucky kun');
  });

  it('idempotentní pro ASCII', () => {
    expect(normalize('frodo')).toBe('frodo');
    expect(normalize('FRODO')).toBe('frodo');
  });

  it('prázdné / null / undefined → prázdný string', () => {
    expect(normalize('')).toBe('');
    expect(normalize(undefined)).toBe('');
    expect(normalize(null)).toBe('');
  });
});
