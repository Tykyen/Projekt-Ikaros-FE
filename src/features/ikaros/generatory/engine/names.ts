/**
 * 21.2a — engine generátoru jmen: výběr ze jmenné sady (uniform / Zipf V2),
 * přechylování ženských příjmení (V1, česká pravidla), přízviska (V7).
 * Čistá funkce nad daty sady — žádný fetch, žádný stav.
 */
import { pick, pickZipf, type Rng } from './random';
import type { GlobalNameSet } from '../types';

export type NameGender = 'm' | 'f';
export type NameFormat = 'full' | 'given' | 'surname';

export interface GenerateNamesOptions {
  count: number;
  /** 'mix' = náhodně 1:1. */
  gender: NameGender | 'mix';
  format: NameFormat;
  /** V2 — běžná jména častěji (jen má-li sada `frequencySorted`). */
  zipf?: boolean;
  /** V7 — přidat přízvisko (jen má-li sada `epithets`). */
  withEpithet?: boolean;
}

export interface GeneratedName {
  gender: NameGender;
  given?: string;
  surname?: string;
  epithet?: string;
  /** Složený řetězec k zobrazení/kopírování. */
  text: string;
}

/**
 * V1 — přechýlení českého příjmení (Novák→Nováková, Veselý→Veselá,
 * Svoboda→Svobodová, Špaček→Špačková; Krejčí/Janů beze změny).
 * Zjednodušená pravidla — výjimky nese datová sada (už přechýlené netvoříme).
 */
export function feminizeSurnameCs(surname: string): string {
  const s = surname.trim();
  if (!s) return s;
  if (s.endsWith('ová') || s.endsWith('á')) return s; // už ženský tvar
  if (s.endsWith('ý')) return s.slice(0, -1) + 'á';
  if (s.endsWith('í') || s.endsWith('ů')) return s; // Krejčí, Janů — nesklonné
  if (s.endsWith('ek')) return s.slice(0, -2) + 'ková'; // Špaček→Špačková
  if (/[aeoě]$/.test(s)) return s.slice(0, -1) + 'ová'; // Svoboda→Svobodová
  return s + 'ová';
}

function applySurnameRule(
  surname: string,
  gender: NameGender,
  rule: GlobalNameSet['femaleSurnameRule'],
): string {
  if (gender === 'f' && rule === 'cs') return feminizeSurnameCs(surname);
  return surname;
}

/**
 * V10 — přechýlení přízviska pro ženy. Datová konvence (seed i editor):
 * přízvisko je BUĎ jednoslovné adjektivum na „-ý" (Statečný→Statečná),
 * NEBO rodově neutrální předložková fráze („z Mlžných hor") — ta se nemění.
 */
export function feminizeEpithetCs(epithet: string): string {
  const e = epithet.trim();
  if (!e.includes(' ') && e.endsWith('ý')) return e.slice(0, -1) + 'á';
  return e;
}

function sample(rng: Rng, list: readonly string[], zipf: boolean): string {
  return zipf ? pickZipf(rng, list) : pick(rng, list);
}

/** Jedno jméno dle sady a voleb (interní — používá i demografický engine). */
export function generateOneName(
  rng: Rng,
  set: GlobalNameSet,
  gender: NameGender,
  format: NameFormat,
  opts: { zipf?: boolean; withEpithet?: boolean } = {},
): GeneratedName {
  const zipf = Boolean(opts.zipf && set.frequencySorted);
  const givenPool = gender === 'm' ? set.maleNames : set.femaleNames;
  const wantGiven = format !== 'surname';
  const wantSurname = format !== 'given' && set.surnames.length > 0;

  const given =
    wantGiven && givenPool.length > 0
      ? sample(rng, givenPool, zipf)
      : undefined;
  const surname = wantSurname
    ? applySurnameRule(
        sample(rng, set.surnames, zipf),
        gender,
        set.femaleSurnameRule,
      )
    : undefined;
  const rawEpithet =
    opts.withEpithet && set.epithets.length > 0
      ? pick(rng, set.epithets)
      : undefined;
  const epithet =
    rawEpithet && gender === 'f' ? feminizeEpithetCs(rawEpithet) : rawEpithet;

  const text = [given, surname, epithet].filter(Boolean).join(' ');
  return { gender, given, surname, epithet, text };
}

/** Seznam jmen dle voleb (V9 — determinismus zajišťuje předaný `rng`). */
export function generateNames(
  rng: Rng,
  set: GlobalNameSet,
  options: GenerateNamesOptions,
): GeneratedName[] {
  const out: GeneratedName[] = [];
  const count = Math.max(1, Math.min(50, Math.floor(options.count)));
  for (let i = 0; i < count; i++) {
    const gender: NameGender =
      options.gender === 'mix' ? (rng() < 0.5 ? 'm' : 'f') : options.gender;
    out.push(
      generateOneName(rng, set, gender, options.format, {
        zipf: options.zipf,
        withEpithet: options.withEpithet,
      }),
    );
  }
  return out;
}
