import type { ChatUser } from './types';

/** Minimum z aktuálního uživatele potřebné pro presence (avatar + jméno). */
export interface SelfUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Seznam přítomných pro UI — dedup dle `userId` + self-include (4.2c §1).
 *
 * Aktuálního uživatele přidá na začátek, pokud v `raw` chybí: BE ho zaeviduje
 * až po `room:join`, jenže `room-info` REST se na FE stáhne dřív (bere z něj
 * `channelId`). V místnosti přitom uživatel je od mountu — proto se doplní,
 * ať se vidí hned, bez refreshe.
 */
export function presentUsers(
  raw: ChatUser[] | undefined,
  self: SelfUser | null,
): ChatUser[] {
  const seen = new Set<string>();
  const list = (raw ?? []).filter((u) => {
    if (seen.has(u.userId)) return false;
    seen.add(u.userId);
    return true;
  });
  if (self && !seen.has(self.id)) {
    list.unshift({
      userId: self.id,
      username: self.username,
      avatarUrl: self.avatarUrl,
    });
  }
  return list;
}
