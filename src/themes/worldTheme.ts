import type { World } from '@/shared/types';
import { DEFAULT_WORLD_THEME } from './registry';

export interface WorldThemeResult {
  /** Aktivní motiv světa (sdílený základ z `World`). */
  themeId: string;
  overrides?: Record<string, string>;
  backgroundUrl?: string;
}

/**
 * Krok 5.7a — rezolvuje vzhled světa. Vzhled je **jediný a sdílený** —
 * určuje ho PJ přes `World.themeId` (+ custom `themeOverrides` /
 * `themeBackgroundUrl`). Per-uživatel override (krok 5.0e) byl zrušen.
 * Fallback na `ikaros`.
 */
export function resolveWorldTheme(world: World | null): WorldThemeResult {
  return {
    themeId: world?.themeId ?? DEFAULT_WORLD_THEME,
    overrides: world?.themeOverrides,
    backgroundUrl: world?.themeBackgroundUrl,
  };
}
