/**
 * 10.2a — testy pro useMapTheme.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { parseHexColor, parsePxNumber, useMapTheme } from '../useMapTheme';

describe('parseHexColor', () => {
  it('parsuje #rrggbb', () => {
    expect(parseHexColor('#ff00aa')).toBe(0xff00aa);
    expect(parseHexColor('#0a0814')).toBe(0x0a0814);
  });

  it('parsuje #rgb na expanded #rrggbb', () => {
    expect(parseHexColor('#fab')).toBe(0xffaabb);
    expect(parseHexColor('#000')).toBe(0x000000);
  });

  it('parsuje rgb(...) drop alpha', () => {
    expect(parseHexColor('rgb(255, 0, 170)')).toBe(0xff00aa);
  });

  it('parsuje rgba(...) drop alpha', () => {
    expect(parseHexColor('rgba(180, 120, 255, 0.3)')).toBe(0xb478ff);
  });

  it('trimuje whitespace', () => {
    expect(parseHexColor('  #ff00aa  ')).toBe(0xff00aa);
  });

  it('neznámý formát → 0x000000', () => {
    expect(parseHexColor('xyz')).toBe(0x000000);
    expect(parseHexColor('')).toBe(0x000000);
  });
});

describe('parsePxNumber', () => {
  it('parsuje "1px"', () => {
    expect(parsePxNumber('1px')).toBe(1);
  });

  it('parsuje "2.5px"', () => {
    expect(parsePxNumber('2.5px')).toBe(2.5);
  });

  it('parsuje "1" (bez px)', () => {
    expect(parsePxNumber('1')).toBe(1);
  });

  it('neplatný vstup → 1', () => {
    expect(parsePxNumber('abc')).toBe(1);
    expect(parsePxNumber('')).toBe(1);
  });
});

describe('useMapTheme', () => {
  beforeEach(() => {
    // Mock getComputedStyle pro řízené hodnoty
    const fakeStyle = {
      getPropertyValue: (name: string): string => {
        const map: Record<string, string> = {
          '--map-canvas-bg': '#0a0814',
          '--map-grid-stroke': 'rgba(180, 120, 255, 0.3)',
          '--map-grid-stroke-width': '1px',
          '--map-token-ring-default': '#3a3550',
          '--map-token-ring-selected': '#b48cff',
          '--map-token-ring-active-turn': '#ffd700',
          '--map-token-hp-bar-bg': 'rgba(0, 0, 0, 0.5)',
          '--map-fog-pj-fill': 'rgba(70, 75, 95, 0.16)',
          '--map-fog-player-fill': 'rgba(170, 180, 200, 0.94)',
          '--map-effect-color-default': 'rgba(180, 120, 255, 0.35)',
          '--map-effect-barrier-fill': 'rgba(255, 220, 40, 0.35)',
          '--map-effect-barrier-glow': 'rgba(255, 210, 0, 0.8)',
          '--map-effect-fire-base': '#ff4444',
          '--map-effect-gas-base': '#22cc44',
          '--map-effect-smoke-base': '#aaaaaa',
          '--map-ping-color': '#b48cff',
          '--map-toolbar-bg': 'rgba(10, 8, 32, 0.85)',
          '--map-toolbar-text': 'rgba(220, 235, 255, 0.9)',
        };
        return map[name] ?? '';
      },
    };
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(
      fakeStyle as unknown as CSSStyleDeclaration,
    );
  });

  it('načte všech 17 polí z CSS vars', () => {
    const { result } = renderHook(() => useMapTheme());
    expect(result.current.canvasBg).toBe(0x0a0814);
    expect(result.current.gridStrokeWidth).toBe(1);
    expect(result.current.tokenRingSelected).toBe(0xb48cff);
    expect(result.current.tokenRingActiveTurn).toBe(0xffd700);
    expect(result.current.effectFireBase).toBe(0xff4444);
    expect(result.current.effectGasBase).toBe(0x22cc44);
    expect(result.current.effectSmokeBase).toBe(0xaaaaaa);
    expect(result.current.gridStroke).toBe('rgba(180, 120, 255, 0.3)');
    expect(result.current.fogPlayerFill).toBe('rgba(170, 180, 200, 0.94)');
  });

  it('re-loaduje při skin-changed custom eventu', () => {
    const { result } = renderHook(() => useMapTheme());
    const before = result.current.canvasBg;

    // Změň mock před re-readem
    const newStyle = {
      getPropertyValue: (name: string): string =>
        name === '--map-canvas-bg' ? '#ffffff' : '',
    };
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(
      newStyle as unknown as CSSStyleDeclaration,
    );

    act(() => {
      window.dispatchEvent(new Event('skin-changed'));
    });

    expect(result.current.canvasBg).toBe(0xffffff);
    expect(result.current.canvasBg).not.toBe(before);
  });

  it('cleanup odpojí MutationObserver + listener', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useMapTheme());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('skin-changed', expect.any(Function));
  });
});
