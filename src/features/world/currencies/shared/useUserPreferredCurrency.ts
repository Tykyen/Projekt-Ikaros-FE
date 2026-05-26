import { useMemo } from 'react';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
import type { WorldCurrencyItem } from '../types';

/**
 * Spec 11.4 §4.7b — per-world hráčova preferovaná měna.
 *
 * Použití: Shop (11.3c) zobrazí všechny ceny v preferované měně. Účty postav
 * (8.x) defaultně nabídnou tuto měnu jako "měnu účtu". Stránka převodníku
 * (11.4) defaultně nastaví `to` = preferovaná měna.
 *
 * Persistence: localStorage pod `ikaros.currency.preferred.<worldId>`.
 * Fallback: pokud uložená měna není v aktuálním `items` seznamu (PJ ji smazal
 * nebo PomocnyPJ změnil základ → kódy stejné, ale uložená měna mezitím
 * neexistuje), `resolvedCode` skočí na **base** (první v items).
 */

const preferredCurrencyAtomFamily = atomFamily((worldId: string) =>
  atomWithStorage<string | null>(`ikaros.currency.preferred.${worldId}`, null),
);

export interface UseUserPreferredCurrencyResult {
  /** Raw uložená hodnota (může být `null` = nikdy nezvoleno). */
  preferredCode: string | null;
  /** Nastaví novou preferenci (persistuje do localStorage). */
  setPreferred: (code: string) => void;
  /** Vždy ne-null code: preferovaná pokud existuje v items, jinak base, jinak `''`. */
  resolvedCode: string;
  /** Plný item odpovídající `resolvedCode`, nebo `null` (žádné měny). */
  resolvedItem: WorldCurrencyItem | null;
}

export function useUserPreferredCurrency(
  worldId: string,
  items: WorldCurrencyItem[],
): UseUserPreferredCurrencyResult {
  const [preferredCode, setPreferred] = useAtom(
    preferredCurrencyAtomFamily(worldId),
  );

  return useMemo(() => {
    const base = items[0] ?? null;
    const stored = preferredCode
      ? (items.find((i) => i.code === preferredCode) ?? null)
      : null;
    const resolvedItem = stored ?? base;
    const resolvedCode = resolvedItem?.code ?? '';
    return { preferredCode, setPreferred, resolvedCode, resolvedItem };
  }, [preferredCode, setPreferred, items]);
}
