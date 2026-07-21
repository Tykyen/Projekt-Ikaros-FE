/**
 * Spec 26.1 — kolizní plochy (03 §5): na těchto routách se FAB Vypravěče
 * skrývá úplně („raději neviditelný než překážející"). Typováno proti route
 * registru (spec 26.0) — překlep/rename routy spadne v tsc + parity testu.
 *
 * Náhradní vstupy na kolizních plochách: „?" (legacy, MVP-A) · Shift+V ·
 * položka „Vypravěč" v mobilních drawerech. Nová „soustředěná" plocha se sem
 * doplňuje POVINNĚ (spec pravidlo 03 §5); default při neznámé kolizi = skrýt.
 */
import type { RoutePattern } from '@/app/routeRegistry';

export const KOLIZNI_ROUTY: ReadonlySet<RoutePattern> = new Set<RoutePattern>([
  // chat composery — Putyka, Campy, voice krčma, chat světa
  '/chat',
  '/chat/camp',
  '/chat/camp2',
  '/chat/camp3',
  '/chat/voice',
  '/svet/:worldSlug/chat',
  // taktická mapa (TokenInfoPanel dock zabírá celý pravý okraj)
  '/svet/:worldSlug/takticka-mapa',
  // otevřený PageEditor (soustředěné psaní)
  '/svet/:worldSlug/nova-stranka',
  '/svet/:worldSlug/edit/:slug',
]);
