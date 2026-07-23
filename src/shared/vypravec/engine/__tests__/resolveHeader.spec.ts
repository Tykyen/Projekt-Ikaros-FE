/**
 * Spec 26.2 — kontextový engine: pathname → RouteHeader + audience dovětek.
 */
import { describe, it, expect } from 'vitest';
import { WorldRole } from '@/shared/types';
import { resolveRouteHeader, audienceZRole } from '../resolveHeader';
import { ROUTE_HEADERS } from '../../registry/routeHeaders';
import { ROUTES } from '@/app/routeRegistry';

describe('resolveRouteHeader', () => {
  it('platformní routa bez world kontextu', () => {
    const h = resolveRouteHeader('/');
    expect(h?.name).toBe('Úvodník');
    expect(h?.text).toMatch(/Rozcestník/);
  });

  it('world routa: audience dovětek se PŘIDÁVÁ k blurbu (Hráč na /stranky)', () => {
    const bezRole = resolveRouteHeader('/svet/askalon/stranky');
    const hrac = resolveRouteHeader('/svet/askalon/stranky', {
      userRole: WorldRole.Hrac,
      isPJ: false,
    });
    expect(hrac?.text.startsWith(bezRole!.text.split(' Naostro')[0].slice(0, 20))).toBe(true);
    expect(hrac?.text).toMatch(/Navrhnout/);
    expect(resolveRouteHeader('/svet/askalon/stranky', { userRole: WorldRole.PJ, isPJ: true })?.text).not.toMatch(/Navrhnout/);
  });

  it('PJ dovětek na /nastaveni', () => {
    const pj = resolveRouteHeader('/svet/askalon/nastaveni', { userRole: WorldRole.PJ, isPJ: true });
    expect(pj?.text).toMatch(/Soukromý/);
  });

  it('wiki catch-all má header, Tier 1 routa (pravidla) ne', () => {
    expect(resolveRouteHeader('/svet/askalon/nejaka-wiki')?.name).toBe('Stránka světa');
    expect(resolveRouteHeader('/svet/askalon/pravidla')).toBeNull();
  });

  it('nepokrytá / neznámá routa → null (poctivý fallback)', () => {
    expect(resolveRouteHeader('/ikaros/clanky')).toBeNull();
    expect(resolveRouteHeader('/uplne/mimo')).toBeNull();
  });

  it('audienceZRole mapuje celý enum a Žadatele na anon', () => {
    expect(audienceZRole(WorldRole.PJ)).toBe('pj');
    expect(audienceZRole(WorldRole.Zadatel)).toBe('anon');
    expect(audienceZRole(null)).toBe('anon');
  });
});

describe('registr hlaviček — sanity', () => {
  it('každý header míří na existující routu registru a routy se neopakují', () => {
    const known = new Set(ROUTES.map((r) => r.pattern));
    const seen = new Set<string>();
    for (const h of ROUTE_HEADERS) {
      expect(known.has(h.route), `neznámá routa ${h.route}`).toBe(true);
      expect(seen.has(h.route), `duplicitní header ${h.route}`).toBe(false);
      seen.add(h.route);
    }
  });
});
