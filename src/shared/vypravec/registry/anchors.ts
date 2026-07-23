/**
 * Spec 26.9 (03 §8.2) — kotvy `data-vypravec` = explicitní kontrakt v kódu
 * (NE CSS selektory — přežijí refaktor; CI hlídá, že route existuje).
 * Když kotva na stránce není (role ji skryla, mobilní drawer), highlight
 * spadne na `fallbackText` bublinu — slovní navigace je vždy rovnocenná (a11y).
 */
import type { RoutePattern } from '@/app/routeRegistry';

export interface Kotva {
  route: RoutePattern;
  /** Slovní náhrada, když prvek nelze zvýraznit (03 §8.2). */
  fallbackText: string;
}

export const KOTVY = {
  'svet-nastaveni-ozubene': {
    route: '/svet/:worldSlug',
    fallbackText:
      'Na mobilu je ozubené kolečko schované v menu — otevři je a povedu tě dál.',
  },
  'nastaveni-tab-pristup': {
    route: '/svet/:worldSlug/nastaveni',
    fallbackText:
      'V Nastavení světa najdi záložku Přístup — tam se otevírá brána světa.',
  },
  'hraci-pozvanka': {
    route: '/svet/:worldSlug/hraci',
    fallbackText:
      'Na stránce Hráči najdeš pozvání uživatele i pozvací odkaz.',
  },
  'stranky-nova': {
    route: '/svet/:worldSlug/stranky',
    fallbackText:
      'Novou stránku založíš tlačítkem nahoře v Encyklopedii; Hráč navrhuje přes „+ Navrhnout".',
  },
  'dashboard-join': {
    route: '/svet/:worldSlug',
    fallbackText:
      'Tlačítko pro vstup najdeš na dashboardu světa — podoba záleží na režimu přístupu.',
  },
  'postavy-nova': {
    route: '/svet/:worldSlug/postavy',
    fallbackText: 'Postavu zakládá PJ tlačítkem Nová postava v adresáři Postav.',
  },
  'pavucina-novy-subjekt': {
    route: '/svet/:worldSlug/pavucina',
    fallbackText: 'Subjekt přidáš tlačítkem přímo v Pavučině.',
  },
  'vesmiry-katalog': {
    route: '/ikaros/vesmiry',
    fallbackText: 'Katalog světů procházej kartami — filtr je nahoře.',
  },
} as const satisfies Record<string, Kotva>;

export type AnchorId = keyof typeof KOTVY;
