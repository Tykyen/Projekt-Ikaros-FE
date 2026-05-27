/**
 * 10.2a — sleduje rozměr DOM elementu přes `ResizeObserver`.
 * Použit v `TacticalMapView` pro `<Application width={...} height={...}>`.
 *
 * Spec: docs/arch/phase-10/spec-10.2a.md §3.3.
 */
import { useEffect, useState, type RefObject } from 'react';

export function useViewportSize(
  ref: RefObject<HTMLElement | null>,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = (): void => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, [ref]);

  return size;
}
