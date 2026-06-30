/**
 * Krok 6.3d — Strukturovaná data hodu kostkou.
 *
 * `DicePayload` je discriminated union podle `type`. BE schema je `Object`
 * (free-form), validuje se jen tvar pomocí těchto TS typů na FE +
 * `parseDicePayload` defensive při příchodu z drátu.
 *
 * Render v `DiceMessage` čte payload, ne textový `content` — text je jen
 * fallback pro legacy zprávy + push notifikace.
 */

import type {
  FateRollResult,
  GenericRollResult,
  MixedRollResult,
  PoolHitsResult,
} from './rollEngine';

export type DiceFaceValue = number | '+' | '-' | '0';

export interface DicePayloadBase {
  /** Discriminator pro union. */
  type: string;
  /** Tváře hodu — pořadí = pořadí render v scéně. */
  faces: DiceFaceValue[];
  /** Součet hodu bez modifieru. */
  sum: number;
  /** Součet hodu + modifier (= konečný displayovaný výsledek). */
  total: number;
  /** Volitelný popisek („Magie", „Vnímání", ...). */
  label?: string;
  /** Volitelný modifier (`+2`, `−1`). */
  modifier?: number;
  /**
   * JaD (8.7q): fatální úspěch (přirozená 20) / neúspěch (přirozená 1) na k20.
   * Render zobrazí text místo součtu. Nastavuje jen JaD roll (flag `critOnD20`),
   * ostatní d20 systémy ho nemají → beze změny.
   */
  crit?: 'success' | 'fail';
}

export interface FateDicePayload extends DicePayloadBase {
  type: 'fate';
  faces: ('+' | '-' | '0')[];
  /** Přetlak — jen Fate, jen pokud total ≥ 7. */
  overpressure?: number | null;
}

export interface GenericDicePayload extends DicePayloadBase {
  type: 'd4' | 'd6' | 'd6+' | '2d6+' | 'd8' | 'd10' | 'd12' | 'd20';
  faces: number[];
}

export interface PoolDicePayload extends DicePayloadBase {
  type: `pool-d${number}`;
  faces: number[];
  /**
   * SR6 success-pool: pokud je `hits` definováno, hod se NEsčítá — počítají se
   * **úspěchy** (tvář ≥ `hitThreshold`). `total` pak nese `hits`. Render
   * (dicelog/readout) zvýrazní tváře ≥ threshold a jedničky a ukáže „X úspěchů"
   * + glitch. Bez `hits` = klasický součtový pool (beze změny).
   */
  hits?: number;
  ones?: number;
  glitch?: boolean;
  criticalGlitch?: boolean;
  /** Práh úspěchu (5 pro SR6) — render zvýrazní tváře ≥ threshold. */
  hitThreshold?: number;
}

export interface MixedDicePayload extends DicePayloadBase {
  type: 'mixed';
  faces: number[];
  /** Per-face typ kostky (`'d6'`, `'d20'`, `'d100'`, `'fate'`). */
  faceTypes: string[];
}

export interface D100DicePayload extends DicePayloadBase {
  type: 'd100';
  /** `[tens, ones]` — tens v {0, 10, 20, ..., 90}, ones v {0..9}. */
  faces: number[];
  tens: number;
  ones: number;
}

export type DicePayload =
  | FateDicePayload
  | GenericDicePayload
  | PoolDicePayload
  | MixedDicePayload
  | D100DicePayload;

// ─── Buildery ────────────────────────────────────────────────────────────

export function buildFatePayload(
  roll: FateRollResult,
  opts: { label?: string; modifier?: number } = {},
): FateDicePayload {
  const modifier = opts.modifier ?? 0;
  const total = roll.sum + modifier;
  const overpressure = total >= 7 ? mapOverpressure(total) : null;
  return {
    type: 'fate',
    faces: roll.rolls.map((r) =>
      r === 1 ? '+' : r === -1 ? '-' : '0',
    ) as ('+' | '-' | '0')[],
    sum: roll.sum,
    total,
    label: opts.label,
    modifier,
    overpressure,
  };
}

export function buildGenericPayload(
  roll: GenericRollResult,
  opts: { label?: string; modifier?: number; crit?: 'success' | 'fail' } = {},
): GenericDicePayload | PoolDicePayload | D100DicePayload {
  const modifier = opts.modifier ?? 0;
  const total = roll.sum + modifier;

  if (roll.type === 'd100' || roll.type === 'k100') {
    const [tens, ones] = roll.rolls;
    return {
      type: 'd100',
      faces: roll.rolls,
      tens,
      ones,
      sum: roll.sum,
      total,
      label: opts.label,
      modifier,
    };
  }

  if (roll.type.startsWith('pool-d')) {
    return {
      type: roll.type as `pool-d${number}`,
      faces: roll.rolls,
      sum: roll.sum,
      total,
      label: opts.label,
      modifier,
    };
  }

  return {
    type: roll.type as GenericDicePayload['type'],
    faces: roll.rolls,
    sum: roll.sum,
    total,
    label: opts.label,
    modifier,
    crit: opts.crit,
  };
}

/**
 * SR6 success-pool payload — `total`/`sum` nesou počet úspěchů (`hits`),
 * `faces` jsou hozené k6. Render zvýrazní tváře ≥ threshold + jedničky.
 */
export function buildPoolHitsPayload(
  roll: PoolHitsResult,
  opts: { label?: string } = {},
): PoolDicePayload {
  return {
    type: roll.type as `pool-d${number}`,
    faces: roll.rolls,
    sum: roll.hits,
    total: roll.hits,
    label: opts.label,
    hits: roll.hits,
    ones: roll.ones,
    glitch: roll.glitch,
    criticalGlitch: roll.criticalGlitch,
    hitThreshold: roll.threshold,
  };
}

export function buildMixedPayload(
  roll: MixedRollResult,
  opts: { label?: string; modifier?: number } = {},
): MixedDicePayload {
  const modifier = opts.modifier ?? 0;
  const total = roll.sum + modifier;
  return {
    type: 'mixed',
    faces: roll.rolls,
    faceTypes: roll.faceTypes,
    sum: roll.sum,
    total,
    label: opts.label,
    modifier,
  };
}

// ─── Parser (defensive při příchodu z drátu) ─────────────────────────────

/**
 * Vrátí typovaný `DicePayload` pokud raw objekt vypadá rozumně, jinak `null`.
 * Render-side používá pro robustnost — nesprávný payload neshazuje UI,
 * jen spadne na text fallback.
 */
export function parseDicePayload(
  raw: unknown,
): DicePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  if (typeof type !== 'string') return null;
  if (!Array.isArray(obj.faces)) return null;
  if (typeof obj.sum !== 'number') return null;
  if (typeof obj.total !== 'number') return null;

  // Typování v dalším kódu — runtime už nevalidujeme jednotlivé pole.
  return raw as DicePayload;
}

// ─── Helper ──────────────────────────────────────────────────────────────

function mapOverpressure(total: number): number {
  if (total === 7) return 1;
  if (total === 8) return 2;
  if (total === 9) return 3;
  if (total === 10) return 5;
  if (total === 11) return 7;
  if (total === 12) return 9;
  return 12;
}
