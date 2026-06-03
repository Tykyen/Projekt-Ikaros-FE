import type { ChatFeedItem } from '../types';

/** Náhled obsahu zprávy ve feedu (kostka / příloha / prázdné / text). */
export function preview(m: ChatFeedItem): string {
  if (m.isDiceRoll) return '🎲 Hod kostkou';
  const text = (m.content ?? '').trim();
  if (text) return text;
  if (m.attachments && m.attachments.length > 0) return '📎 Příloha';
  return '…';
}

/** Lehký relativní čas (cs) — bez závislosti na date-fns. */
export function formatWhen(value: string | Date, now: number = Date.now()): string {
  const diffMs = now - new Date(value).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'teď';
  if (min < 60) return `před ${min} min`;
  const hod = Math.floor(min / 60);
  if (hod < 24) return `před ${hod} h`;
  const dny = Math.floor(hod / 24);
  if (dny < 7) return `před ${dny} d`;
  return new Date(value).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
  });
}
