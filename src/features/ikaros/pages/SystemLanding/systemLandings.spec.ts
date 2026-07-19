import { describe, it, expect } from 'vitest';
import {
  SYSTEM_LANDINGS,
  getPublishedLandings,
  getLandingBySlug,
} from './systemLandings';
import { SYSTEM_LANDINGS_PUBLIC } from './flag';

describe('systemLandings registr', () => {
  it('obsahuje všech 7 CZ systémů', () => {
    expect(SYSTEM_LANDINGS).toHaveLength(7);
  });

  // Integrita registru se testuje přímo nad SYSTEM_LANDINGS (nezávisle na
  // flagu R3 25.8) — obsah musí zůstat připravený na zpětné zapnutí.
  it('registr má 3 vlajkové published:true (drd16/drd2/jad)', () => {
    const pub = SYSTEM_LANDINGS.filter((s) => s.published);
    expect(pub).toHaveLength(3);
    expect(pub.map((s) => s.systemId)).toEqual(['drd16', 'drd2', 'jad']);
  });

  it('vlajkové systémy mají vyplněný obsah (žádná prázdná stránka)', () => {
    for (const s of SYSTEM_LANDINGS.filter((x) => x.published)) {
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

  // R3 25.8 — veřejné API registru respektuje flag (spec-25.8):
  // flag OFF ⇒ navenek se nepublikuje nic; flag ON ⇒ jen published.
  if (SYSTEM_LANDINGS_PUBLIC) {
    it('flag ON: getPublishedLandings vrací 3 vlajkové', () => {
      expect(getPublishedLandings().map((s) => s.systemId)).toEqual([
        'drd16',
        'drd2',
        'jad',
      ]);
    });

    it('flag ON: getLandingBySlug vrátí published, kostru/neznámý ne', () => {
      expect(getLandingBySlug('draci-doupe-1-6')?.systemId).toBe('drd16');
      expect(getLandingBySlug('ikaros-pravidla')).toBeUndefined();
      expect(getLandingBySlug('neexistuje')).toBeUndefined();
    });
  } else {
    it('flag OFF: getPublishedLandings nevrací nic', () => {
      expect(getPublishedLandings()).toEqual([]);
    });

    it('flag OFF: getLandingBySlug nevrátí ani published systém', () => {
      expect(getLandingBySlug('draci-doupe-1-6')).toBeUndefined();
      expect(getLandingBySlug('ikaros-pravidla')).toBeUndefined();
    });
  }
});
