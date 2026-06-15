import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { pagesQueryKey } from './usePage';

describe('pagesQueryKey.personaDirectory (C-19)', () => {
  // C-19 — `usePersonaDirectory` používá drift-safe factory `personaDirectory()`,
  // jejíž klíč ['pages',w,'directory','persona'] musí zůstat PREFIX-potomkem
  // `directory()` ['pages',w,'directory']. Díky tomu invalidace `directory()`
  // (kterou dělají character CRUD mutace) zasáhne i persona grid. Kdyby factory
  // odpojila persona od directory prefixu, CharacterDirectory karty by zůstaly
  // stale po každém CRUD. Tento test hlídá tu prefix relaci přes reálný matcher.
  it('C-19 — invalidace directory() prefix-matchne persona query', () => {
    const qc = new QueryClient();
    // Persona query je v cache.
    qc.setQueryData(pagesQueryKey.personaDirectory('w1'), []);
    const personaQuery = qc
      .getQueryCache()
      .find({ queryKey: pagesQueryKey.personaDirectory('w1') });
    expect(personaQuery).toBeDefined();

    // Matcher pro invalidaci `directory()` musí persona query zahrnout (prefix).
    const matchesDirectory = qc
      .getQueryCache()
      .findAll({ queryKey: pagesQueryKey.directory('w1') })
      .some((q) => q.queryHash === personaQuery!.queryHash);
    expect(matchesDirectory).toBe(true);
  });

  it('C-19 — persona klíč nese prefix directory + segment persona', () => {
    expect(pagesQueryKey.personaDirectory('w1')).toEqual([
      'pages',
      'w1',
      'directory',
      'persona',
    ]);
    // Prefix se shoduje s directory().
    const dir = pagesQueryKey.directory('w1');
    expect(pagesQueryKey.personaDirectory('w1').slice(0, dir.length)).toEqual(
      [...dir],
    );
  });
});
