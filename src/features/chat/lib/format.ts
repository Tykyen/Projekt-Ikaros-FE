/** Formátuje ISO čas na `HH:MM` (cs-CZ). Prázdný řetězec při neplatném vstupu. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}
