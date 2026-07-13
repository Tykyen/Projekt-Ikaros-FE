/**
 * 21.2a — V3 „Pojmenuj": dosadí jména ze jmenné sady do vygenerované rodiny.
 * Příjmení dědí patrilineárně: synové (a jejich rodiny) nesou otcovo,
 * rodina provdané dcery nese příjmení jejího partnera. Sada bez příjmení
 * (Ogerská…) → jen křestní jména. Mutuje předaný strom (názvy per osoba).
 */
import type { Rng } from './random';
import { pick, pickZipf } from './random';
import { feminizeSurnameCs, generateOneName } from './names';
import type { GlobalNameSet } from '../types';
import type { GeneratedFamily } from './demography';

interface NameOpts {
  zipf?: boolean;
}

function sampleSurname(
  rng: Rng,
  set: GlobalNameSet,
  opts: NameOpts,
): string | undefined {
  if (set.surnames.length === 0) return undefined;
  const zipf = Boolean(opts.zipf && set.frequencySorted);
  return zipf ? pickZipf(rng, set.surnames) : pick(rng, set.surnames);
}

function given(rng: Rng, set: GlobalNameSet, gender: 'm' | 'f', opts: NameOpts) {
  return generateOneName(rng, set, gender, 'given', { zipf: opts.zipf }).text;
}

function withSurname(
  givenName: string,
  surname: string | undefined,
  gender: 'm' | 'f',
  set: GlobalNameSet,
): string {
  if (!surname) return givenName;
  const s =
    gender === 'f' && set.femaleSurnameRule === 'cs'
      ? feminizeSurnameCs(surname)
      : surname;
  return `${givenName} ${s}`;
}

/**
 * Dosadí jména do rodiny (rekurzivně vč. V8 pod-rodin).
 * `inherited` = jména rodičů, když pod-rodina navazuje na pojmenované dítě.
 */
export function nameFamily(
  rng: Rng,
  family: GeneratedFamily,
  set: GlobalNameSet,
  opts: NameOpts = {},
  inherited?: { father?: string; mother?: string; surname?: string },
): void {
  const surname = inherited?.surname ?? sampleSurname(rng, set, opts);

  family.father.name =
    inherited?.father ?? withSurname(given(rng, set, 'm', opts), surname, 'm', set);
  family.mother.name =
    inherited?.mother ?? withSurname(given(rng, set, 'f', opts), surname, 'f', set);

  for (const child of family.children) {
    child.name = withSurname(
      given(rng, set, child.gender, opts),
      surname,
      child.gender,
      set,
    );
    if (child.spouse) {
      // partner má vlastní rod — nové příjmení ze sady
      const spouseGender = child.gender === 'm' ? 'f' : 'm';
      const spouseSurname = sampleSurname(rng, set, opts);
      child.spouse.name = withSurname(
        given(rng, set, spouseGender, opts),
        spouseSurname,
        spouseGender,
        set,
      );
      if (child.family) {
        // pod-rodina: syn pokračuje ve svém příjmení, dcera v partnerově
        const nextSurname = child.gender === 'm' ? surname : spouseSurname;
        nameFamily(rng, child.family, set, opts, {
          father: child.gender === 'm' ? child.name : child.spouse.name,
          mother: child.gender === 'f' ? child.name : child.spouse.name,
          surname: nextSurname,
        });
      }
    }
  }
}
