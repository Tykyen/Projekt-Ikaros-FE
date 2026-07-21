/**
 * Spec 26.0 — parity test router.tsx ↔ routeRegistry.ts (Vypravěč MVP-A D1–D2).
 *
 * Registr je ručně psaný (unese metadata, která v router.tsx nejsou); tenhle
 * test je jediná pojistka proti driftu: walkuje RUNTIME `router.routes`
 * (lazy stránky se při walku nenačítají — vzor router-schema-gate.spec.tsx)
 * a vynucuje existenci pattern ↔ router OBĚMA směry. Guard sloupce registru
 * jsou deklarovaný záměr — jejich chování kryje nav-guard-matrix.spec.tsx.
 */
import { describe, it, expect } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { router } from '../router';
import { ROUTES, matchRoutePattern } from '../routeRegistry';

/** Router path '*' (404) záměrně mimo registr — není to cíl navigace. */
const ALLOWLIST = new Set(['/*']);

function joinPath(parent: string, child: string): string {
  const base = parent.endsWith('/') ? parent.slice(0, -1) : parent;
  const seg = child.startsWith('/') ? child : `/${child}`;
  return `${base}${seg}` || '/';
}

function walk(routes: RouteObject[], parent = ''): string[] {
  const out: string[] = [];
  for (const r of routes) {
    const full = r.index || r.path == null ? parent || '/' : joinPath(parent, r.path);
    // Listy = routy s elementem/loaderem; rodiče s children jen nesou path.
    if (r.children?.length) {
      // Layout rodič bez index route by byl sám o sobě cíl — v našem routeru
      // mají oba layouty index child, rodiče samotné nezapisujeme.
      out.push(...walk(r.children, r.path ? joinPath(parent, r.path) : parent));
    } else {
      out.push(full);
    }
  }
  return out;
}

const routerPatterns = new Set(walk(router.routes).filter((p) => !ALLOWLIST.has(p)));
const registryPatterns = new Set<string>(ROUTES.map((r) => r.pattern));

describe('route registr — parita s router.tsx (spec 26.0)', () => {
  it('každá routa z router.tsx má entry v registru (router ⊆ registr)', () => {
    const missing = [...routerPatterns].filter((p) => !registryPatterns.has(p));
    expect(missing, `chybí v routeRegistry.ts: ${missing.join(', ')}`).toEqual([]);
  });

  it('registr nemá fantomy (registr ⊆ router)', () => {
    const phantom = [...registryPatterns].filter((p) => !routerPatterns.has(p));
    expect(phantom, `v router.tsx neexistuje: ${phantom.join(', ')}`).toEqual([]);
  });

  it('patterny jsou unikátní', () => {
    expect(registryPatterns.size).toBe(ROUTES.length);
  });
});

describe('matchRoutePattern — nejspecifičtější shoda', () => {
  it('statická přebije parametrickou (wiki catch-all)', () => {
    expect(matchRoutePattern('/svet/w/pravidla')).toBe('/svet/:worldSlug/pravidla');
    expect(matchRoutePattern('/svet/w/libovolna-wiki')).toBe('/svet/:worldSlug/:slug');
  });

  it('standalone pop-out přebije wiki catch-all', () => {
    expect(matchRoutePattern('/svet/w/karta-tokenu')).toBe('/svet/:worldSlug/karta-tokenu');
  });

  it('specifické před parametrickým (články)', () => {
    expect(matchRoutePattern('/ikaros/clanky/novy')).toBe('/ikaros/clanky/novy');
    expect(matchRoutePattern('/ikaros/clanky/42')).toBe('/ikaros/clanky/:id');
    expect(matchRoutePattern('/ikaros/clanky/42/upravit')).toBe('/ikaros/clanky/:id/upravit');
  });

  it('root a neznámá cesta', () => {
    expect(matchRoutePattern('/')).toBe('/');
    expect(matchRoutePattern('/uplne/neexistujici/cesta')).toBeNull();
  });
});
