import { useEffect } from 'react';

/**
 * 15B.2 — per-page SEO meta. Nastaví `<title>`, description, canonical, OG/Twitter
 * a (volitelně) `noindex`. React 19 hoistuje vykreslené `<meta>`/`<link>` do
 * `<head>` a při unmountu je uklidí, takže stačí komponentu vykreslit kdekoli
 * ve veřejné stránce.
 *
 * ⚠️ `<title>` se NEvykresluje deklarativně, ale nastaví imperativně přes
 * `document.title` — `index.html` už statický `<title>` má a React 19 hoisting
 * by přidal DRUHÝ (duplikát). Imperativní zápis přepíše ten existující.
 *
 * Prerender (15B.1) čeká na `__PRERENDER_READY__`, takže effect proběhne dřív →
 * bot dostane HTML s aktuálním titulkem i meta.
 */

const BRAND = 'Ikaros';
const DEFAULT_OG_IMAGE = '/icons/icon-512.png';

export interface SeoProps {
  /** Holý titulek stránky; doplní se „ | Ikaros" (pokud není `rawTitle`). */
  title: string;
  description?: string;
  /** Cesta pro canonical; default = `location.pathname` (bez query). */
  canonicalPath?: string;
  /** Náhledový obrázek (OG/Twitter); default = brand logo. Relativní → absolutní. */
  image?: string;
  type?: 'website' | 'article' | 'profile';
  /** Stránka se nemá indexovat (neveřejná / duplicitní). */
  noindex?: boolean;
  /** Homepage: titulek bez „ | Ikaros" sufixu (brand claim je celý titulek). */
  rawTitle?: boolean;
}

function toAbsolute(url: string, origin: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return origin + (url.startsWith('/') ? url : '/' + url);
}

export function Seo({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
  noindex,
  rawTitle,
}: SeoProps) {
  const fullTitle = rawTitle ? title : `${title} | ${BRAND}`;

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path =
    canonicalPath ??
    (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonical = origin + path;
  const ogImage = toAbsolute(image ?? DEFAULT_OG_IMAGE, origin);

  return (
    <>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,follow" />}

      <meta property="og:site_name" content={BRAND} />
      <meta property="og:locale" content="cs_CZ" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
