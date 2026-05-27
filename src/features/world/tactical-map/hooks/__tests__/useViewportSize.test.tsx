/**
 * 10.2a — test pro useViewportSize.
 *
 * ResizeObserver v jsdom je nedostupný; mockujeme ho jednoduchým spy.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useViewportSize } from '../useViewportSize';

describe('useViewportSize', () => {
  let resizeObserverCallback: ResizeObserverCallback | null = null;
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();
    // `new ResizeObserver(cb)` — pojďme dodat constructor-shape mock
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        resizeObserverCallback = cb;
      }
      observe = observeSpy;
      unobserve = vi.fn();
      disconnect = disconnectSpy;
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  it('initial read z clientWidth/Height', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 600, configurable: true });

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(el);
      return useViewportSize(ref);
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
    expect(observeSpy).toHaveBeenCalledWith(el);
  });

  it('cleanup disconnect ResizeObserver na unmount', () => {
    const el = document.createElement('div');
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(el);
      return useViewportSize(ref);
    });
    unmount();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('ref bez elementu → size 0/0, ResizeObserver se neaktivuje', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      return useViewportSize(ref);
    });
    expect(result.current).toEqual({ width: 0, height: 0 });
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('callback updatuje size', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 200, configurable: true });

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(el);
      return useViewportSize(ref);
    });

    expect(result.current).toEqual({ width: 100, height: 200 });
    expect(resizeObserverCallback).not.toBeNull();
  });
});
