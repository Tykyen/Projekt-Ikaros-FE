/**
 * Spec 26.5 (D9/D11) — CI validace registru Vypravěče (06 §7 MVP hard-fail):
 * unikátní ID napříč registrem · CTA cesty vedou na existující routy ·
 * dismiss klíče chybových topiků unikátní. Mrtvý odkaz spadne tady, ne u testera.
 */
import { describe, it, expect } from 'vitest';
import { ROUTES } from '@/app/routeRegistry';
import { ROUTE_HEADERS } from '../routeHeaders';
import { CHYBOVE_TOPIKY, CHYBOVE_STATUSY } from '../errorTopics';
import { CESTY } from '../journeys/pjStart';
import { NETRIVIALNI_ROUTY } from '../netrivialniRouty';

const znameRouty = new Set<string>(ROUTES.map((r) => r.pattern));

describe('registr Vypravěče — validace (CI)', () => {
  it('route headers míří jen na existující routy', () => {
    for (const h of ROUTE_HEADERS)
      expect(znameRouty.has(h.route), `header ${h.route}`).toBe(true);
  });

  it('ID chybových topiků jsou unikátní', () => {
    const ids = [
      ...Object.values(CHYBOVE_TOPIKY),
      ...Object.values(CHYBOVE_STATUSY),
    ].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('akce chybových topiků vedou na existující routy', () => {
    for (const t of [
      ...Object.values(CHYBOVE_TOPIKY),
      ...Object.values(CHYBOVE_STATUSY),
    ]) {
      if (t.akce?.to) expect(znameRouty.has(t.akce.to), `akce ${t.akce.to}`).toBe(true);
    }
  });

  it('kroky cest: unikátní ID + CTA vede na existující routu (po dosazení slugu)', () => {
    for (const cesta of Object.values(CESTY)) {
      const kroky = cesta.phases.flatMap((f) => f.steps);
      const ids = kroky.map((k) => k.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const k of kroky) {
        const bezQuery = k.cta.to.split('?')[0].split('#')[0];
        expect(znameRouty.has(bezQuery), `CTA ${k.cta.to}`).toBe(true);
        if (k.done.kind === 'visit')
          expect(znameRouty.has(k.done.route), `visit ${k.done.route}`).toBe(true);
      }
    }
  });

  it('netriviální routy (moment 2) existují v registru', () => {
    for (const r of NETRIVIALNI_ROUTY)
      expect(znameRouty.has(r), `netriviální ${r}`).toBe(true);
  });
});
