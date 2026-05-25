import { useEffect, type RefObject } from 'react';
import { usePagesDirectory } from '../../api/usePagesDirectory';

/**
 * 7.1d — Broken-link detekce. Po renderu projde všechny `<a href>` v containeru
 * (typicky TipTap obsah), porovná interní linky vůči slug indexu světa a
 * přidá `.brokenLink` class na ty, které neexistují.
 *
 * Spouští se znovu při změně obsahu nebo dat directory (collapsed sekce
 * mohou expandovat po user actionu — proto deps zahrnují i `revision`).
 *
 * Detekuje 3 tvary interních linků:
 *   1. `/svet/<worldSlug>/<slug>` — absolutní cesta z URL
 *   2. `/<slug>` — relativní k current světu
 *   3. `<slug>` — holý slug (RichTextEditor TipTap link extension)
 *
 * Skipuje navigační routy (breadcrumb, nav menu) — viz `WORLD_RESERVED` /
 * vícesegmentové targety. Bez toho hook křičel „neexistuje" i na `Stránky`
 * nebo `Matrix` v breadcrumbu.
 */

/** Reserved world-level slugy = routy, ne page slugy. */
const WORLD_RESERVED = new Set([
  'stranky',
  'postavy',
  'postava',
  'hraci',
  'chat',
  'nastaveni',
  'moje-postava',
  'admin',
  'pravidla',
  'mapa',
  'timeline',
  'kalendar',
  'pocasi',
  'events',
  'pavucina',
  'obchod',
  'zvuky',
  'meny',
  'skupiny',
]);

export function useBrokenLinks(
  containerRef: RefObject<HTMLElement | null>,
  worldId: string,
  worldSlug: string,
  revision: unknown,
): void {
  const { data: directory = [] } = usePagesDirectory(worldId);

  useEffect(() => {
    if (!containerRef.current) return;
    if (directory.length === 0) return;

    const slugSet = new Set(directory.map((d) => d.slug));
    const links = containerRef.current.querySelectorAll('a[href]');

    links.forEach((linkEl) => {
      const href = linkEl.getAttribute('href') ?? '';
      if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;

      // Extract target slug for 3 supported patterns
      let target: string | null;
      const worldPrefix = `/svet/${worldSlug}/`;
      if (href === `/svet/${worldSlug}` || href === worldPrefix) {
        // Odkaz na samotnou úvodní stránku světa — navigace, neověřujeme.
        return;
      }
      if (href.startsWith(worldPrefix)) {
        target = href.slice(worldPrefix.length).split(/[?#]/)[0];
      } else if (href.startsWith('/')) {
        target = href.slice(1).split(/[?#]/)[0];
      } else {
        target = href.split(/[?#]/)[0];
      }

      if (!target) return;
      // Vícesegmentové cesty (admin/stranky, postava/abc, …) jsou navigační
      // routy, ne wikilinky. Skip.
      if (target.includes('/')) return;
      // Rezervované world routy (stranky, hraci, chat, …) — taky navigace.
      if (WORLD_RESERVED.has(target)) return;

      if (!slugSet.has(target)) {
        linkEl.classList.add('brokenLink');
        // Bez native `title` atributu — způsoboval, že browser tooltip
        // přesahoval viewport, dočasně vyvolával horizontální scrollbar
        // a layout sidebaru se cukal. Vizuální cue (červená + dotted
        // underline) stačí. Custom CSS tooltip vázaný na parent přijde
        // jako follow-up, pokud bude potřeba.
        linkEl.removeAttribute('title');
        // Blokace kliku — jinak browser zkusí navigovat na relativní href
        // (např. `londyn`), React Router skočí na 404 a layout se zacuká.
        // Idempotent přes dataset flag, ať se handler nezakládá vícekrát.
        const anchor = linkEl as HTMLAnchorElement & {
          __brokenHandler?: (e: Event) => void;
        };
        if (!anchor.dataset.brokenBound) {
          anchor.dataset.brokenBound = '1';
          anchor.__brokenHandler = (e: Event) => e.preventDefault();
          anchor.addEventListener('click', anchor.__brokenHandler);
        }
      } else {
        linkEl.classList.remove('brokenLink');
        const anchor = linkEl as HTMLAnchorElement & {
          __brokenHandler?: (e: Event) => void;
        };
        if (anchor.dataset.brokenBound && anchor.__brokenHandler) {
          anchor.removeEventListener('click', anchor.__brokenHandler);
          delete anchor.dataset.brokenBound;
          delete anchor.__brokenHandler;
        }
      }
    });
  }, [containerRef, directory, worldSlug, revision]);
}
