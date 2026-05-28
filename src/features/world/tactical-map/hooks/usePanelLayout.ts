/**
 * 10.2c-edit-9g — panel pozice (drag mode) + šířka (dock mode).
 *
 * Drag pozice: relative center, persistuje `{x, y}` v localStorage.
 * Dock šířka: persistuje number v localStorage.
 *
 * Mirror Matrix `CharacterDiary.tsx:74-79` (localStorage `diary-pos-char`).
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9g.md §A.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// 10.2c-edit-9g — bumped (v2) — reset starých drag pozic (mohly schovat panel mimo viewport)
const LS_POS = 'ikr-token-panel-pos-v2';
const LS_WIDTH = 'ikr-token-panel-width-v2';

const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 320;
const MAX_WIDTH = 700;

function loadPos(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  try {
    const raw = localStorage.getItem(LS_POS);
    if (!raw) return { x: 0, y: 0 };
    const p = JSON.parse(raw);
    if (typeof p.x === 'number' && typeof p.y === 'number') return p;
  } catch {
    // ignore
  }
  return { x: 0, y: 0 };
}

function loadWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_WIDTH;
  try {
    const raw = localStorage.getItem(LS_WIDTH);
    if (raw) {
      const n = Number(raw);
      if (!isNaN(n) && n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDTH;
}

export function usePanelLayout(): {
  position: { x: number; y: number };
  width: number;
  isDragging: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.PointerEvent) => void;
} {
  const [position, setPosition] = useState(loadPos);
  const [width, setWidth] = useState(loadWidth);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementStartRef = useRef({ x: 0, y: 0 });

  // Resize state (dock width)
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Persist debounce
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS_POS, JSON.stringify(position));
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [position]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS_WIDTH, String(width));
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [width]);

  const onDragStart = useCallback(
    (e: React.PointerEvent): void => {
      // Ignore drag pokud kliknul na button / input uvnitř headeru
      if (
        (e.target as HTMLElement).closest(
          'button, input, textarea, [data-no-drag]',
        )
      ) {
        return;
      }
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      elementStartRef.current = { ...position };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position],
  );

  const onDragMove = useCallback((e: React.PointerEvent): void => {
    if (!resizeRef.current && !isDraggingRef.current) return;

    if (resizeRef.current) {
      // Resize handler — dock width.
      // Resize handle je na LEVÉ hraně dock panelu (panel je right-side).
      // Drag doleva = roste width, drag doprava = klesá width.
      const dx = e.clientX - resizeRef.current.startX;
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, resizeRef.current.startWidth - dx),
      );
      setWidth(newWidth);
      return;
    }

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Bounded — alespoň 80px panel musí být na obrazovce
      const margin = 80;
      const maxX = window.innerWidth - margin;
      const maxY = window.innerHeight - margin;
      const minX = -DEFAULT_WIDTH + margin;
      const minY = 0;

      setPosition({
        x: Math.max(minX, Math.min(maxX, elementStartRef.current.x + dx)),
        y: Math.max(minY, Math.min(maxY, elementStartRef.current.y + dy)),
      });
    }
  }, []);

  // Ref pro isDragging — useCallback closure capture
  const isDraggingRef = useRef(false);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const onDragEnd = useCallback((e: React.PointerEvent): void => {
    if (isDraggingRef.current) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    if (resizeRef.current) {
      resizeRef.current = null;
    }
  }, []);

  const onResizeStart = useCallback(
    (e: React.PointerEvent): void => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startWidth: width };
      // Bind global pointermove/up
      const move = (ev: PointerEvent): void => {
        if (!resizeRef.current) return;
        const dx = ev.clientX - resizeRef.current.startX;
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, resizeRef.current.startWidth - dx),
        );
        setWidth(newWidth);
      };
      const up = (): void => {
        resizeRef.current = null;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [width],
  );

  return {
    position,
    width,
    isDragging,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
  };
}
