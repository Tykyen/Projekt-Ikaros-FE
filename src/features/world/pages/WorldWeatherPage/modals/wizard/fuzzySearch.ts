/**
 * 9.4-I — Jednoduchá fuzzy substring search (case-insensitive).
 *
 * Žádná externí závislost — projekt nemá fuse.js. Score model:
 *  - exact substring v `searchCorpus` → +100
 *  - každý term jako word-start match → bonus
 *  - díky pozici v korpusu (start = vyšší score)
 *  - prázdný query → vrátí všechny presety v původním pořadí
 *
 * Sort: descending score, tie-break přes `sortKey`.
 */
import type { PresetItem } from './types';

export interface ScoredItem {
  item: PresetItem;
  score: number;
}

export function fuzzyFilter(
  items: ReadonlyArray<PresetItem>,
  query: string,
): PresetItem[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return items.slice();

  const terms = q.split(/\s+/).filter(Boolean);
  const scored: ScoredItem[] = [];

  for (const item of items) {
    const score = scoreItem(item, terms);
    if (score > 0) scored.push({ item, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.sortKey.localeCompare(b.item.sortKey);
  });

  return scored.map((s) => s.item);
}

function scoreItem(item: PresetItem, terms: string[]): number {
  const corpus = item.searchCorpus;
  const name = item.displayName.toLowerCase();
  let total = 0;

  for (const term of terms) {
    let termScore = 0;
    const idx = corpus.indexOf(term);
    if (idx < 0) return 0; // všechny termy musí match

    // Base substring hit
    termScore += 50;

    // Position bonus — match na začátku korpusu výš
    if (idx === 0) termScore += 30;
    else if (idx < 8) termScore += 15;

    // Word-start bonus — match na začátku slova
    if (idx === 0 || /\s/.test(corpus[idx - 1] ?? '')) termScore += 20;

    // Display-name match bonus (proti subtitle/description)
    if (name.includes(term)) termScore += 25;

    // Length proximity — kratší korpus = preciznější match
    if (term.length >= 4) termScore += 5;

    total += termScore;
  }

  return total;
}
