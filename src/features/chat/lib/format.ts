const TIME_OPTS = { hour: '2-digit', minute: '2-digit' } as const;

/** Formátuje ISO čas na `HH:MM` (cs-CZ). Prázdný řetězec při neplatném vstupu. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('cs-CZ', TIME_OPTS);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Datum-aware štítek zprávy — hráč po očku pozná STÁŘÍ příspěvku, ne jen čas:
 * dnes → `HH:MM` · včera → `včera HH:MM` · letos starší → `D. M. HH:MM` ·
 * jiný rok → `D. M. YYYY HH:MM`. Prázdný řetězec při neplatném vstupu.
 */
export function formatChatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString('cs-CZ', TIME_OPTS);
  const now = new Date();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (dayDiff <= 0) return time; // dnes (i drobný drift do budoucna)
  if (dayDiff === 1) return `včera ${time}`;
  const date = d.toLocaleDateString(
    'cs-CZ',
    d.getFullYear() === now.getFullYear()
      ? { day: 'numeric', month: 'numeric' }
      : { day: 'numeric', month: 'numeric', year: 'numeric' },
  );
  return `${date} ${time}`;
}

/** Plný datum+čas pro tooltip (`title`). */
export function formatChatFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
