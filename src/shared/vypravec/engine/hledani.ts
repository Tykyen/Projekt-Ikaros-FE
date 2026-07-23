/**
 * S2 (07 §6) — „Zeptat se": fulltext nad topiky + návody. Korpus je ~60
 * dokumentů → vlastní skórovaný substring index bez závislosti (MiniSearch
 * by tu byl kanón na vrabce; kdyby korpus narostl na stovky, vyměnit zde).
 * Diakritika i velikost písmen jsou složené (fold) — „pristup" najde „Přístup".
 */
import { TOPIKY } from '../registry/topics';
import { NAVODY } from '../registry/navody';
import { ROUTE_HEADERS } from '../registry/routeHeaders';
import { FAQ_POLOZKY } from '../registry/faq';
import type { HelpTopic } from '../registry/types';

export interface Nalez {
  typ: 'topik' | 'navod' | 'misto' | 'faq';
  id: string;
  title: string;
  skore: number;
  /** typ 'misto'/'faq': routa/deep-link — CTA „vezmi mě tam"/„odpověď v nápovědě". */
  route?: string;
}

/** Fold: lowercase + odstranění diakritiky (NFD + combining marks pryč). */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface Dokument {
  typ: 'topik' | 'navod' | 'misto' | 'faq';
  id: string;
  title: string;
  fTitle: string;
  fTags: string;
  fText: string;
  audience?: readonly string[];
  route?: string;
}

let index: Dokument[] | null = null;

function naDokument(t: HelpTopic, typ: 'topik' | 'navod'): Dokument {
  return {
    typ,
    id: t.id,
    title: t.title,
    fTitle: fold(t.title),
    fTags: fold(t.tags.join(' ')),
    fText: fold(
      [...t.body.odstavce, ...(t.body.kroky ?? []), t.minAudienceNote ?? '']
        .join(' '),
    ),
    audience: t.audience,
  };
}

function dejIndex(): Dokument[] {
  if (!index) {
    index = [
      ...TOPIKY.map((t) => naDokument(t, 'topik')),
      ...NAVODY.map((n) => naDokument(n, 'navod')),
      // „Kde jsou nábory?" má být navigace, ne search_miss (revize 07/23).
      ...ROUTE_HEADERS.map((h) => ({
        typ: 'misto' as const,
        id: `misto:${h.route}`,
        title: h.name,
        fTitle: fold(h.name),
        fTags: '',
        fText: fold(h.blurb),
        route: h.route,
      })),
      // Kritik úplnosti: FAQ je nejbohatší Q&A korpus — bez něj „zeptej se
      // na cokoli" tiše míjí FAQ-only dotazy. Indexuje se otázka (odpověď
      // je JSX); deep-link do plné nápovědy na příslušnou kategorii.
      ...FAQ_POLOZKY.map((f, i) => ({
        typ: 'faq' as const,
        id: `faq:${f.cat}:${i}`,
        title: f.q,
        fTitle: fold(f.q),
        fTags: '',
        fText: fold(f.q),
        route: `/ikaros/napoveda?sekce=faq&topik=faq-${f.cat}`,
      })),
    ];
  }
  return index;
}

/**
 * Skórování per token: titul (počátek slova > kdekoli) > tagy > tělo.
 * Všechny tokeny musí zasáhnout aspoň jedno pole (AND) — jinak dokument
 * vypadne. Publikum filtruje NABÍDKU stejně jako topikyProRoutu.
 */
export function hledej(dotaz: string, audience: string): Nalez[] {
  const tokeny = fold(dotaz)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  if (!tokeny.length) return [];

  const vysledky: Nalez[] = [];
  for (const d of dejIndex()) {
    if (d.audience && !(d.audience as readonly string[]).includes(audience))
      continue;
    let skore = 0;
    let vsechny = true;
    for (const tok of tokeny) {
      let s = 0;
      if (d.fTitle.includes(tok))
        s += new RegExp(`(^| )${tok}`).test(d.fTitle) ? 12 : 8;
      if (d.fTags.includes(tok)) s += 5;
      if (d.fText.includes(tok)) s += 2;
      if (s === 0) {
        vsechny = false;
        break;
      }
      skore += s;
    }
    if (vsechny)
      vysledky.push({
        typ: d.typ,
        id: d.id,
        title: d.title,
        skore,
        ...(d.route ? { route: d.route } : {}),
      });
  }
  return vysledky.sort((a, b) => b.skore - a.skore).slice(0, 8);
}
