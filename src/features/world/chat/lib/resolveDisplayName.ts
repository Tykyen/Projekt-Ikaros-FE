import type { ChatMessage } from '@/features/chat/lib/types';
import type { WorldMembership } from '@/shared/types';

/**
 * Krok 6.2 — sjednocený fallback pro zobrazení jména odesílatele zprávy.
 *
 * Hierarchie (jako u avatara):
 *   1. NPC override (`overrideName`) — pokud je nastaven, vrátíme ho
 *      (priorita pro reply card i mode chip; PJ má rád, když maska je
 *      napřed před jeho login).
 *   2. Reálné jméno odesílatele (`senderName`) — pokud existuje a
 *      nevypadá jako 24-hex ObjectID (historický BE bug).
 *   3. Recovery z members mapy → `user.username` nebo `characterPath`
 *      pro daného `senderId`.
 *   4. Poslední fallback = `senderName` (i kdyby to byl ObjectID, ať
 *      uživatel vidí aspoň něco).
 *
 * Fáze 8 (postavy) sem přidá další úroveň — pokud zpráva má `characterId`,
 * vezme se `Character.name`. Aktuálně postava neexistuje.
 */

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

export function resolveDisplayName(
  message: Pick<ChatMessage, 'senderId' | 'senderName' | 'overrideName'>,
  members: readonly WorldMembership[],
): string {
  if (message.overrideName) return message.overrideName;
  const sn = message.senderName;
  if (sn && !OBJECT_ID_RE.test(sn)) return sn;
  // Recovery z member listy.
  const m = members.find((x) => x.userId === message.senderId);
  return m?.user?.username || m?.characterPath || sn || '?';
}
