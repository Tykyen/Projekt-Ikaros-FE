/**
 * 7.1j — Jednoduché fuzzy ranking pro Cmd+K palette. Žádná lib (vyhneme se
 * `fuse.js` 4kB), naivní substring score + diacritic-normalize.
 *
 * Score:
 *  • Přesná shoda v začátku title → 1000
 *  • Substring v title (case-insensitive, ignoruje diakritiku) → 500 − pozice
 *  • Všechny znaky query existují v title v pořadí → 100 − gap
 *  • Jinak → 0 (filter out)
 *
 * Vrací jen položky se score > 0, seřazené sestupně.
 */
export interface RankableItem {
  slug: string;
  title: string;
}

export function fuzzyRank<T extends RankableItem>(
  items: T[],
  query: string,
  limit = 8,
): T[] {
  const q = normalize(query.trim().toLowerCase());
  if (q.length === 0) return items.slice(0, limit);

  const scored = items
    .map((item) => ({ item, score: scoreItem(item.title, item.slug, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);

  return scored;
}

function scoreItem(title: string, slug: string, q: string): number {
  const t = normalize(title.toLowerCase());
  const s = normalize(slug.toLowerCase());

  if (t.startsWith(q) || s.startsWith(q)) return 1000;

  const titleIdx = t.indexOf(q);
  if (titleIdx >= 0) return 500 - titleIdx;

  const slugIdx = s.indexOf(q);
  if (slugIdx >= 0) return 400 - slugIdx;

  // sequence-of-chars match
  if (matchesSequence(t, q)) return 100;
  return 0;
}

function matchesSequence(haystack: string, needle: string): boolean {
  let i = 0;
  for (const c of haystack) {
    if (c === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

function normalize(str: string): string {
  // diacritic-fold: "Lhůtě" → "lhute"
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
