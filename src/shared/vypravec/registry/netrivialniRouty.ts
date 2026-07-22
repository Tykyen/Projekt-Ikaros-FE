/**
 * Spec 26.5 (D9) — moment 2 (03 §4): whitelist netriviálních rout, kde první
 * vstup smí vyvolat bublinu „Poprvé tady? Provedu tě." Max 1× per routa
 * (seenRoutes), zavření se nikdy neopakuje (dismiss per routa).
 * Typováno proti route registru — překlep spadne v tsc.
 */
import type { RoutePattern } from '@/app/routeRegistry';

export const NETRIVIALNI_ROUTY: ReadonlySet<RoutePattern> = new Set<RoutePattern>([
  '/svet/:worldSlug/pavucina',
  '/svet/:worldSlug/kalendar',
  '/svet/:worldSlug/pocasi',
  '/svet/:worldSlug/obchod',
  '/svet/:worldSlug/prevodnik-men',
  '/svet/:worldSlug/scenare',
  '/svet/:worldSlug/mapy',
  '/svet/:worldSlug/timeline',
  '/ikaros/tvorba',
  '/ikaros/generatory',
  '/svet/:worldSlug/podzemi',
  '/svet/:worldSlug/bestiar',
]);
