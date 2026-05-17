import { atomWithStorage } from 'jotai/utils';
import type { ThemeId } from './types';
import { DEFAULT_THEME } from './registry';

export const themeAtom = atomWithStorage<ThemeId>('ikaros.theme', DEFAULT_THEME);

/**
 * Krok 5.0 — uživatelský override světového motivu (per zařízení).
 * `themeId` = zvolený preset; `overrides` / `backgroundUrl` rezervováno pro
 * custom úpravy (editor = krok 5.3f). Mapa keyed `worldId`.
 */
export interface WorldThemeValue {
  themeId: string;
  overrides?: Record<string, string>;
  backgroundUrl?: string;
}

/**
 * Override per svět — keyed `worldId`. Persistováno v localStorage
 * (`ikaros.world-themes`). Chybí-li klíč pro svět → fallback na sdílený
 * základ z `World` (řeší `useWorldTheme`).
 */
export const worldThemeOverridesAtom = atomWithStorage<
  Record<string, WorldThemeValue>
>('ikaros.world-themes', {});
