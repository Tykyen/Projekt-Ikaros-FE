/**
 * 21.2a — demografický engine generátoru potomků (spec R4 + V3–V6, V8, V9).
 *
 * Model = PORODNÍ ŘADA (počet dětí je výsledek, ne vstup), postavený na
 * předindustriální demografii: porodní intervaly ~30 měsíců od sňatku do
 * konce plodnosti, úmrtí matky 1 %/porod (≈ 1 z 18 žen za život), dvojčata
 * 1,5 %, pohlaví 51,2 % chlapci, dětská úmrtnost dle presetu, dožití
 * dospělých z pásmové úmrtnostní tabulky (medián ~57, e15 ≈ +40 let).
 * Zdroje: CAMPOP (Cambridge), Our World in Data, anglické farní registry.
 */
import {
  normal,
  pickWeighted,
  randInt,
  triangular,
  type Rng,
} from './random';

// ── Parametry ─────────────────────────────────────────────────────────────

export interface DemographyParams {
  /** Věk matky při sňatku — trojúhelník. */
  marriageAgeMin: number;
  marriageAgeMode: number;
  marriageAgeMax: number;
  /** Konec plodnosti (uniform v rozsahu). */
  fertilityEndMin: number;
  fertilityEndMax: number;
  /** Interval mezi porody v měsících (uniform). */
  birthIntervalMin: number;
  birthIntervalMax: number;
  /** Šance úmrtí matky na porod (0–1). */
  maternalDeathPerBirth: number;
  twinChance: number;
  boyRatio: number;
  /** Kojenecká úmrtnost (do 1 roku) a dětská (1–15) — presety. */
  infantMortality: number;
  childMortality: number;
  /** Šance, že se dospělý ožení/vdá. */
  marriageChance: number;
  /** Věkový rozdíl partnera (muž starší): normal(μ, σ), ořez. */
  spouseAgeDiffMean: number;
  spouseAgeDiffSd: number;
  spouseAgeDiffMin: number;
  spouseAgeDiffMax: number;
  /** V6 — násobek dožití (elfové…), default 1. */
  lifespanMult: number;
  /** V8 — hloubka generací (1 = jen děti, max 3). */
  generations: number;
}

export type MortalityPresetId = 'stredovek' | 'tvrdy' | 'prosperita';

export const MORTALITY_PRESETS: Record<
  MortalityPresetId,
  { label: string; infantMortality: number; childMortality: number }
> = {
  stredovek: { label: 'Středověk', infantMortality: 0.2, childMortality: 0.15 },
  tvrdy: { label: 'Tvrdý svět', infantMortality: 0.25, childMortality: 0.2 },
  prosperita: {
    label: 'Prosperita',
    infantMortality: 0.08,
    childMortality: 0.07,
  },
};

export function defaultParams(): DemographyParams {
  return {
    marriageAgeMin: 16,
    marriageAgeMode: 20,
    marriageAgeMax: 26,
    fertilityEndMin: 40,
    fertilityEndMax: 45,
    birthIntervalMin: 24,
    birthIntervalMax: 36,
    maternalDeathPerBirth: 0.01,
    twinChance: 0.015,
    boyRatio: 0.512,
    infantMortality: MORTALITY_PRESETS.stredovek.infantMortality,
    childMortality: MORTALITY_PRESETS.stredovek.childMortality,
    marriageChance: 0.88,
    spouseAgeDiffMean: 3,
    spouseAgeDiffSd: 4,
    spouseAgeDiffMin: -5,
    spouseAgeDiffMax: 15,
    lifespanMult: 1,
    generations: 1,
  };
}

/** V6 — promítne demografický profil jmenné sady do parametrů. */
export function applySetDemography(
  params: DemographyParams,
  demography?: {
    lifespanMult?: number;
    fertilityFrom?: number;
    fertilityTo?: number;
  } | null,
): DemographyParams {
  if (!demography) return params;
  const p = { ...params };
  if (demography.lifespanMult) p.lifespanMult = demography.lifespanMult;
  if (demography.fertilityFrom !== undefined) {
    const from = demography.fertilityFrom;
    p.marriageAgeMin = from;
    p.marriageAgeMode = from + 4;
    p.marriageAgeMax = from + 10;
  }
  if (demography.fertilityTo !== undefined) {
    p.fertilityEndMin = Math.max(p.marriageAgeMax + 1, demography.fertilityTo - 3);
    p.fertilityEndMax = demography.fertilityTo;
    // delší okno plodnosti → úměrně delší rozestupy (počet dětí zůstane lidský)
    const humanWindow = 45 - 16;
    const window = demography.fertilityTo - (demography.fertilityFrom ?? 16);
    const scale = Math.max(1, window / humanWindow);
    p.birthIntervalMin = Math.round(p.birthIntervalMin * scale);
    p.birthIntervalMax = Math.round(p.birthIntervalMax * scale);
  }
  return p;
}

// ── Výstupní typy ─────────────────────────────────────────────────────────

export type DeathCause =
  | 'nemoc'
  | 'nehoda'
  | 'bitva'
  | 'porod'
  | 'sešlost věkem'
  | null; // null = žije / neurčeno (dítě přežilo do dospělosti a model končí)

export interface SpouseInfo {
  /** Kladné = starší než protějšek. */
  ageDiff: number;
  ageAtDeath: number;
  deathCause: DeathCause;
  name?: string;
}

export interface ChildPerson {
  gender: 'm' | 'f';
  /** Věk matky při porodu (celé roky). */
  motherAgeAtBirth: number;
  /** Pořadí porodu (dvojčata sdílí). */
  birthOrder: number;
  twin: boolean;
  fate: 'kojenec' | 'dítě' | 'dospělý';
  ageAtDeath: number;
  deathCause: DeathCause;
  spouse?: SpouseInfo;
  name?: string;
  /** V8 — vlastní rodina (jen fate=dospělý se spouse a generations > 1). */
  family?: GeneratedFamily;
}

export interface GeneratedFamily {
  mother: {
    marriageAge: number;
    ageAtDeath: number;
    deathCause: DeathCause;
    /** Index porodu, při kterém zemřela (1-based); undefined = nezemřela při porodu. */
    diedInChildbirthAt?: number;
    name?: string;
  };
  father: {
    /** Kladné = starší než matka. */
    ageDiff: number;
    ageAtDeath: number;
    deathCause: DeathCause;
    name?: string;
  };
  children: ChildPerson[];
  /** Celkem narozených (vč. zemřelých v dětství). */
  totalBirths: number;
}

// ── Úmrtnost ──────────────────────────────────────────────────────────────

/** Dožití dospělého (přežil 15): pásmová tabulka, medián ~57 (e15 ≈ +40). */
function adultAgeAtDeath(rng: Rng, mult: number): number {
  const band = pickWeighted(rng, [
    [[15, 30], 12],
    [[30, 45], 20],
    [[45, 60], 28],
    [[60, 75], 28],
    [[75, 92], 12],
  ] as const);
  return Math.round(randInt(rng, band[0], band[1]) * mult);
}

/** V5 — příčina smrti dle věku/pohlaví (flavor, vážené). */
function deathCauseFor(
  rng: Rng,
  gender: 'm' | 'f',
  ageAtDeath: number,
  mult: number,
): DeathCause {
  const age = ageAtDeath / mult; // porovnáváme v „lidských" letech
  if (age < 1) return 'nemoc';
  if (age < 15)
    return pickWeighted(rng, [
      ['nemoc', 70],
      ['nehoda', 30],
    ] as const);
  if (age < 45) {
    return gender === 'm'
      ? pickWeighted(rng, [
          ['nemoc', 40],
          ['nehoda', 25],
          ['bitva', 35],
        ] as const)
      : pickWeighted(rng, [
          ['nemoc', 65],
          ['nehoda', 20],
          ['bitva', 15],
        ] as const);
  }
  if (age < 65)
    return pickWeighted(rng, [
      ['nemoc', 75],
      ['nehoda', 15],
      ['bitva', 10],
    ] as const);
  return pickWeighted(rng, [
    ['sešlost věkem', 80],
    ['nemoc', 20],
  ] as const);
}

function spouseAgeDiff(rng: Rng, p: DemographyParams, forGender: 'm' | 'f'): number {
  // model: muž starší o normal(μ,σ); pro mužské dítě je partnerka MLADŠÍ
  const diff = Math.round(
    Math.min(
      p.spouseAgeDiffMax,
      Math.max(p.spouseAgeDiffMin, normal(rng, p.spouseAgeDiffMean, p.spouseAgeDiffSd)),
    ),
  );
  return forGender === 'f' ? diff : -diff;
}

// ── Hlavní generátor ──────────────────────────────────────────────────────

interface Budget {
  people: number;
}

const PEOPLE_CAP = 200;

/** Vygeneruje rodinu (V3: včetně rodičů a partnerů; V8: rekurze generací). */
export function generateFamily(
  rng: Rng,
  params: DemographyParams,
  budget: Budget = { people: PEOPLE_CAP },
): GeneratedFamily {
  const p = params;
  const mult = Math.max(0.1, p.lifespanMult);

  const marriageAge = Math.round(
    triangular(rng, p.marriageAgeMin, p.marriageAgeMode, p.marriageAgeMax),
  );
  const fertilityEnd = randInt(rng, p.fertilityEndMin, p.fertilityEndMax);

  // matka: dožití dospělé, ale sňatku se dožila
  let motherDeath = Math.max(marriageAge + 1, adultAgeAtDeath(rng, mult));
  let motherCause: DeathCause = null;
  let diedInChildbirthAt: number | undefined;

  const fatherDiff = -spouseAgeDiff(rng, p, 'm'); // otec starší o kladný diff
  const fatherDeath = Math.max(
    marriageAge + fatherDiff + 1,
    adultAgeAtDeath(rng, mult),
  );

  const children: ChildPerson[] = [];
  budget.people = Math.max(0, budget.people - 2);

  // porodní řada: první dítě 9–24 měsíců po sňatku, pak intervaly
  let ageMonths =
    marriageAge * 12 + randInt(rng, 9, Math.max(10, p.birthIntervalMin));
  let birthOrder = 0;

  while (
    ageMonths / 12 <= Math.min(fertilityEnd, motherDeath) &&
    budget.people > 0
  ) {
    birthOrder++;
    const motherAge = Math.floor(ageMonths / 12);
    const twins = rng() < p.twinChance ? 2 : 1;

    for (let t = 0; t < twins && budget.people > 0; t++) {
      budget.people--;
      const gender: 'm' | 'f' = rng() < p.boyRatio ? 'm' : 'f';
      const u = rng();
      let child: ChildPerson;
      if (u < p.infantMortality) {
        child = {
          gender,
          motherAgeAtBirth: motherAge,
          birthOrder,
          twin: twins === 2,
          fate: 'kojenec',
          ageAtDeath: 0,
          deathCause: 'nemoc',
        };
      } else if (u < p.infantMortality + p.childMortality) {
        const age = Math.round(randInt(rng, 1, 14) * mult);
        child = {
          gender,
          motherAgeAtBirth: motherAge,
          birthOrder,
          twin: twins === 2,
          fate: 'dítě',
          ageAtDeath: age,
          deathCause: deathCauseFor(rng, gender, age, mult),
        };
      } else {
        const age = adultAgeAtDeath(rng, mult);
        child = {
          gender,
          motherAgeAtBirth: motherAge,
          birthOrder,
          twin: twins === 2,
          fate: 'dospělý',
          ageAtDeath: age,
          deathCause: deathCauseFor(rng, gender, age, mult),
        };
        if (rng() < p.marriageChance) {
          const diff = spouseAgeDiff(rng, p, gender);
          const spouseDeath = adultAgeAtDeath(rng, mult);
          child.spouse = {
            ageDiff: diff,
            ageAtDeath: spouseDeath,
            deathCause: deathCauseFor(
              rng,
              gender === 'm' ? 'f' : 'm',
              spouseDeath,
              mult,
            ),
          };
          // V8 — další generace (jen v rozpočtu osob)
          if (p.generations > 1 && budget.people > 4) {
            child.family = generateFamily(
              rng,
              { ...p, generations: p.generations - 1 },
              budget,
            );
          }
        }
      }
      children.push(child);
    }

    // úmrtí matky při porodu?
    if (rng() < p.maternalDeathPerBirth) {
      motherDeath = motherAge;
      motherCause = 'porod';
      diedInChildbirthAt = birthOrder;
      break;
    }
    ageMonths += randInt(rng, p.birthIntervalMin, p.birthIntervalMax);
  }

  if (motherCause === null) {
    motherCause = deathCauseFor(rng, 'f', motherDeath, mult);
  }

  return {
    mother: {
      marriageAge,
      ageAtDeath: motherDeath,
      deathCause: motherCause,
      diedInChildbirthAt,
    },
    father: {
      ageDiff: fatherDiff,
      ageAtDeath: fatherDeath,
      deathCause: deathCauseFor(rng, 'm', fatherDeath, mult),
    },
    children,
    totalBirths: children.length,
  };
}
