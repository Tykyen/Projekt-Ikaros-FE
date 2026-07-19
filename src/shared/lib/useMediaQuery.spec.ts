import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

/**
 * Gatuje focus trap mobilních chat drawerů (D-17.8-A11Y) — musí věrně sledovat
 * breakpoint včetně změny za běhu (resize/orientace) a úklidu posluchače.
 */

type Listener = () => void;

function installMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initial,
    media: '',
    onchange: null,
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
    dispatchEvent: () => true,
    // legacy API — netestujeme, ale ať objekt vypadá jako MediaQueryList
    addListener: () => {},
    removeListener: () => {},
    /** testovací helper: změní stav a notifikuje posluchače */
    _set(next: boolean) {
      mql.matches = next;
      listeners.forEach((cb) => cb());
    },
    _listenerCount: () => listeners.size,
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return mql;
}

describe('useMediaQuery', () => {
  const original = window.matchMedia;
  beforeEach(() => {
    // reset mezi testy
    // @ts-expect-error — čistíme pro deterministický start
    window.matchMedia = undefined;
  });
  afterEach(() => {
    window.matchMedia = original;
  });

  it('vrátí počáteční match (true)', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(result.current).toBe(true);
  });

  it('vrátí počáteční match (false)', () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(result.current).toBe(false);
  });

  it('reaguje na změnu breakpointu za běhu (resize)', () => {
    const mql = installMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(result.current).toBe(false);

    act(() => mql._set(true));
    expect(result.current).toBe(true);

    act(() => mql._set(false));
    expect(result.current).toBe(false);
  });

  it('odregistruje posluchač při unmountu (bez leaku)', () => {
    const mql = installMatchMedia(true);
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(mql._listenerCount()).toBe(1);

    unmount();

    expect(mql._listenerCount()).toBe(0);
  });

  it('bez matchMedia (SSR / starý prohlížeč) → false, bez pádu', () => {
    // window.matchMedia je undefined (viz beforeEach)
    const { result } = renderHook(() => useMediaQuery('(max-width: 1024px)'));
    expect(result.current).toBe(false);
  });
});
