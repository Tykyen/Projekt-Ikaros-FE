import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Spec 9.2 follow-up — persistence zobrazené pozice kalendáře.
 *
 * Drží `{year, monthIndex}` a ukládá ho do `localStorage` (per svět / per entita),
 * aby se uživatel po refreshi vrátil tam, kde četl děj — ne na „dnešek".
 * Vzor existujícího `calendar-expanded-groups-*` v `CalendarPage`.
 *
 * In-universe roky (např. matrix 2038–2040) se liší od reálného data, proto
 * je klíč per-svět; bez něj by skok na dnešek hráče vykopl z kontextu.
 */
export interface CalendarCursor {
  year: number;
  monthIndex: number;
}

function isCursor(v: unknown): v is CalendarCursor {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as CalendarCursor).year === 'number' &&
    typeof (v as CalendarCursor).monthIndex === 'number'
  );
}

/**
 * @param storageKey klíč v localStorage, nebo `null` (persistence vypnutá, např. než se načte worldId)
 * @param fallback výchozí pozice (typicky dnešní měsíc), volaná jen když uložená hodnota chybí/nevalidní
 */
export function usePersistedCalendarCursor(
  storageKey: string | null,
  fallback: () => CalendarCursor,
): [CalendarCursor, Dispatch<SetStateAction<CalendarCursor>>] {
  const [cursor, setCursor] = useState<CalendarCursor>(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (isCursor(parsed)) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    return fallback();
  });

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cursor));
    } catch {
      /* ignore */
    }
  }, [storageKey, cursor]);

  return [cursor, setCursor];
}
