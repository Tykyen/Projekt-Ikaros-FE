import { useCallback, useMemo } from 'react';
import {
  useMembershipAppearance,
  useUpdateAppearance,
} from '../../api/useMembershipAppearance';
import { DEFAULT_SKIN_ID } from '../lib/diceSkins';

/**
 * Krok 6.3e — hook nad `WorldMembership.diceSkinMapping`.
 *
 * Mapování per-typ kostky: `{ default: 'core-obsidian', '1d20': 'elemental-flame' }`.
 * Klíč `default` = fallback pro typy, které nemají vlastní volbu.
 *
 * Render zprávy ale **nepoužívá** aktivní volbu diváka — používá skin
 * zafixovaný se zprávou (`ChatMessage.diceSkin`). Tento hook slouží pro:
 * - send flow odesílatele (vybrat skin pro hod),
 * - skin picker UI (číst aktuální volbu, ukládat změny),
 * - preview v composeru.
 */
export function useDiceSkinMapping(worldId: string) {
  const query = useMembershipAppearance(worldId);
  const update = useUpdateAppearance(worldId);

  const mapping = query.data?.diceSkinMapping ?? null;
  // useMemo: stabilní reference, jinak `?? []` mění deps downstream useCallbacků každý render.
  const jailed = useMemo(() => query.data?.jailedDiceSkins ?? [], [query.data]);

  const getSkin = useCallback(
    (typeKey: string): string => {
      return (
        mapping?.[typeKey] ?? mapping?.default ?? DEFAULT_SKIN_ID
      );
    },
    [mapping],
  );

  const setSkin = useCallback(
    (typeKey: string, skinId: string) => {
      const next: Record<string, string> = { ...(mapping ?? {}) };
      next[typeKey] = skinId;
      update.mutate({ diceSkinMapping: next });
    },
    [mapping, update],
  );

  const resetSkins = useCallback(() => {
    update.mutate({ diceSkinMapping: null });
  }, [update]);

  /**
   * Krok 6.3 D-NEW-dice-jail — toggle uvěznění skinu. Uvězněné skiny se
   * nezobrazují v hlavním gridu skin pickeru, jen v záložce „Vězení".
   */
  const toggleJail = useCallback(
    (skinId: string) => {
      const isJailed = jailed.includes(skinId);
      const next = isJailed
        ? jailed.filter((id) => id !== skinId)
        : [...jailed, skinId];
      update.mutate({ jailedDiceSkins: next });
    },
    [jailed, update],
  );

  const isJailed = useCallback(
    (skinId: string) => jailed.includes(skinId),
    [jailed],
  );

  return {
    mapping,
    jailed,
    getSkin,
    setSkin,
    resetSkins,
    toggleJail,
    isJailed,
    isLoading: query.isLoading,
    isUpdating: update.isPending,
  };
}
