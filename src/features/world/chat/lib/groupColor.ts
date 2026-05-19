/**
 * Barevné kódování kanálů (krok 6.1b). Kanál dostane deterministicky jeden
 * ze 6 barevných slotů (`--chat-group-1 … --chat-group-6`) — harmonická
 * paleta, ne náhodná duha. Slot se odvozuje z `id` kanálu, takže je stabilní.
 */
export const GROUP_COLOR_SLOTS = 6;

/** Index slotu 0–5 pro daný kanál. */
export function groupColorSlot(groupId: string): number {
  let hash = 0;
  for (let i = 0; i < groupId.length; i += 1) {
    hash = (hash * 31 + groupId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % GROUP_COLOR_SLOTS;
}

/** CSS proměnná barvy kanálu — `var(--chat-group-N)`. */
export function groupColorVar(groupId: string): string {
  return `var(--chat-group-${groupColorSlot(groupId) + 1})`;
}
