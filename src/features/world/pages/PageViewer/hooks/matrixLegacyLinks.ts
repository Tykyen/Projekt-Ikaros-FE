/**
 * Migrační shim pro svět `matrix` (Matrix → Ikaros).
 *
 * Starý jednosvětový Matrix měl část odkazů uloženou jako **absolutní URL na
 * vlastní web** (`https://www.projekt-ikaros.com/<slug>`) — autoři kopírovali
 * celou adresu z prohlížeče. V Ikaru je to cizí doména → odkaz by otevřel
 * (brzy vypnutý) starý web místo migrované stránky. Navíc se část slugů při
 * migraci přejmenovala (přezdívka → kanonický slug, F5 krok 1b); absolutní
 * formu tehdejší data-fix minul.
 *
 * Tenhle modul drží obě Matrix-specifická pravidla izolovaně, aby generický
 * `useBrokenLinks` zůstal světově neutrální. **Po vypnutí `projekt-ikaros.com`
 * a doplnění propadlých stránek lze celý soubor smazat.**
 *
 * Spec: `docs/arch/migration-matrix/f5-links.md` (krok 3).
 */
import AKJ_OWNERS from './matrixAkjOwners';

/** Slug světa, na který se migrační pravidla vztahují. */
const LEGACY_WORLD_SLUG = 'matrix';

/** Absolutní odkaz na starý web → zachytí cílovou cestu za doménou. */
const LEGACY_DOMAIN_RE = /^https?:\/\/(?:www\.)?projekt-ikaros\.com\/(.+)$/i;

/**
 * Přejmenované slugy (F5 krok 1b, `migration/f5-links.json`): starý slug
 * v obsahu → kanonický slug živé stránky. Data-fix opravil holé slugy,
 * absolutní formu na starý web ne → doháníme runtime.
 */
const LEGACY_SLUG_REMAP: Record<string, string> = {
  'abigail-wattson': 'abi',
  'gabriel-patrik-dodwell': 'medak',
  'myra-rosier': 'myra',
  'neville-mousesack': 'neville',
  'zara-hawke': 'zara',
  'archibald-of-lindsay': 'archie',
  'sion-edwards': 'sion',
  'kuro-noir': 'kuro',
  'cael-aurion': 'cael',
  'lotri-spielmann': 'lo3',
  katerina: 'katerina-penkavova',
  julieta: 'julieta-madregal',
  pvh: 'pvh-corp',
  njamm: 'njamm-corporation',
};

/** Vztahují se na tenhle svět migrační pravidla starého Matrixu? */
export function isLegacyWorld(worldSlug: string): boolean {
  return worldSlug === LEGACY_WORLD_SLUG;
}

/**
 * A1: absolutní odkaz na starý web → root-relativní `/<slug>` (dál ho zpracuje
 * běžná interní větev hooku). Ostatní hrefy vrací beze změny.
 */
export function stripLegacyDomain(href: string): string {
  const m = href.match(LEGACY_DOMAIN_RE);
  return m ? `/${m[1]}` : href;
}

/**
 * A2 + A3: přemapuje migrační slug na živý cíl (jinak vrací vstup beze změny):
 * - **A2** přejmenované slugy (přezdívky, `LEGACY_SLUG_REMAP`),
 * - **A3** staré AKJ slugy → vlastník záložky (`AKJ_OWNERS`, `staty-x` styl
 *   odkazů na info, které dnes žije jako AKJ záložka cílové stránky).
 */
export function remapLegacySlug(slug: string): string {
  return LEGACY_SLUG_REMAP[slug] ?? AKJ_OWNERS[slug] ?? slug;
}
