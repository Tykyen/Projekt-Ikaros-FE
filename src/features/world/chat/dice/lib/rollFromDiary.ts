/**
 * 16.1a — Most hodu z deníku do chatu.
 *
 * Chat-local zrcadlo `tactical-map/utils/rollFromSheet.performSheetRoll`:
 * z `{label, modifier, kind}` (klik na schopnost / iniciativu v deníkovém
 * sheetu) vyrobí strukturovaný `dicePayload` (→ 3D overlay + render zprávy)
 * a textový `content` (fallback do notifikací / hledání).
 *
 * Schválně chat-local (ne import z `tactical-map`) — chat nemá záviset na
 * mapě; sdílíme jen úroveň `chat/dice/lib` (rollEngine + dicePayload + format).
 *
 * 8.7q — `mixed` (JaD skládaný zásah) a `critOnD20` (JaD fatální úspěch/neúspěch)
 * zrcadlí `rollFromSheet`, ať combat panel funguje v chatu stejně jako na mapě.
 */
import {
  rollFate,
  rollGenericDice,
  rollMixedDice,
  rollPoolHits,
} from './rollEngine';
import {
  buildFatePayload,
  buildGenericPayload,
  buildMixedPayload,
  buildPoolHitsPayload,
  type DicePayload,
} from './dicePayload';
import { formatFateMessage, formatGenericDiceMessage } from './formatMessage';

/** Typy kostek dovolené z deníkového sheetu — zrcadlí `SystemSheetProps.onRoll`. */
export type DiaryRollKind =
  | 'fate'
  | 'd4'
  | 'd6'
  | 'd6+'
  | '2d6+'
  | 'd8'
  | 'd10'
  | 'd12'
  | 'd20'
  | 'd100'
  | 'mixed'
  | 'pool-d6';

export interface DiaryRollRequest {
  /** Lidský popisek — jméno schopnosti / „Iniciativa". */
  label: string;
  /** Modifikátor = velikost schopnosti. Default 0. */
  modifier?: number;
  /** Typ kostky. Default `fate` (Matrix/Fate). */
  kind?: DiaryRollKind;
  /** JaD (8.7q): u k20 detekuj fatální úspěch (nat 20) / neúspěch (nat 1). */
  critOnD20?: boolean;
  /** JaD (8.7q) skládaný hod zásahu (`kind:'mixed'`): počty kostek. */
  mixed?: Record<string, number>;
  /** Shadowrun success-pool (`kind:'pool-d6'`): počet kostek (úspěchy 5–6 + glitch). */
  pool?: number;
}

export interface DiaryRollResult {
  dicePayload: DicePayload;
  /** Textová reprezentace (notifikace / hledání / legacy fallback). */
  content: string;
}

/**
 * Provede hod podle požadavku z deníku. Vrací payload (pro overlay + render)
 * a content (text). `null` pro nepodporovaný typ kostky.
 */
export function rollDiaryRequest(
  req: DiaryRollRequest,
): DiaryRollResult | null {
  const { label, modifier = 0, kind = 'fate' } = req;

  // Shadowrun success-pool: `pool` × k6, úspěchy (5–6) + glitch (ne součet).
  if (typeof req.pool === 'number' && kind.startsWith('pool-')) {
    const sides = parseInt(kind.replace('pool-d', ''), 10) || 6;
    const r = rollPoolHits(req.pool, sides);
    const gl = r.criticalGlitch
      ? ' · KRITICKÝ GLITCH'
      : r.glitch
        ? ' · glitch'
        : '';
    return {
      dicePayload: buildPoolHitsPayload(r, { label }),
      content: `🎲 ${label}: ${r.hits} úspěchů (${req.pool}k6)${gl}`,
    };
  }

  if (kind === 'fate') {
    const r = rollFate();
    return {
      dicePayload: buildFatePayload(r, { label, modifier }),
      content: formatFateMessage(label, modifier, r),
    };
  }

  // JaD skládaný zásah (2k10+2k6+2k4+číslo).
  if (kind === 'mixed') {
    const r = rollMixedDice(req.mixed ?? {});
    return {
      dicePayload: buildMixedPayload(r, { label, modifier }),
      content: formatGenericDiceMessage(label, modifier, r),
    };
  }

  // d4..d100 i eskalující d6+/2d6+ → rollGenericDice; dispatch na nafukovací
  // (`d6+`) / otevřenou (`2d6+`) primitivu je centralizovaný v rollEngine
  // (jejich `+` by jinak neprošel regexem XdN a spadl na default d20).
  const r = rollGenericDice(kind);
  // JaD fatální úspěch/neúspěch: jediná k20, přirozená 20 / 1.
  let crit: 'success' | 'fail' | undefined;
  if (kind === 'd20' && req.critOnD20 && r.rolls.length === 1) {
    if (r.rolls[0] === 20) crit = 'success';
    else if (r.rolls[0] === 1) crit = 'fail';
  }
  return {
    dicePayload: buildGenericPayload(r, { label, modifier, crit }),
    content: formatGenericDiceMessage(label, modifier, r),
  };
}
