/**
 * Spec 26.5 (D9) — moment 2 (03 §4): whitelist netriviálních rout, kde první
 * vstup smí vyvolat bublinu „Poprvé tady? Provedu tě." Max 1× per routa
 * (seenRoutes), zavření se nikdy neopakuje (dismiss per routa).
 * Typováno proti route registru — překlep spadne v tsc.
 */
import type { RoutePattern } from '@/app/routeRegistry';

export const NETRIVIALNI_ROUTY: ReadonlySet<RoutePattern> = new Set<RoutePattern>([
  // JEN routy, kde panel má reálný obsah — „Provedu tě" nesmí vést do prázdna
  // (revize pokrytí 2026-07-23). Zbytek se vrátí s obsahem Tier 1.
  '/svet/:worldSlug/pavucina',
  '/svet/:worldSlug/kalendar',
  '/svet/:worldSlug/mapy',
  '/svet/:worldSlug/timeline',
  '/svet/:worldSlug/bestiar',
]);
