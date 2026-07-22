/**
 * Spec 26.5 (D9/D11) — CI validace registru Vypravěče (06 §7 MVP hard-fail):
 * unikátní ID napříč registrem · CTA cesty vedou na existující routy ·
 * dismiss klíče chybových topiků unikátní. Mrtvý odkaz spadne tady, ne u testera.
 */
import { describe, it, expect } from 'vitest';
import { ROUTES } from '@/app/routeRegistry';
import { ROUTE_HEADERS } from '../routeHeaders';
import { CHYBOVE_TOPIKY, CHYBOVE_STATUSY } from '../errorTopics';
import { CESTY } from '../journeys';
import { NAVODY } from '../navody';
import { NETRIVIALNI_ROUTY } from '../netrivialniRouty';
import { TOPIKY } from '../topics';

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

  it('topiky: unikátní ID + routy i akce existují v registru rout', () => {
    const ids = TOPIKY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const topik of TOPIKY) {
      for (const r of topik.routes)
        expect(znameRouty.has(r), `topik ${topik.id} routa ${r}`).toBe(true);
      for (const a of topik.akce ?? [])
        expect(znameRouty.has(a.to), `topik ${topik.id} akce ${a.to}`).toBe(true);
      expect(topik.body.odstavce.length, `topik ${topik.id} bez těla`).toBeGreaterThan(0);
      expect(topik.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('návody: unikátní ID + akce vedou na existující routy + mají kroky', () => {
    const ids = NAVODY.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of NAVODY) {
      expect(n.body.kroky?.length ?? 0, n.id).toBeGreaterThanOrEqual(3);
      expect(n.body.kroky?.length ?? 0, n.id).toBeLessThanOrEqual(7);
      for (const a of n.akce ?? [])
        expect(znameRouty.has(a.to), `návod ${n.id} akce ${a.to}`).toBe(true);
    }
  });

  it('topicId kroků cest odkazují na existující topiky', () => {
    const zname = new Set(TOPIKY.map((t) => t.id));
    for (const cesta of Object.values(CESTY))
      for (const k of cesta.phases.flatMap((f) => f.steps))
        if (k.topicId)
          expect(zname.has(k.topicId), `krok ${k.id} → ${k.topicId}`).toBe(true);
  });

  it('netriviální routy (moment 2) existují v registru', () => {
    for (const r of NETRIVIALNI_ROUTY)
      expect(znameRouty.has(r), `netriviální ${r}`).toBe(true);
  });
});
