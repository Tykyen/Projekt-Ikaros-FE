import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ThemeId } from './types';
import { DEFAULT_THEME } from './registry';

/** Platformový motiv uživatele (vzhled platformy Ikaros). */
export const themeAtom = atomWithStorage<ThemeId>('ikaros.theme', DEFAULT_THEME);

/** Krok 5.7b/5.9 — efemérní náhled vzhledu světa pro editory. */
export interface WorldThemePreview {
  themeId: string;
  overrides?: Record<string, string>;
  backgroundUrl?: string;
  /** Krok 5.9 — uživatelské doladění (jas / kontrast / síla pozadí). */
  adjust?: { brightness?: number; contrast?: number; bgDim?: number };
}

/**
 * Krok 5.7b — náhledový stav vzhledu světa. `null` = bez náhledu (svět běží
 * podle `World`). Editor vzhledu sem během editace publikuje aktuální volbu;
 * `WorldLayout` ji upřednostní. Není perzistováno — vyčistí se opuštěním editoru.
 */
export const worldThemePreviewAtom = atom<WorldThemePreview | null>(null);

/** Krok 5.9 — efemérní náhled doladění vzhledu platformy (editor v profilu). */
export interface PlatformThemePreview {
  overrides?: Record<string, string>;
  adjust?: { brightness?: number; contrast?: number; bgDim?: number };
  /** Spec 5.9c — živý náhled velikosti rozhraní (CSS `zoom`, 1.0–1.5). */
  uiScale?: number;
}
export const platformThemePreviewAtom = atom<PlatformThemePreview | null>(null);

/**
 * „Kdo vlastní `:root`" — `true`, dokud je mountnutý `WorldLayout`.
 *
 * Theme na `:root` aplikují dva nezávislé zdroje: `ThemeProvider` (globální
 * motiv) a `WorldLayout` (skin světa). Při odchodu z profilu do světa vynulování
 * `platformThemePreviewAtom` znovu spustí `ThemeProvider.applyTheme(globální)`,
 * který by jako poslední přepsal world skin (race → svět dostal globální barvy).
 * Dokud je tento flag `true`, `ThemeProvider` globální `applyTheme` přeskočí —
 * `:root` vlastní výhradně svět.
 */
export const worldThemeActiveAtom = atom(false);
