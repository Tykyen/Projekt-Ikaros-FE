/**
 * Krok 11.1 — type-aware paleta emocí pro vztahy.
 *
 * Kvalita (`emotionTag`) nad kvantitou (`valence`): jedna škála −3..+3 říká *jak
 * moc + / −*, tag říká *jakého druhu*. Paleta se liší dle typů subjektů ve
 * vztahu — lidé cítí jinak (láska/nenávist) než státy (spojenectví/válka).
 *
 * Výběr tagu ve formuláři předvyplní `valence` (default níže), uživatel může
 * přepsat.
 */

import type { CampaignSubjectType } from './types';

export interface EmotionOption {
  tag: string;
  /** Default valence (−3..+3) předvyplněná při výběru tagu. */
  valence: number;
}

/** Mezi osobami (PC / NPC). */
export const EMOTIONS_PERSON: EmotionOption[] = [
  { tag: 'láska', valence: 3 },
  { tag: 'zamilovanost', valence: 2 },
  { tag: 'přátelství', valence: 2 },
  { tag: 'sympatie', valence: 1 },
  { tag: 'respekt', valence: 1 },
  { tag: 'lhostejnost', valence: 0 },
  { tag: 'nedůvěra', valence: -1 },
  { tag: 'žárlivost', valence: -1 },
  { tag: 'rivalita', valence: -1 },
  { tag: 'strach', valence: -2 },
  { tag: 'opovržení', valence: -2 },
  { tag: 'nenávist', valence: -3 },
];

/** Mezi organizacemi / frakcemi / státy. */
export const EMOTIONS_ORG: EmotionOption[] = [
  { tag: 'spojenectví', valence: 3 },
  { tag: 'obchodní', valence: 1 },
  { tag: 'vazalství', valence: 1 },
  { tag: 'neutralita', valence: 0 },
  { tag: 'napětí', valence: -1 },
  { tag: 'soupeření', valence: -1 },
  { tag: 'studená válka', valence: -2 },
  { tag: 'válka', valence: -3 },
];

/** Smíšené / lokace / ostatní. */
export const EMOTIONS_MISC: EmotionOption[] = [
  { tag: 'domov', valence: 3 },
  { tag: 'vazba', valence: 2 },
  { tag: 'kontrola', valence: 1 },
  { tag: 'spor', valence: -1 },
  { tag: 'vyhnanství', valence: -2 },
];

type Kind = 'person' | 'org' | 'other';

function kindOf(type: CampaignSubjectType): Kind {
  if (type === 'PC' || type === 'NPC') return 'person';
  if (type === 'ORG' || type === 'FACTION' || type === 'STATE') return 'org';
  return 'other';
}

/** Deduplikace dle tagu (zachová první výskyt). */
function dedupe(options: EmotionOption[]): EmotionOption[] {
  const seen = new Set<string>();
  return options.filter((o) => (seen.has(o.tag) ? false : seen.add(o.tag)));
}

/**
 * Paleta emocí relevantní pro dvojici typů. Stejnorodé páry dostanou cílenou
 * paletu; smíšené páry dostanou vše (maximální volnost — „veškeré potřeby").
 */
export function emotionsFor(
  typeA: CampaignSubjectType,
  typeB: CampaignSubjectType,
): EmotionOption[] {
  const a = kindOf(typeA);
  const b = kindOf(typeB);
  if (a === 'person' && b === 'person') return EMOTIONS_PERSON;
  if (a === 'org' && b === 'org') return EMOTIONS_ORG;
  return dedupe([...EMOTIONS_MISC, ...EMOTIONS_PERSON, ...EMOTIONS_ORG]);
}

/** Všechny tagy → default valence (napříč paletami). */
export const TAG_DEFAULT_VALENCE: Record<string, number> = Object.fromEntries(
  [...EMOTIONS_PERSON, ...EMOTIONS_ORG, ...EMOTIONS_MISC].map((o) => [
    o.tag,
    o.valence,
  ]),
);

/** Default valence pro tag (0 pokud neznámý). */
export function defaultValenceFor(tag: string | undefined): number {
  if (!tag) return 0;
  return TAG_DEFAULT_VALENCE[tag] ?? 0;
}

/** Clamp do rozsahu −3..+3 (sanitace uživatelského / BE vstupu). */
export function clampValence(v: number | undefined): number {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0;
  return Math.max(-3, Math.min(3, Math.round(v)));
}
