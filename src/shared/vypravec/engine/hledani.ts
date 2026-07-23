/**
 * S2 (07 §6) — „Zeptat se": fulltext nad topiky + návody. Korpus je ~60
 * dokumentů → vlastní skórovaný substring index bez závislosti (MiniSearch
 * by tu byl kanón na vrabce; kdyby korpus narostl na stovky, vyměnit zde).
 * Diakritika i velikost písmen jsou složené (fold) — „pristup" najde „Přístup".
 */
import { TOPIKY } from '../registry/topics';
import { NAVODY } from '../registry/navody';
import type { HelpTopic } from '../registry/types';

export interface Nalez {
  typ: 'topik' | 'navod';
  id: string;
  title: string;
  skore: number;
}

/** Fold: lowercase + odstranění diakritiky (NFD + combining marks pryč). */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface Dokument {
  typ: 'topik' | 'navod';
  id: string;
  title: string;
  fTitle: string;
  fTags: string;
  fText: string;
  audience?: readonly string[];
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
    if (vsechny) vysledky.push({ typ: d.typ, id: d.id, title: d.title, skore });
  }
  return vysledky.sort((a, b) => b.skore - a.skore).slice(0, 8);
}
