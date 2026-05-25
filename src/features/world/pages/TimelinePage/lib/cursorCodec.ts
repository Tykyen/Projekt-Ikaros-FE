/**
 * 9.3 — opaque cursor codec mirror BE `lib/timeline-cursor.ts`.
 *
 * FE typicky jen propaguje `nextCursor` z BE response → `fetchNextPage`.
 * Tento modul slouží pro testy + budoucí debug (např. zobrazit cursor
 * v UI při fault tracingu).
 */
export interface TimelineCursor {
  year: number;
  month: number;
  day: number;
  /** `-1` sentinel pro null hodinu (mirror BE). */
  hour: number;
  id: string;
}

function toBase64Url(s: string): string {
  // Window btoa kompatibilní replacement (Node `Buffer` neexistuje v browseru).
  const b64 =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(s)))
      : Buffer.from(s, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice((b64.length + 3) % 4);
  if (typeof atob === 'function') {
    return decodeURIComponent(escape(atob(padded)));
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function encodeCursor(cursor: TimelineCursor): string {
  return toBase64Url(JSON.stringify(cursor));
}

export function decodeCursor(raw: string): TimelineCursor | null {
  try {
    const parsed = JSON.parse(fromBase64Url(raw));
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.year !== 'number' ||
      typeof parsed.month !== 'number' ||
      typeof parsed.day !== 'number' ||
      typeof parsed.hour !== 'number' ||
      typeof parsed.id !== 'string'
    ) {
      return null;
    }
    return parsed as TimelineCursor;
  } catch {
    return null;
  }
}
