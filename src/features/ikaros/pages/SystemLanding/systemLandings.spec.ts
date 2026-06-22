import { describe, it, expect } from 'vitest';
import {
  SYSTEM_LANDINGS,
  getPublishedLandings,
  getLandingBySlug,
} from './systemLandings';

describe('systemLandings registr', () => {
  it('obsahuje všech 7 CZ systémů', () => {
    expect(SYSTEM_LANDINGS).toHaveLength(7);
  });

  it('getPublishedLandings vrací jen 3 vlajkové (drd16/drd2/jad)', () => {
    const pub = getPublishedLandings();
    expect(pub).toHaveLength(3);
    expect(pub.map((s) => s.systemId)).toEqual(['drd16', 'drd2', 'jad']);
  });

  it('getLandingBySlug vrátí published systém', () => {
    expect(getLandingBySlug('draci-doupe-1-6')?.systemId).toBe('drd16');
  });

  it('getLandingBySlug nevrátí nepublikovaný (kostra) ani neznámý slug', () => {
    expect(getLandingBySlug('ikaros-pravidla')).toBeUndefined();
    expect(getLandingBySlug('neexistuje')).toBeUndefined();
  });

  it('published systémy mají vyplněný obsah (žádná prázdná stránka)', () => {
    for (const s of getPublishedLandings()) {
      expect(s.heroClaim.length).toBeGreaterThan(0);
      expect(s.metaDescription.length).toBeGreaterThan(0);
      expect(s.features.length).toBeGreaterThan(0);
      expect(s.jakZacit.length).toBeGreaterThan(0);
      expect(s.faq.length).toBeGreaterThan(0);
    }
  });

  it('slugy jsou unikátní', () => {
    const slugs = SYSTEM_LANDINGS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
