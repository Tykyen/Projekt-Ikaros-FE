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

export interface HideableNavItem {
  id: string;
  label: string;
  group: 'svet' | 'hra' | 'top';
  /** Krátký popis pro Settings UI. */
  hint?: string;
}

export const HIDEABLE_NAV_ITEMS: readonly HideableNavItem[] = [
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
