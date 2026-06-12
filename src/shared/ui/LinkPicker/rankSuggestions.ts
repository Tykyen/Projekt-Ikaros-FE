/**
 * Sdílené řazení + filtr návrhů stránek pro všechny pickery odkazů (popover
 * v rail/bubble/buňce/menu i inline dropdown v navigaci světa). Jeden zdroj
 * pravdy → logika hledání se nerozejde mezi kopiemi UI.
 */

/** Minimum potřebné k řazení — `LinkSuggestion` i `PageDirectoryEntry` ho splní. */
export interface RankableItem {
  title: string;
  slug: string;
}

/** Strop zobrazených návrhů; dropdowny scrollují (CSS max-height + overflow). */
export const MAX_SUGGESTIONS = 30;

/** Lowercase + strip diakritiky (NFD) → akcent-insensitivní shoda. */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Relevance skóre (nižší = lepší). Řadí přesnou shodu a shodu na začátku
 * názvu/slova nad shodu „někde uprostřed" → „Magické organizace" vyplave
 * nahoru místo aby se pohřbila mezi desítkami konkrétních položek.
 * `null` = bez shody (vypadne z výsledků).
 */
function score(item: RankableItem, q: string): number | null {
  const title = normalize(item.title);
  if (title === q) return 0;
  if (title.startsWith(q)) return 1;
  if (title.split(/\s+/).some((w) => w.startsWith(q))) return 2;
  if (title.includes(q)) return 3;
  if (normalize(item.slug).includes(q)) return 4;
  return null;
}

/**
 * Vyfiltruje a seřadí položky podle relevance dotazu, ořízne na `max`.
 * Prázdný dotaz → prvních `max` v původním pořadí (adresář je řazený). Sort je
 * stabilní → položky se stejným skóre drží pořadí adresáře.
 */
export function rankPageSuggestions<T extends RankableItem>(
  items: readonly T[],
  query: string,
  max: number = MAX_SUGGESTIONS,
): T[] {
  const q = normalize(query.trim());
  if (!q) return items.slice(0, max);

  return items
    .map((item) => ({ item, sc: score(item, q) }))
    .filter((x): x is { item: T; sc: number } => x.sc !== null)
    .sort((a, b) => a.sc - b.sc)
    .slice(0, max)
    .map((x) => x.item);
}
