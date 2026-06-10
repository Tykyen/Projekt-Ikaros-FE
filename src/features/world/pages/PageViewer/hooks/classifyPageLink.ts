import {
  isLegacyWorld,
  remapLegacySlug,
  stripLegacyDomain,
} from './matrixLegacyLinks';

/**
 * Sdílená klasifikace odkazu v obsahu stránky (7.2m).
 *
 * Vyčleněno z `useBrokenLinks`, aby ji mohl použít i editor (TipTap decoration
 * plugin) — read mode i editor tak klasifikují stejný `href` identicky a
 * propadlé odkazy svítí červeně na obou místech bez driftu.
 *
 * Funkce je čistá (žádný DOM/React). Z `href` + slug indexu světa vrací jeden
 * ze 3 stavů:
 *   - `internal` — odkaz na **existující** stránku světa (+ kanonický `target`
 *     a zachovaný `?query`/`#hash` `suffix`); read mode ho přepíše na
 *     world-scoped href a navěsí SPA navigaci.
 *   - `broken`   — interní odkaz na **neexistující** slug; read mode přidá
 *     `.brokenLink` + blokuje klik, editor ho zvýrazní červeně.
 *   - `ignore`   — externí (`https://`, `mailto:`…), navigační routy
 *     (`stranky`, `chat`…) i úvodní strana světa; nech beze změny.
 *
 * Detekuje 3 tvary interních linků (viz `useBrokenLinks`): world-scoped cesta,
 * root-relativní `/slug` a holý `slug` (TipTap link / migrace). Pro svět
 * `matrix` aplikuje legacy shim (strip domény starého webu + remap
 * přejmenovaných/AKJ slugů) — `matrixLegacyLinks`.
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

export type PageLinkClass =
  | { kind: 'internal'; target: string; suffix: string }
  | { kind: 'broken' }
  | { kind: 'ignore' };

export interface ClassifyOpts {
  /** Slug index světa (z `usePagesDirectory`). */
  slugSet: Set<string>;
  /** Slug aktuálního světa (řídí world-prefix i legacy shim). */
  worldSlug: string;
}

export function classifyPageLink(
  rawHref: string,
  { slugSet, worldSlug }: ClassifyOpts,
): PageLinkClass {
  const worldPrefix = `/svet/${worldSlug}/`;
  const legacy = isLegacyWorld(worldSlug);

  // A1: `https://www.projekt-ikaros.com/<slug>` → `/<slug>`, aby odkaz spadl do
  // interní větve (jinak by ho external-guard níž propustil ven na starý web).
  const href = legacy ? stripLegacyDomain(rawHref) : rawHref;
  if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return { kind: 'ignore' };

  // Úvodní strana světa — navigace, neověřujeme.
  if (href === `/svet/${worldSlug}` || href === worldPrefix) return { kind: 'ignore' };

  // Raw cíl podle 3 podporovaných tvarů.
  let raw: string;
  if (href.startsWith(worldPrefix)) raw = href.slice(worldPrefix.length);
  else if (href.startsWith('/')) raw = href.slice(1);
  else raw = href;

  // Oddělit slug od ?query / #hash (kotvy na nadpisy se musí zachovat).
  const m = raw.match(/^([^?#]*)([?#].*)?$/);
  const rawTarget = m?.[1] ?? '';
  const suffix = m?.[2] ?? '';

  if (!rawTarget) return { kind: 'ignore' };
  // Vícesegmentové cesty (admin/stranky, postava/abc, …) = navigační routy.
  if (rawTarget.includes('/')) return { kind: 'ignore' };
  // Rezervované world routy (stranky, hraci, chat, …) — taky navigace.
  if (WORLD_RESERVED.has(rawTarget)) return { kind: 'ignore' };

  // A2/A3: přejmenovaný slug / AKJ vlastník → cílíme na živou stránku.
  const target = legacy ? remapLegacySlug(rawTarget) : rawTarget;

  return slugSet.has(target)
    ? { kind: 'internal', target, suffix }
    : { kind: 'broken' };
}
