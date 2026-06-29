/**
 * Příběhy Impéria (pi) — konstanty.
 *
 * Osekaný derivát Matrixu: zachovává Schopnosti (trojúhelníkové body) +
 * Aspekty (Nabitý/Vybitý), životy s postihem a jediné políčko Ochrany.
 * NEMÁ jazyky, únavu, přetlaky, runu ani magii (oproti Matrixu).
 */

export interface PiTagValue {
  /** Label (název schopnosti / aspektu). */
  label: string;
  /** Hodnota — úroveň „1"–„10" pro schopnost, „Nabitý"/„Vybitý" pro aspekt. */
  value: string;
}

/**
 * Slovní stupně mistrovství schopnosti (1–10). PC dosáhne max 7 (Legenda),
 * 8–10 jsou nadlidské entity (NPC/Bestie). Tooltip u úrovně ukazuje název.
 */
export const PI_SKILL_LEVELS: Record<number, string> = {
  1: 'Nováček',
  2: 'Učeň',
  3: 'Tovaryš',
  4: 'Zkušený',
  5: 'Mistr oboru',
  6: 'Veterán',
  7: 'Legenda',
  8: 'Hrdina věků',
  9: 'Polobůh',
  10: 'Mýtus',
};

/** Hráč (PC) = lidský strop 7; NPC/Bestie = až 10 (entity). */
export const PI_SKILL_MAX_PC = 7;
export const PI_SKILL_MAX_NPC = 10;

/** Název stupně pro tooltip (clamp 1–10). */
export function piLevelName(lvl: number): string {
  const k = Math.max(1, Math.min(10, Math.round(lvl)));
  return PI_SKILL_LEVELS[k] ?? '';
}
