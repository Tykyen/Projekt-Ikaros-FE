import { useEffect, type RefObject } from 'react';
import { usePagesDirectory } from '../../api/usePagesDirectory';
import type { PageType } from '../../api/pages.types';

/**
 * F5 krok 2 (migrace) — auto-link zmínek entit v prostém textu obsahu.
 *
 * Migrovaný obsah zmiňuje názvy existujících stránek (státy, postavy, události,
 * organizace) jako prostý text, ale autoři je nezalinkovali. Hook po renderu
 * projde DOM text nodes (mimo existující `<a>`) a 1. výskyt názvu entity obalí
 * do world-scoped `<a data-autolink>`. Nav chování (SPA navigace) dodá
 * `useBrokenLinks`, který běží na stejném containeru — auto-link `<a>` je už
 * world-scoped, takže ho vezme jako validní a přidá click→navigate.
 *
 * BEZPEČNOST proti šumu: linkují se jen VLASTNÍ JMÉNA (filtr `isCandidate`) —
 * víceslovné názvy vždy, jednoslovné jen ≥5 znaků a mimo `BLACKLIST` obecných
 * slov. Bez toho by se linkovala běžná slova („Nebo" = spojka, „Technologie").
 * Bez skloňování (v1 jen 1. pád). Case-sensitive (vlastní jména jsou velká).
 *
 * Async render obsahu (TipTap) + Back přes bfcache → MutationObserver + pageshow
 * (stejný vzor jako useBrokenLinks). Idempotentní: text uvnitř `<a>` se
 * přeskakuje, každá entita se linkuje max 1× (`linkedSlugs`).
 */

const ENTITY_TYPES = new Set<PageType>(['Lokace', 'Ostatní', 'Postava hráče', 'NPC']);

/** Obecná CZ slova — jednoslovný title se sem nesmí trefit (jinak linkuje běžná slova). */
const BLACKLIST = new Set([
  'nebo', 'technologie', 'ochrana', 'duše', 'zbraně', 'planety', 'pravidla',
  'identifikace', 'matrix', 'náboje', 'brokovnice', 'závoj', 'most', 'voda',
  'rada', 'cíl', 'síla', 'právo', 'teorie', 'magie', 'smrt', 'život', 'čas',
  'svět', 'země', 'město', 'stát', 'muž', 'žena', 'dítě', 'škola', 'rodina',
  'armáda', 'vláda', 'bůh', 'král', 'válka', 'mír', 'láska', 'naděje', 'osud',
  'moc', 'krev', 'oheň', 'vzduch', 'sektor', 'oddíl', 'jednotka', 'základna',
  'centrum', 'systém', 'projekt', 'operace', 'mise', 'plán', 'data', 'úroveň',
]);

function isCandidate(title: string, type: PageType): boolean {
  if (!ENTITY_TYPES.has(type)) return false;
  const t = title.trim();
  if (!t) return false;
  if (t.split(/\s+/).length >= 2) return true; // víceslovné = specifické
  return t.length >= 5 && !BLACKLIST.has(t.toLowerCase());
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function useAutoLink(
  containerRef: RefObject<HTMLElement | null>,
  worldId: string,
  worldSlug: string,
  currentSlug: string,
  revision: unknown,
): void {
  const { data: directory = [] } = usePagesDirectory(worldId);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (directory.length === 0) return;

    // Kandidáti (ne self), seřazení délkou desc → „New York" se matchne před „York".
    const entities = directory
      .filter((d) => d.slug !== currentSlug && isCandidate(d.title, d.type))
      .sort((a, b) => b.title.length - a.title.length);
    if (entities.length === 0) return;

    const titleToSlug = new Map<string, string>();
    for (const e of entities) if (!titleToSlug.has(e.title)) titleToSlug.set(e.title, e.slug);

    // Jeden regex (alternace názvů), celé slovo přes unicode hranice, case-sensitive.
    const alt = [...titleToSlug.keys()].map(escapeRegExp).join('|');
    const re = new RegExp('(?<![\\p{L}\\p{N}])(' + alt + ')(?![\\p{L}\\p{N}])', 'gu');

    // 1. výskyt každé entity na celé stránce (napříč text nody).
    const linkedSlugs = new Set<string>();

    const processTextNode = (node: Text): void => {
      const text = node.nodeValue ?? '';
      if (text.length < 4) return;
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      let last = 0;
      let changed = false;
      const frag = document.createDocumentFragment();
      while ((m = re.exec(text)) !== null) {
        const label = m[1];
        const slug = titleToSlug.get(label);
        if (!slug || linkedSlugs.has(slug)) continue; // neznámý / už zalinkovaný
        linkedSlugs.add(slug);
        changed = true;
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const a = document.createElement('a');
        a.setAttribute('href', `/svet/${worldSlug}/${slug}`);
        a.dataset.autolink = '1';
        a.textContent = label;
        frag.appendChild(a);
        last = m.index + label.length;
      }
      if (!changed) return;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode?.replaceChild(frag, node);
    };

    const processAll = (): void => {
      // Text nodes mimo jakýkoli <a> (existující i auto-link).
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          let el = node.parentElement;
          while (el && el !== container) {
            if (el.tagName === 'A') return NodeFilter.FILTER_REJECT;
            el = el.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes: Text[] = [];
      let n: Node | null;
      while ((n = walker.nextNode()) !== null) nodes.push(n as Text);
      nodes.forEach(processTextNode);
    };

    processAll();
    const observer = new MutationObserver(() => processAll());
    observer.observe(container, { childList: true, subtree: true });
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) processAll();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      observer.disconnect();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [containerRef, directory, worldSlug, currentSlug, revision]);
}
