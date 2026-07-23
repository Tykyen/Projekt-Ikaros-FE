/**
 * Spec 26.5 (D9/D11) — CI validace registru Vypravěče (06 §7 MVP hard-fail):
 * unikátní ID napříč registrem · CTA cesty vedou na existující routy ·
 * dismiss klíče chybových topiků unikátní. Mrtvý odkaz spadne tady, ne u testera.
 */
import { describe, it, expect } from 'vitest';
import { ROUTES } from '@/app/routeRegistry';
import { ROUTE_HEADERS } from '../routeHeaders';
import { CHYBOVE_TOPIKY, CHYBOVE_STATUSY } from '../errorTopics';
import { CESTY, OSLAVY_DOKONCENI, POPISKY_CEST } from '../journeys';
import { NAVODY } from '../navody';
import { NETRIVIALNI_ROUTY } from '../netrivialniRouty';
import { TOPIKY } from '../topics';
import { TOOLBOX_ITEMS } from '../toolbox';
import { ZMENY } from '../changelog';
import { KOTVY } from '../anchors';

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
        expect(
          znameRouty.has(a.to.split('?')[0].split('#')[0]),
          `topik ${topik.id} akce ${a.to}`,
        ).toBe(true);
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

  it('kotvy: routy existují + kroky cest odkazují na existující kotvy', () => {
    for (const [id, k] of Object.entries(KOTVY))
      expect(znameRouty.has(k.route), `kotva ${id}`).toBe(true);
    for (const cesta of Object.values(CESTY))
      for (const krok of cesta.phases.flatMap((f) => f.steps))
        if (krok.anchor)
          expect(krok.anchor in KOTVY, `krok ${krok.id} kotva`).toBe(true);
  });

  it('netriviální routy (moment 2) existují v registru', () => {
    for (const r of NETRIVIALNI_ROUTY)
      expect(znameRouty.has(r), `netriviální ${r}`).toBe(true);
  });
});

describe('revize 07/23 — sanity pojistky (06 §7)', () => {
  const PLATNE_AUDIENCE = new Set([
    'anon',
    'prihlaseny',
    'ctenar',
    'hrac',
    'korektor',
    'pomocnyPJ',
    'pj',
    'admin',
  ]);

  it('audience hodnoty jsou z výčtu VypravecAudience', () => {
    for (const t of [...TOPIKY, ...NAVODY])
      for (const a of t.audience ?? [])
        expect(PLATNE_AUDIENCE.has(a), `${t.id}: audience '${a}'`).toBe(true);
  });

  it('verifiedAt je ISO datum (RRRR-MM-DD)', () => {
    for (const t of [...TOPIKY, ...NAVODY])
      expect(t.verifiedAt, t.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('changelog: ID formát zm-RRRR-MM-DD-slug a shoda s datem', () => {
    for (const z of ZMENY) {
      expect(z.id).toMatch(/^zm-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/);
      expect(z.id.slice(3, 13), z.id).toBe(z.datum);
    }
  });
});

describe('finální audit 07/23 — pojistky changelogu a cest', () => {
  it('ZMENY jsou sestupně dle data (badge = findIndex na pořadí stojí)', () => {
    for (let i = 1; i < ZMENY.length; i++)
      expect(ZMENY[i - 1].datum >= ZMENY[i].datum, ZMENY[i].id).toBe(true);
  });

  it('Zmena.to vede na existující routu', () => {
    for (const z of ZMENY)
      if (z.to)
        expect(znameRouty.has(z.to.split('?')[0]), `${z.id} → ${z.to}`).toBe(
          true,
        );
  });

  it('každá cesta má popisek i oslavu dokončení', () => {
    for (const id of Object.keys(CESTY)) {
      expect(POPISKY_CEST[id], `POPISKY_CEST['${id}']`).toBeTruthy();
      expect(OSLAVY_DOKONCENI[id], `OSLAVY_DOKONCENI['${id}']`).toBeTruthy();
    }
  });
});

describe('závěrečný podpis — CI pojistky (kritik úplnosti)', () => {
  it('toolbox `to` míří na existující world routu', () => {
    for (const it of TOOLBOX_ITEMS)
      expect(
        znameRouty.has(`/svet/:worldSlug/${it.to}`),
        `toolbox ${it.key} → /svet/:worldSlug/${it.to}`,
      ).toBe(true);
  });

  it('deep-linky ?topik=Y jsou dobře tvarované a v whitelistu kotev HelpPage', () => {
    // Whitelist musí zůstat v souladu s id akordeonů HelpPage sekcí.
    // Rozbití = přejmenování akordeonu → přidat sem i do HelpPage sekce.
    const KOTVY_HELPPAGE = new Set([
      'role-svetove',
      'role-globalni',
      'komunikace-zvuk',
      'takticka-mapa',
    ]);
    const deepLinky: string[] = [];
    for (const t of TOPIKY)
      for (const a of t.akce ?? []) {
        const m = a.to.match(/[?&]topik=([a-z0-9-]+)/);
        if (m) deepLinky.push(m[1]);
      }
    expect(deepLinky.length).toBeGreaterThan(0);
    for (const k of deepLinky)
      expect(KOTVY_HELPPAGE.has(k), `deep-link kotva ${k}`).toBe(true);
  });
});
