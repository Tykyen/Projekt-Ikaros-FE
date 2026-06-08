import { useEffect, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePagesDirectory } from '../../api/usePagesDirectory';

/**
 * 7.1d — Broken-link detekce + F5 (migrace) world-scope rewrite.
 *
 * Po renderu projde všechny `<a href>` v containeru (typicky TipTap obsah) a
 * podle slug indexu světa rozdělí interní odkazy do 2 stavů:
 *   - **validní** (slug existuje) → přepíše `href` na world-scoped
 *     `/svet/<worldSlug>/<slug>`, zruší `target="_blank"`/`rel`, klik pošle
 *     přes SPA `navigate()`. Řeší staré Matrix odkazy (holý slug / `/slug`),
 *     které jednosvětový systém ukládal bez world prefixu → jinak 404.
 *   - **rozbitý** (slug neexistuje) → `.brokenLink` class + blokace kliku.
 *
 * Spouští se znovu při změně obsahu nebo dat directory (collapsed sekce
 * mohou expandovat po user actionu — proto deps zahrnují i `revision`).
 *
 * Detekuje 3 tvary interních linků:
 *   1. `/svet/<worldSlug>/<slug>` — absolutní cesta z URL
 *   2. `/<slug>` — relativní k current světu
 *   3. `<slug>` — holý slug (RichTextEditor TipTap link extension / migrace)
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

type ManagedAnchor = HTMLAnchorElement & {
  __brokenHandler?: (e: Event) => void;
  __navHandler?: (e: Event) => void;
};

/** Odváže broken-handler (preventDefault) z anchoru, pokud byl navázán. */
function unbindBroken(a: ManagedAnchor): void {
  if (a.dataset.brokenBound && a.__brokenHandler) {
    a.removeEventListener('click', a.__brokenHandler);
    delete a.dataset.brokenBound;
    delete a.__brokenHandler;
  }
}

/** Odváže nav-handler (SPA navigace) z anchoru, pokud byl navázán. */
function unbindNav(a: ManagedAnchor): void {
  if (a.dataset.navBound && a.__navHandler) {
    a.removeEventListener('click', a.__navHandler);
    delete a.dataset.navBound;
    delete a.__navHandler;
  }
}

export function useBrokenLinks(
  containerRef: RefObject<HTMLElement | null>,
  worldId: string,
  worldSlug: string,
  revision: unknown,
): void {
  const { data: directory = [] } = usePagesDirectory(worldId);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;
    if (directory.length === 0) return;

    const slugSet = new Set(directory.map((d) => d.slug));
    const links = containerRef.current.querySelectorAll('a[href]');
    const worldPrefix = `/svet/${worldSlug}/`;

    links.forEach((linkEl) => {
      const href = linkEl.getAttribute('href') ?? '';
      if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;

      // Odkaz na samotnou úvodní stránku světa — navigace, neověřujeme.
      if (href === `/svet/${worldSlug}` || href === worldPrefix) return;

      // Raw cíl podle 3 podporovaných tvarů.
      let raw: string;
      if (href.startsWith(worldPrefix)) raw = href.slice(worldPrefix.length);
      else if (href.startsWith('/')) raw = href.slice(1);
      else raw = href;

      // Oddělit slug od ?query / #hash (kotvy na nadpisy se musí zachovat).
      const m = raw.match(/^([^?#]*)([?#].*)?$/);
      const target = m?.[1] ?? '';
      const suffix = m?.[2] ?? '';

      if (!target) return;
      // Vícesegmentové cesty (admin/stranky, postava/abc, …) jsou navigační
      // routy, ne wikilinky. Skip.
      if (target.includes('/')) return;
      // Rezervované world routy (stranky, hraci, chat, …) — taky navigace.
      if (WORLD_RESERVED.has(target)) return;

      const anchor = linkEl as ManagedAnchor;

      if (slugSet.has(target)) {
        // ── F5: interní validní → world-scoped href + SPA navigace ──
        anchor.classList.remove('brokenLink');
        unbindBroken(anchor);

        // Přepiš href na world-scoped tvar (idempotentní) a sjednoť cíl
        // do stejného okna — `target="_blank"` z extensions otevíral kartu
        // na holém `/svedsko` → 404.
        anchor.setAttribute('href', `${worldPrefix}${target}${suffix}`);
        anchor.removeAttribute('target');
        anchor.removeAttribute('rel');

        if (!anchor.dataset.navBound) {
          anchor.dataset.navBound = '1';
          // Handler čte aktuální href při kliku (ne ze closure) → naváže se
          // jen jednou a přežije změnu světa i přepočet directory.
          anchor.__navHandler = (e: Event) => {
            const me = e as MouseEvent;
            // Ctrl/Cmd/Shift/prostřední tlačítko → nech browseru (nová karta).
            if (me.metaKey || me.ctrlKey || me.shiftKey || me.button === 1) return;
            e.preventDefault();
            const dest = anchor.getAttribute('href');
            if (dest) navigate(dest);
          };
          anchor.addEventListener('click', anchor.__navHandler);
        }
      } else {
        // ── interní rozbitý → broken (beze změny chování) ──
        anchor.classList.add('brokenLink');
        unbindNav(anchor);
        // Bez native `title` atributu — způsoboval, že browser tooltip
        // přesahoval viewport, dočasně vyvolával horizontální scrollbar
        // a layout sidebaru se cukal. Vizuální cue (červená + dotted
        // underline) stačí.
        anchor.removeAttribute('title');
        // Blokace kliku — jinak browser zkusí navigovat na relativní href
        // (např. `londyn`), React Router skočí na 404 a layout se zacuká.
        // Idempotent přes dataset flag, ať se handler nezakládá vícekrát.
        if (!anchor.dataset.brokenBound) {
          anchor.dataset.brokenBound = '1';
          anchor.__brokenHandler = (e: Event) => e.preventDefault();
          anchor.addEventListener('click', anchor.__brokenHandler);
        }
      }
    });
  }, [containerRef, directory, worldSlug, revision, navigate]);
}
