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
 * Pool/mixed se z deníku nehází (parita s mapou) → `null`.
 */
import { rollFate, rollGenericDice, rollExplodingD6 } from './rollEngine';
import {
  buildFatePayload,
  buildGenericPayload,
  type DicePayload,
} from './dicePayload';
import { formatFateMessage, formatGenericDiceMessage } from './formatMessage';

/** Typy kostek dovolené z deníkového sheetu — zrcadlí `SystemSheetProps.onRoll`. */
export type DiaryRollKind =
  | 'fate'
  | 'd4'
  | 'd6'
  | 'd6+'
  | 'd8'
  | 'd10'
  | 'd12'
  | 'd20'
  | 'd100';

export interface DiaryRollRequest {
  /** Lidský popisek — jméno schopnosti / „Iniciativa". */
  label: string;
  /** Modifikátor = velikost schopnosti. Default 0. */
  modifier?: number;
  /** Typ kostky. Default `fate` (Matrix/Fate). */
  kind?: DiaryRollKind;
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

  if (kind === 'fate') {
    const r = rollFate();
    return {
      dicePayload: buildFatePayload(r, { label, modifier }),
      content: formatFateMessage(label, modifier, r),
    };
  }

  // DrD 1.6 nafukovací k6 (exploding) — `rollGenericDice('d6+')` by `+` neparsoval
  // a spadl na default d20, proto vlastní větev.
  const r = kind === 'd6+' ? rollExplodingD6() : rollGenericDice(kind);
  return {
    dicePayload: buildGenericPayload(r, { label, modifier }),
    content: formatGenericDiceMessage(label, modifier, r),
  };
}
