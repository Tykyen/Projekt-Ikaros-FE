/**
 * 10.2f — iniciály pro fallback avatar (token bez obrázku, lišta).
 * Vyextrahováno z TokenSprite, ať lišta i token používají stejnou logiku.
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  return (
    name
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('') || '?'
  );
}
