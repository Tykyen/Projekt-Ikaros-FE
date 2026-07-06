import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 17.7 — pan/zoom velkého plátna rodokmenu (vzor ZoomableImage). Táhnutí pozadí
 * = posun, kolečko = zoom k pozici kurzoru, tlačítka +/−, „0"/reset = fit.
 * `scaleRef` slouží editoru k přepočtu tažení uzlu (screen delta ÷ scale).
 */
const MIN = 0.3;
const MAX = 2.6;

export interface PanZoom {
  scale: number;
  scaleRef: React.MutableRefObject<number>;
  transform: string;
  onWheel: (e: React.WheelEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  dragging: boolean;
}

export function usePanZoom(
  viewportRef: React.RefObject<HTMLElement | null>,
  contentW: number,
  contentH: number,
): PanZoom {
  const [t, setT] = useState({ s: 1, x: 40, y: 24 });
  const [dragging, setDragging] = useState(false);
  const scaleRef = useRef(1);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );
  scaleRef.current = t.s;

  const fit = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const r = vp.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const s = Math.min(
      (r.width - 48) / contentW,
      (r.height - 48) / contentH,
      1,
    );
    const safe = Number.isFinite(s) && s > 0 ? s : 1;
    setT({
      s: safe,
      x: (r.width - contentW * safe) / 2,
      y: Math.max(16, (r.height - contentH * safe) / 2),
    });
  }, [viewportRef, contentW, contentH]);

  // fit při prvním rozměru + při změně velikosti obsahu
  useEffect(() => {
    fit();
  }, [fit]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const vp = viewportRef.current;
      if (!vp) return;
      const r = vp.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setT((prev) => {
        const ns = Math.min(
          MAX,
          Math.max(MIN, prev.s * (e.deltaY < 0 ? 1.12 : 1 / 1.12)),
        );
        return {
          s: ns,
          x: px - (px - prev.x) * (ns / prev.s),
          y: py - (py - prev.y) * (ns / prev.s),
        };
      });
    },
    [viewportRef],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // jen levé tlačítko a jen pozadí (uzly si event zastaví samy)
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.x, t.y]);

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!drag.current) return;
      setT((prev) => ({
        ...prev,
        x: drag.current!.tx + (e.clientX - drag.current!.x),
        y: drag.current!.ty + (e.clientY - drag.current!.y),
      }));
    }
    function up() {
      drag.current = null;
      setDragging(false);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const zoomIn = useCallback(
    () => setT((p) => ({ ...p, s: Math.min(MAX, p.s * 1.15) })),
    [],
  );
  const zoomOut = useCallback(
    () => setT((p) => ({ ...p, s: Math.max(MIN, p.s / 1.15) })),
    [],
  );

  return {
    scale: t.s,
    scaleRef,
    transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
    onWheel,
    onPointerDown,
    zoomIn,
    zoomOut,
    reset: fit,
    dragging,
  };
}
