/**
 * 9.3-followup — definice toho, které top-nav položky lze v `WorldSettings`
 * vypnout. Esenciální (Přehled, Stránky, Novinky, Pravidla) sem nepatří —
 * jsou vždy viditelné (Q1=A 2026-05-25).
 *
 * `id` = identifier ukládaný do `WorldSettings.hiddenNavItems[]`.
 *
 * SSOT pro:
 *  - filtrování v `WorldLayout` (buildNav)
 *  - checkbox seznam v `NavVisibilityTab`
 */

import type { HeadlineNode } from '@/shared/types';
import {
  headlineToNavGroups,
  type NavNode,
} from './headlineNav';
import { buildGroupNavEntries } from './groupMembers';

export interface HideableNavItem {
  id: string;
  label: string;
  group: 'informace' | 'svet' | 'hra' | 'top';
  /** Krátký popis pro Settings UI. */
  hint?: string;
}

export const HIDEABLE_NAV_ITEMS: readonly HideableNavItem[] = [
  // Skupina „Informace" — referenční stránky seedované při tvorbě světa
  // (BE pages-world-seed). Default viditelné, PJ je může z menu odebrat.
  {
    id: 'magicky-system',
    label: 'Magický systém',
    group: 'informace',
    hint: 'Seedovaná wiki stránka o magii světa (lze skrýt i vyplnit).',
  },
  {
    id: 'technologie',
    label: 'Technologie',
    group: 'informace',
    hint: 'Seedovaná wiki stránka o technologiích světa (lze skrýt i vyplnit).',
  },
  // Skupina „Svět"
  {
    id: 'timeline',
    label: 'Časová osa',
    group: 'svet',
    hint: 'Vertikální historická osa světa (9.3).',
  },
  {
    id: 'mapa',
    label: 'Mapa vesmíru',
    group: 'svet',
    hint: '3D mapa lokací (fáze 10.1).',
  },
  {
    id: 'pavucina',
    label: 'Pavučina',
    group: 'svet',
    hint: 'Graf vztahů postav (fáze 11.1).',
  },
  {
    id: 'obchod',
    label: 'Obchod',
    group: 'svet',
    hint: 'Obchod světa (fáze 11.3).',
  },
  // Skupina „Hra"
  {
    id: 'takticka-mapa',
    label: 'Taktická mapa',
    group: 'hra',
    hint: '2D hex grid pro souboj (fáze 10.2).',
  },
  {
    id: 'bestiar',
    label: 'Bestiář',
    group: 'hra',
    hint: 'Knihovna statbloků (bestií) pro spawn na mapu.',
  },
  {
    id: 'scenare',
    label: 'Storyboard',
    group: 'hra',
    hint: 'Scénáře a příběhy (fáze 11.2).',
  },
  {
    id: 'pocasi',
    label: 'Generátor počasí',
    group: 'hra',
    hint: 'Počasí podle kalendáře (fáze 9.4).',
  },
  {
    id: 'prevodnik-men',
    label: 'Převodník měn',
    group: 'hra',
    hint: 'Konverze mezi měnami (fáze 11.4).',
  },
  {
    id: 'zvuky',
    label: 'Zvuková databáze',
    group: 'hra',
    hint: 'Knihovna zvuků (fáze 13.3).',
  },
  {
    id: 'dungeon-builder',
    label: 'Tvorba podzemí',
    group: 'hra',
    hint: 'Externí editor (globální /admin/dungeon-builder).',
  },
  // Top-level
  {
    id: 'kalendar',
    label: 'Kalendář',
    group: 'top',
    hint: 'Sjednocený kalendář akcí + postav (9.2d).',
  },
];

export const HIDEABLE_NAV_IDS: ReadonlySet<string> = new Set(
  HIDEABLE_NAV_ITEMS.map((i) => i.id),
);

/**
 * 9.3-followup — Test, zda je daný nav item (podle `id`) skryt v `hiddenNavItems`.
 * Esenciální položky (id mimo `HIDEABLE_NAV_IDS`) jsou vždy viditelné, i kdyby
 * je někdo do hiddenNavItems vsunul (defense-in-depth).
 */
export function isNavItemHidden(
  id: string | undefined,
  hiddenNavItems: readonly string[] | undefined,
): boolean {
  if (!id) return false;
  if (!HIDEABLE_NAV_IDS.has(id)) return false; // esenciál nelze skrýt
  return !!hiddenNavItems?.includes(id);
}

/* ── Systémová navigace světa (SSOT pro WorldLayout i náhled v 12.2) ── */

/**
 * Sestaví systémovou horní nav světa. `id` na položkách = klíč pro
 * `hiddenNavItems` filtr; esenciály (Stránky) `id` nemají — skrýt je nelze.
 * PJ-only položky (Deník PJ, Storyboard) jen pro `isPJ`.
 *
 * 12.3 — „Informace" obsahuje podseznam skupin (z `groups` = `customGroups`) +
 * Nezařazení + Pravidla. Přehled je přes název světa, Novinky/Akce na úvodní
 * stránce (spec 12.3 R1/R2).
 */
export function buildWorldNav(
  worldSlug: string,
  isPJ: boolean,
  groups: readonly string[] = [],
): NavNode[] {
  const b = `/svet/${worldSlug}`;
  return [
    {
      label: 'Informace',
      items: [
        {
          // 12.3 — rozbalovací „Skupiny" → jednotlivé skupiny + Nezařazení.
          label: 'Skupiny',
          children: buildGroupNavEntries(groups).map((g) => ({
            label: g.label,
            to: `${b}/skupina/${g.key}`,
          })),
        },
        { label: 'Pravidla', to: `${b}/pravidla` },
        // Referenční stránky seedované při tvorbě světa — k ruce hráčům.
        // Mají `id` → skrývatelné v Nastavení (HIDEABLE_NAV_ITEMS „informace").
        {
          id: 'magicky-system',
          label: 'Magický systém',
          to: `${b}/magicky-system`,
        },
        { id: 'technologie', label: 'Technologie', to: `${b}/technologie` },
      ],
    },
    {
      label: 'Svět',
      items: [
        { label: 'Stránky', to: `${b}/stranky` },
        { id: 'timeline', label: 'Časová osa', to: `${b}/timeline` },
        { id: 'mapa', label: 'Mapa vesmíru', to: `${b}/mapa` },
        { id: 'pavucina', label: 'Pavučina', to: `${b}/pavucina` },
        { id: 'obchod', label: 'Obchod', to: `${b}/obchod` },
      ],
    },
    {
      label: 'Hra',
      items: [
        { id: 'takticka-mapa', label: 'Taktická mapa', to: `${b}/takticka-mapa` },
        ...(isPJ
          ? [{ id: 'denik-pj', label: 'Deník PJ', to: `${b}/denik-pj` }]
          : []),
        { id: 'bestiar', label: 'Bestiář', to: `${b}/bestiar` },
        ...(isPJ
          ? [{ id: 'scenare', label: 'Storyboard', to: `${b}/scenare` }]
          : []),
        { id: 'pocasi', label: 'Generátor počasí', to: `${b}/pocasi` },
        { id: 'prevodnik-men', label: 'Převodník měn', to: `${b}/prevodnik-men` },
        { id: 'zvuky', label: 'Zvuková databáze', to: `${b}/zvuky` },
        {
          id: 'dungeon-builder',
          label: 'Tvorba podzemí',
          to: `/admin/dungeon-builder`,
          external: true,
        },
      ],
    },
    { id: 'kalendar', label: 'Kalendář', to: `${b}/kalendar` },
  ];
}

/**
 * Odfiltruje skryté položky podle `hiddenNavItems`. Skupina s prázdnými `items`
 * po filtru se vyřadí (skryje celý dropdown). Esenciály (bez `id`) projdou vždy.
 */
export function filterNavByHidden(
  nav: readonly NavNode[],
  hiddenNavItems: readonly string[] | undefined,
): NavNode[] {
  const out: NavNode[] = [];
  for (const group of nav) {
    if (group.items) {
      const items = group.items.filter(
        (item) => !isNavItemHidden(item.id, hiddenNavItems),
      );
      if (items.length > 0) out.push({ label: group.label, items });
    } else if (!isNavItemHidden(group.id, hiddenNavItems)) {
      out.push(group);
    }
  }
  return out;
}

/**
 * Plná nav světa = systémová (po skrytí) + vlastní navigace (aditivně za ní).
 * Jediný vstup pro `WorldLayout` i náhled v 12.2.
 */
export function buildFullWorldNav(
  worldSlug: string,
  isPJ: boolean,
  hiddenNavItems: readonly string[] | undefined,
  customHeadline: readonly HeadlineNode[] | undefined,
  groups: readonly string[] = [],
): NavNode[] {
  return [
    ...filterNavByHidden(buildWorldNav(worldSlug, isPJ, groups), hiddenNavItems),
    ...headlineToNavGroups(customHeadline),
  ];
}
