import { useCallback } from 'react';
import { useAtom } from 'jotai';
import type { World } from '@/shared/types';
import { worldThemeOverridesAtom, type WorldThemeValue } from './state';
import { DEFAULT_THEME } from './registry';

export interface UseWorldThemeResult {
  /** Aktivní motiv světa (override nebo sdílený základ). */
  themeId: string;
  overrides?: Record<string, string>;
  backgroundUrl?: string;
  /** True, pokud je aktivní uživatelský override (ne sdílený základ PJ). */
  isOverridden: boolean;
  /** Nastaví osobní override světa na preset `themeId`. */
  setOverride: (themeId: string) => void;
  /** Smaže osobní override — návrat na sdílený základ PJ. */
  reset: () => void;
}

/**
 * Krok 5.0 — rezolvuje aktivní motiv světa.
 *
 * Priorita: uživatelský override (localStorage, per zařízení) → sdílený
 * základ z `World` (`themeId` + custom `themeOverrides` / `themeBackgroundUrl`)
 * → `DEFAULT_THEME` fallback.
 */
export function useWorldTheme(world: World | null): UseWorldThemeResult {
  const [map, setMap] = useAtom(worldThemeOverridesAtom);
  const worldId = world?.id ?? '';
  const override: WorldThemeValue | undefined = worldId
    ? map[worldId]
    : undefined;

  const base: WorldThemeValue = {
    themeId: world?.themeId ?? DEFAULT_THEME,
    overrides: world?.themeOverrides,
    backgroundUrl: world?.themeBackgroundUrl,
  };
  const active = override ?? base;

  const setOverride = useCallback(
    (themeId: string) => {
      if (!worldId) return;
      setMap((m) => ({ ...m, [worldId]: { themeId } }));
    },
    [worldId, setMap],
  );

  const reset = useCallback(() => {
    if (!worldId) return;
    setMap((m) => {
      if (!(worldId in m)) return m;
      const next = { ...m };
      delete next[worldId];
      return next;
    });
  }, [worldId, setMap]);

  return {
    themeId: active.themeId,
    overrides: active.overrides,
    backgroundUrl: active.backgroundUrl,
    isOverridden: override !== undefined,
    setOverride,
    reset,
  };
}
