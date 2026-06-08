/**
 * Spec 9.2 follow-up — barva kalendáře per entita (NPC/Lokace/PC).
 *
 * Model (analogický chat 6.5c `groupColor`):
 *  - **Auto (default):** entita bez explicit volby dostane deterministicky jeden
 *    z 12 barevných slotů podle hash `characterId`. Stabilní napříč session.
 *    Řeší čitelnost agregovaného PJ kalendáře (stovky lokací jinak všechny modré).
 *  - **Override:** PJ (NPC/Lokace) nebo hráč (svá PC) zvolí slot `'0'..'11'`.
 *    Uložené v `CharacterCalendar.color` → priorita před hashem.
 *
 * Paleta = sdílené tokeny `--chat-group-1..12` (12 vizuálně odlišených odstínů
 * laděných na skin). Legacy HEX hodnoty (starý nativní color input) jsou
 * respektované jako override; výchozí modrá z BE schématu se bere jako „auto".
 */
export const CALENDAR_COLOR_SLOTS = 12;

/** Výchozí (legacy) barva z BE schématu — bereme ji jako „nezvoleno" → auto. */
const LEGACY_DEFAULT = '#3b82f6'; // lint-colors-ignore

const SLOT_RE = /^([0-9]|1[01])$/;
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

/** Index slotu 0–11 pro daný seed (deterministický hash z `id`). */
export function calendarColorSlot(seedId: string): number {
  let hash = 0;
  for (let i = 0; i < seedId.length; i += 1) {
    hash = (hash * 31 + seedId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % CALENDAR_COLOR_SLOTS;
}

/** CSS barva slotu (1-based token). */
export function slotColorVar(slot: number): string {
  return `var(--chat-group-${slot + 1})`;
}

/**
 * Vyřeš zobrazovanou CSS barvu entity v kalendáři.
 * @param seedId stabilní id pro auto-hash (characterId)
 * @param color uložená hodnota `CharacterCalendar.color` (slot / legacy HEX / prázdné)
 */
export function resolveCalendarColor(seedId: string, color?: string): string {
  if (color && SLOT_RE.test(color)) return slotColorVar(Number(color));
  if (color && HEX_RE.test(color) && color.toLowerCase() !== LEGACY_DEFAULT) {
    return color; // legacy/custom HEX override
  }
  return slotColorVar(calendarColorSlot(seedId));
}

/** True, pokud `color` je explicit volba (ne auto). Pro UI „aktivní swatch". */
export function isExplicitCalendarColor(color?: string): boolean {
  if (!color) return false;
  if (SLOT_RE.test(color)) return true;
  return HEX_RE.test(color) && color.toLowerCase() !== LEGACY_DEFAULT;
}
