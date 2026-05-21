/**
 * Barevné kódování kanálů (kroky 6.1b + 6.5c).
 *
 * **6.1b (auto):** kanál bez explicit `color` dostane deterministicky jeden ze
 * **12 barevných slotů** (`--chat-group-1 … --chat-group-12`) podle hash `id`.
 * Stabilní napříč session — kanál „Evropani" má stejnou barvu vždy.
 *
 * **6.5c (PJ override):** PJ může v `GroupDialog` zvolit explicit slot (`'0'..'11'`).
 * Pak `groupColorVarFor(group)` má prioritu před hashem. Stabilní i po rename
 * kanálu (color je uložené na entitě, nezávislé na `id`).
 */
export const GROUP_COLOR_SLOTS = 12;

/** Index slotu 0–11 pro daný kanál (deterministický hash z `id`). */
export function groupColorSlot(groupId: string): number {
  let hash = 0;
  for (let i = 0; i < groupId.length; i += 1) {
    hash = (hash * 31 + groupId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % GROUP_COLOR_SLOTS;
}

/** CSS proměnná barvy kanálu z hashe `id` — `var(--chat-group-N)`. */
export function groupColorVar(groupId: string): string {
  return `var(--chat-group-${groupColorSlot(groupId) + 1})`;
}

/**
 * CSS proměnná barvy kanálu **s respektem k PJ volbě** (6.5c).
 * Pokud `group.color` je validní slot `'0'..'11'`, použije ho.
 * Jinak fallback na deterministický hash z `id`.
 */
export function groupColorVarFor(group: {
  id: string;
  color?: string;
}): string {
  if (group.color && /^([0-9]|1[01])$/.test(group.color)) {
    return `var(--chat-group-${Number(group.color) + 1})`;
  }
  return groupColorVar(group.id);
}
