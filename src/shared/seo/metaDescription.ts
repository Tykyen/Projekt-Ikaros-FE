import { stripHtml } from '@/shared/ui/news';

/**
 * 15B.2 — TipTap/HTML → plain text meta description.
 * Strip tagů (reuse `stripHtml`) + oříznutí na slovo do `max` znaků (~160 je
 * praktický strop pro Google snippet). Prázdný/chybějící vstup → `undefined`,
 * aby `<Seo>` meta tag vůbec nevykreslil (lepší žádný než prázdný).
 */
export function metaDescription(
  html: string | undefined | null,
  max = 160,
): string | undefined {
  if (!html) return undefined;
  const text = stripHtml(html);
  if (!text) return undefined;
  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  // Ořízni na hranici slova, ale jen když nezůstane neúměrně krátký výsledek.
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return base.trimEnd() + '…';
}
