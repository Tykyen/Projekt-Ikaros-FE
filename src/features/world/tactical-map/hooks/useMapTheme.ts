/**
 * 10.2a — načítá `--map-*` CSS proměnné z `document.documentElement` a
 * konvertuje barvy na tvar, který PixiJS přímo konzumuje (hex number pro
 * Application.background a Graphics.fill; rgba string pro Graphics.stroke).
 *
 * Re-load triggery:
 *   1. `MutationObserver` na `<html>` `data-theme` attribute change
 *   2. Custom `'skin-changed'` window event (pojistka pro custom skin switcher)
 *
 * Spec: docs/arch/phase-10/spec-10.2a.md §3.6.
 */
import { useEffect, useState } from 'react';
import type { MapThemeColors } from '../types';

/**
 * Parse barvu z CSS hodnoty na PixiJS hex `number` (0xrrggbb).
 *
 * Podporované formáty:
 * - `#rrggbb` → 0xrrggbb
 * - `#rgb` → 0xrrggbb (expanze)
 * - `rgb(r, g, b)` / `rgba(r, g, b, a)` → 0xrrggbb (alpha dropped) // lint-colors-ignore
 *
 * Fallback (neznámý formát) → `0x000000`.
 */
export function parseHexColor(value: string): number {
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      // Expand #rgb → #rrggbb
      const r = hex[0];
      const g = hex[1];
      const b = hex[2];
      return parseInt(`${r}${r}${g}${g}${b}${b}`, 16) || 0;
    }
    return parseInt(hex, 16) || 0;
  }
  const m = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return ((parseInt(m[1]) & 0xff) << 16) |
           ((parseInt(m[2]) & 0xff) << 8) |
           (parseInt(m[3]) & 0xff);
  }
  return 0x000000;
}

/**
 * Parse px hodnotu (`"1px"`, `"2.5px"`, `"1"`) na number. Fallback `1`.
 */
export function parsePxNumber(value: string): number {
  const num = parseFloat(value.replace('px', '').trim());
  return Number.isFinite(num) ? num : 1;
}

function readThemeFromCSS(): MapThemeColors {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string): string => style.getPropertyValue(name).trim();
  return {
    canvasBg: parseHexColor(v('--map-canvas-bg')),
    gridStroke: v('--map-grid-stroke'),
    gridStrokeWidth: parsePxNumber(v('--map-grid-stroke-width')),
    tokenRingDefault: parseHexColor(v('--map-token-ring-default')),
    tokenRingSelected: parseHexColor(v('--map-token-ring-selected')),
    tokenRingActiveTurn: parseHexColor(v('--map-token-ring-active-turn')),
    tokenRingActiveTurnGlow: parseHexColor(
      v('--map-token-ring-active-turn-glow'),
    ),
    tokenRingSpotlight: parseHexColor(v('--map-token-ring-spotlight')),
    tokenRingSpotlightGlow: parseHexColor(
      v('--map-token-ring-spotlight-glow'),
    ),
    tokenHpBarBg: v('--map-token-hp-bar-bg'),
    fogPjFill: v('--map-fog-pj-fill'),
    fogPlayerFill: v('--map-fog-player-fill'),
    effectColorDefault: v('--map-effect-color-default'),
    effectBarrierFill: v('--map-effect-barrier-fill'),
    effectBarrierGlow: v('--map-effect-barrier-glow'),
    effectFireBase: parseHexColor(v('--map-effect-fire-base')),
    effectGasBase: parseHexColor(v('--map-effect-gas-base')),
    effectSmokeBase: parseHexColor(v('--map-effect-smoke-base')),
    pingColor: v('--map-ping-color'),
    toolbarBg: v('--map-toolbar-bg'),
    toolbarText: v('--map-toolbar-text'),
  };
}

/**
 * React hook — vrací aktuální theme colors + re-loaduje při změně skinu.
 *
 * Hodnoty se přečtou lazily při prvním renderu (initial state factory),
 * pak se sledují přes:
 * - `MutationObserver` na `<html>` `[data-theme]`
 * - `window` event `'skin-changed'`
 */
export function useMapTheme(): MapThemeColors {
  const [theme, setTheme] = useState<MapThemeColors>(readThemeFromCSS);

  useEffect(() => {
    const reload = (): void => setTheme(readThemeFromCSS());

    const observer = new MutationObserver(reload);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    window.addEventListener('skin-changed', reload);

    return () => {
      observer.disconnect();
      window.removeEventListener('skin-changed', reload);
    };
  }, []);

  return theme;
}
