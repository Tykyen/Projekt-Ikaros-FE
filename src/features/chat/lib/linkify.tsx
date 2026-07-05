import { Fragment, type ReactNode } from 'react';

/**
 * 20.6 — klikací odkazy v textu zpráv chatu (globální i světový).
 *
 * Bezpečnost: matchujeme **jen** `http(s)://…` — schémata jako `javascript:`
 * nebo `data:` se tím pádem nikdy nestanou odkazem (XSS). Odkaz renderujeme
 * jako React `<a>` (žádné `dangerouslySetInnerHTML`), takže text i `href` React
 * automaticky escapuje. `rel="noopener noreferrer nofollow"` + `target=_blank`.
 *
 * Poslední znak URL nesmí být běžná koncová interpunkce ani uzavírací závorka,
 * aby „…viz https://x.cz." nespolklo tečku a „(https://x.cz)" nezabralo `)`.
 *
 * `linkifyText` běží jako PRVNÍ vrstva renderu (před emote/mention), aby URL
 * zůstala celistvá — `renderPlain` callback zpracuje jen ne-URL segmenty
 * (emote/mention), takže `:shortcode:` uvnitř URL ji nerozbije (dluh N2).
 */
const URL_RE = /https?:\/\/[^\s<]+[^\s<.,!?;:)\]}"'»]/gi;

/** Bidi / zero-width řídicí znaky (vizuální přeuspořádání textu odkazu). */
const UNSAFE_CHARS = /[​-‏‪-‮⁦-⁩]/;

/**
 * Odkaz nezobrazíme jako klikací, když může klamat cíl navigace (text = href):
 * userinfo v authoritě (`https://paypal.com@evil.com` navede na `evil.com`)
 * nebo bidi/zero-width znaky. Nejde o XSS (schéma je vždy http(s)), ale
 * o phishing v user-controlled chatu — radši necháme jako holý text.
 */
function isSafeUrl(url: string): boolean {
  if (UNSAFE_CHARS.test(url)) return false;
  const authority = url.slice(url.indexOf('://') + 3).split(/[/?#]/)[0];
  return !authority.includes('@');
}

/** Výchozí zpracování ne-URL segmentu — prostý textový fragment. */
function plainFragment(segment: string, key: string): ReactNode {
  return <Fragment key={key}>{segment}</Fragment>;
}

/**
 * Rozdělí text na střídání `<a>` (http(s) URL) a ne-URL segmentů. Ne-URL
 * segmenty projdou `renderPlain` (default = prostý text) — tudy se navěsí
 * emote/mention render, aniž by zasáhl vnitřek URL. Vrací pole ReactNode
 * (vždy aspoň jeden prvek).
 */
export function linkifyText(
  text: string,
  keyPrefix = 'lnk',
  renderPlain: (segment: string, key: string) => ReactNode = plainFragment,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let i = 0;
  URL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_RE.exec(text)) !== null) {
    const url = match[0];
    // Klamavá URL (userinfo/bidi) — nelinkovat, nech jako plain text.
    if (!isSafeUrl(url)) continue;
    if (match.index > cursor) {
      nodes.push(
        renderPlain(text.slice(cursor, match.index), `${keyPrefix}-t-${i++}`),
      );
    }
    nodes.push(
      <a
        key={`${keyPrefix}-a-${i++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        {url}
      </a>,
    );
    cursor = match.index + url.length;
  }
  if (cursor < text.length) {
    nodes.push(renderPlain(text.slice(cursor), `${keyPrefix}-t-${i}`));
  }
  return nodes.length ? nodes : [renderPlain(text, `${keyPrefix}-t-0`)];
}
