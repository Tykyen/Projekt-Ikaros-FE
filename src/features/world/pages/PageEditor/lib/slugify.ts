/**
 * 7.2 — Cs-friendly slugify. NFD diacritic fold → lowercase → space+nonalnum → dash → trim.
 *
 * Příklad:
 *   slugify("Tajemství kruhu — Lhůtě")  // → "tajemstvi-kruhu-lhute"
 *   slugify("Veřejné #42")             // → "verejne-42"
 *   slugify("   ")                      // → ""
 *
 * Pro AKJ key fallback: pokud výsledek je prázdný, používáme `akj-<random4>`.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 7.2 — Helper pro AKJ a další generované klíče. Pokud `slugify(input)` je
 * prázdné (vstup byl jen diakritika/specials), použijeme prefix + náhodný suffix.
 */
export function slugifyWithFallback(input: string, prefix = 'item'): string {
  const slug = slugify(input);
  if (slug) return slug;
  return `${prefix}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 7.2 — Najde first-free variantu slugu vzhledem k existujícímu seznamu.
 * Použito pro AKJ key collision (`akj-vyzva`, `akj-vyzva-2`, `akj-vyzva-3`).
 */
export function uniqueSlug(base: string, existing: Set<string> | string[]): string {
  const set = existing instanceof Set ? existing : new Set(existing);
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
