import type { Page, AkjTab, PageTable } from '../../api/pages.types';

/** Override text se uplatní jen když fakticky obsahuje text (ne prázdný `<p></p>`). */
function hasHtmlContent(html?: string): boolean {
  return !!html && html.replace(/<[^>]*>/g, '').trim() !== '';
}

/** Override tabulka se uplatní jen když má aspoň jednu neprázdnou buňku. */
function tableHasContent(t?: PageTable): boolean {
  if (!t) return false;
  const cells = [...(t.headers ?? []), ...(t.values ?? [])];
  return cells.some((c) => c?.trim());
}

/**
 * AKJ chráněná záložka dědí obsah ze základní stránky; `contentOverride` je
 * sparse — vyplněné pole (obrázek/content/„boxy"=table) přepíše základ, prázdné
 * dědí. Sekce se dědí vždy ze základu. Vrátí „efektivní Page" pro render přes
 * `OstatniLayout`.
 *
 * `accessRequirements` efektivní stránky = `tab.access`, aby vnitřní `AkjBanner`
 * ukázal úroveň té záložky (ne základní stránky). `akjTabs` se nuluje, ať se
 * záložky nevnořují.
 */
export function resolveAkjTabPage(basicPage: Page, tab: AkjTab): Page {
  const co = tab.contentOverride;
  return {
    ...basicPage,
    // Dědí, když je override pole bezobsažné (ne jen undefined) — prázdná
    // tabulka / prázdný text / smazaný obrázek nesmí přepsat zdroj prázdnem.
    imageUrl: co?.imageUrl?.trim() ? co.imageUrl : basicPage.imageUrl,
    content: hasHtmlContent(co?.content) ? co!.content : basicPage.content,
    table: tableHasContent(co?.table) ? co!.table : basicPage.table,
    accessRequirements: tab.access,
    akjTabs: undefined,
  };
}

/** AKJ záložky seřazené dle `order` (stabilní kopie). */
export function sortedAkjTabs(page: Page): AkjTab[] {
  return (page.akjTabs ?? []).slice().sort((a, b) => a.order - b.order);
}
