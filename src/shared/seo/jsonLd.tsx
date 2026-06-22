import type { Crumb } from '@/shared/ui/Breadcrumbs/Breadcrumbs';
import type { IkarosArticle, IkarosGalleryItem, World } from '@/shared/types';
import { metaDescription } from './metaDescription';

/**
 * 15B.3 — strukturovaná data (schema.org JSON-LD): buildery + render komponenta.
 *
 * Buildery jsou čisté funkce `(entita, origin) → uzel` (žádný DOM → testovatelné).
 * `<JsonLd>` výsledek vykreslí do `<script type="application/ld+json">`.
 *
 * ⚠️ Jeden soubor `.tsx` (ne oddělené `jsonLd.ts` + `JsonLd.tsx`): na
 * case-insensitive FS (Windows) by se basename lišil jen casem a Vite by
 * `import './JsonLd'` resolvoval na `.ts` před `.tsx` → špatný modul.
 *
 * Pravidla dat:
 *  - URL absolutní (origin + path bez query), shodně s canonical z 15B.2.
 *  - Volitelná pole se VYNECHÁVAJÍ (klíč nepřidáme), ne `null`/`""`.
 *  - Buildery volat jen na stránkách v indexu (gate `indexable` na stránce).
 */

export const SITE_NAME = 'Ikaros';
const BRAND_LOGO = '/icons/icon-512.png';
const CONTEXT = 'https://schema.org';

export type JsonLdNode = Record<string, unknown>;

/** Relativní → absolutní (origin + path); absolutní URL projde beze změny. */
export function absoluteUrl(origin: string, url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return origin + (url.startsWith('/') ? url : '/' + url);
}

/** Sdílený uzel vydavatele (Article.publisher, …). */
export function organizationNode(origin: string): JsonLdNode {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: origin || undefined,
    logo: absoluteUrl(origin, BRAND_LOGO),
  };
}

/**
 * 1. `<img src>` z TipTap HTML (články nemají vlastní `coverUrl`). Vrací
 * absolutní URL nebo `undefined`. Reálná ilustrace článku > generické logo.
 */
export function firstImageSrc(
  html: string | undefined | null,
  origin: string,
): string | undefined {
  if (!html) return undefined;
  const m = html.match(/<img[^>]+\bsrc=["']([^"']+)["']/i);
  if (!m) return undefined;
  return absoluteUrl(origin, m[1]);
}

// ─── Article (článek / lore) ─────────────────────────────────────────────

export function articleJsonLd(article: IkarosArticle, origin: string): JsonLdNode {
  const image = firstImageSrc(article.content, origin) ?? absoluteUrl(origin, BRAND_LOGO);
  const description = metaDescription(article.content);
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    headline: article.title,
    ...(description ? { description } : {}),
    image: [image],
    datePublished: article.publishedAtUtc ?? article.createdAtUtc,
    dateModified: article.updatedAtUtc,
    author: {
      '@type': 'Person',
      // D-040 — parita s rendererem: anonymizovaný autor.
      name: article.authorIsDeleted ? 'Smazaný účet' : article.authorName,
    },
    publisher: organizationNode(origin),
    mainEntityOfPage: absoluteUrl(origin, `/ikaros/clanky/${article.id}`),
    inLanguage: 'cs',
  };
}

// ─── ImageObject (galerie) ───────────────────────────────────────────────

export function galleryJsonLd(item: IkarosGalleryItem, origin: string): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'ImageObject',
    name: item.title,
    ...(item.description ? { description: item.description } : {}),
    contentUrl: absoluteUrl(origin, item.imageUrl),
    width: item.width,
    height: item.height,
    datePublished: item.publishedAtUtc ?? item.createdAtUtc,
    uploadDate: item.createdAtUtc,
    author: {
      '@type': 'Person',
      name: item.authorIsDeleted ? 'Smazaný účet' : item.authorName,
    },
    inLanguage: 'cs',
  };
}

// ─── CreativeWork (svět) ─────────────────────────────────────────────────

export function worldJsonLd(world: World, origin: string): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'CreativeWork',
    name: world.name,
    ...(world.description ? { description: world.description } : {}),
    ...(world.imageUrl ? { image: absoluteUrl(origin, world.imageUrl) } : {}),
    url: absoluteUrl(origin, `/svet/${world.slug}`),
    datePublished: world.createdAt,
    dateModified: world.updatedAt,
    ...(world.owner?.username
      ? { creator: { '@type': 'Person', name: world.owner.username } }
      : {}),
    ...(world.genre ? { genre: world.genre } : {}),
    inLanguage: 'cs',
  };
}

// ─── BreadcrumbList (sdílí `Crumb[]` s vizuálními drobečky) ───────────────

export function breadcrumbJsonLd(items: Crumb[], origin: string): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      // Aktuální (poslední, bez href) položka → bez `item`.
      ...(c.href ? { item: absoluteUrl(origin, c.href) } : {}),
    })),
  };
}

// ─── WebSite + Organization (homepage brand) ─────────────────────────────

export function siteJsonLd(origin: string): JsonLdNode[] {
  return [
    {
      '@context': CONTEXT,
      '@type': 'WebSite',
      name: SITE_NAME,
      url: origin || undefined,
      inLanguage: 'cs',
    },
    { '@context': CONTEXT, ...organizationNode(origin) },
  ];
}

// ─── Render ───────────────────────────────────────────────────────────────

/**
 * `JSON.stringify` + escape `<` → `<`. Bez toho by řetězec obsahující
 * `</script>` (název světa/článku, popis) předčasně ukončil `<script>` =
 * rozbití stránky / HTML injection. Povinné.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Vykreslí uzel do `<script type="application/ld+json">`. JSON-LD nemusí být
 * v `<head>` (Google parsuje celý DOM) → nezávisí na React 19 head-hoistingu.
 * Prerender (15B.1) skript sebere z hotového DOM. Lze vykreslit víc na stránce.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
