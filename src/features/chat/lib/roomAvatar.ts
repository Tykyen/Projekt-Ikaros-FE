import type { ChatUser, RoomKey } from './types';

/**
 * Avatar autora zprávy v globálním chatu dle místnosti (4.2e §2).
 *
 * - **Hospoda** — účet (`avatarUrl`).
 * - **Rozcestí** — postava (`characterAvatarUrl`), fallback účet, když hráč
 *   postavu nevyplnil.
 *
 * Zrcadlí pravidlo `UserList` (panel přítomných) i BE snapshot v
 * `resolveSenderIdentity`. Vrací `undefined`, když není žádný obrázek →
 * `MessageItem` padne na iniciálu.
 */
export function roomAvatarFor(
  room: RoomKey,
  u: Pick<ChatUser, 'avatarUrl' | 'characterAvatarUrl'>,
): string | undefined {
  return room === 'hospoda' ? u.avatarUrl : u.characterAvatarUrl ?? u.avatarUrl;
}
