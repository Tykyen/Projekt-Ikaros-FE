/**
 * S2 — fulltext „Zeptat se": diakritika/velikost složená, AND přes tokeny,
 * titul váží víc než tělo, publikum filtruje nabídku.
 */
import { describe, expect, it } from 'vitest';
import { fold, hledej } from '../hledani';

describe('fold', () => {
  it('skládá diakritiku i velikost', () => {
    expect(fold('Přístup KOSTKY žluťoučký')).toBe('pristup kostky zlutoucky');
  });
});

describe('hledej', () => {
  it('najde topik bez diakritiky v dotazu', () => {
    const v = hledej('pristup do sveta', 'pj');
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].id).toContain('svet');
  });

  it('AND: nesmyslný druhý token shodí výsledky', () => {
    expect(hledej('pristup xyzzy42', 'pj')).toEqual([]);
  });

  it('najde návod i topik (šepot → chat tahák)', () => {
    const v = hledej('sepot', 'hrac');
    expect(v.some((n) => n.id === 'insitu.chat')).toBe(true);
  });

  it('audience filtruje: admin-only topik hráč nedostane', () => {
    const proHrace = hledej('elevace', 'hrac');
    expect(proHrace.some((n) => n.id === 'role.admin-elevace')).toBe(false);
    const proAdmina = hledej('elevace', 'admin');
    expect(proAdmina.some((n) => n.id === 'role.admin-elevace')).toBe(true);
  });

  it('zásah v titulu řadí výš než zásah jen v těle', () => {
    const v = hledej('pavucina', 'pj');
    expect(v.length).toBeGreaterThan(0);
    expect(fold(v[0].title)).toContain('pavucin');
  });

  it('krátký/prázdný dotaz nic nevrací', () => {
    expect(hledej('a', 'pj')).toEqual([]);
    expect(hledej('  ', 'pj')).toEqual([]);
  });
});
