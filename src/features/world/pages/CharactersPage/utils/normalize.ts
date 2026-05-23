/**
 * 8.3 — Klient-side normalizace pro fulltext hledání v adresáři postav.
 * Lower-case + odstranění diakritiky (NFD → strip combining marks).
 *
 * `'Žluťoučký kůň'` → `'zlutoucky kun'`.
 */
export function normalize(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
