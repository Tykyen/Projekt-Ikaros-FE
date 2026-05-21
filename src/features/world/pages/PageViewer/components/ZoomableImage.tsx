import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, Maximize, RefreshCcw } from 'lucide-react';
import s from './ZoomableImage.module.css';

interface Props {
  src: string;
  alt: string;
  /** Klamp limity (default 0.25–5×, step 0.25, jako starý Matrix). */
  minScale?: number;
  maxScale?: number;
  step?: number;
  /** Výška containeru — default `min(70vh, 720px)`. */
  height?: string;
}

/**
 * 7.1b (Rodokmen + Lokace s `bigImage`) — Custom pan/zoom velkých obrázků.
 * Žádná lib, jen `transform: scale(s) translate(x, y)` + drag handler.
 * Controls overlay top-left (frosted glass). Klávesy nahoru/dolů = zoom,
 * šipky = pan, „0" = reset.
 *
 * Mobile: pinch zoom přes wheel-touch? Pro 7.1 zatím jen tlačítka — pinch
 * je dluh (uživatel zatím necítí, viz roadmap-fe.md).
 */
export function ZoomableImage({
  src,
  alt,
  minScale = 0.25,
  maxScale = 5,
  step = 0.25,
  height = 'min(70vh, 720px)',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const clamp = useCallback(
    (v: number) => Math.min(maxScale, Math.max(minScale, v)),
    [maxScale, minScale],
  );

  const zoomIn = useCallback(
    () => setScale((s) => clamp(Math.round((s + step) * 100) / 100)),
    [clamp, step],
  );
  const zoomOut = useCallback(
    () => setScale((s) => clamp(Math.round((s - step) * 100) / 100)),
    [clamp, step],
  );
  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Klávesnice: + / -, šipky, 0 = reset. Aktivní jen pokud container má focus.
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === '+' || k === '=') {
      zoomIn();
      e.preventDefault();
    } else if (k === '-' || k === '_') {
      zoomOut();
      e.preventDefault();
    } else if (k === '0') {
      reset();
      e.preventDefault();
    } else if (k === 'ArrowLeft') {
      setOffset((o) => ({ ...o, x: o.x + 40 }));
      e.preventDefault();
    } else if (k === 'ArrowRight') {
      setOffset((o) => ({ ...o, x: o.x - 40 }));
      e.preventDefault();
    } else if (k === 'ArrowUp') {
      setOffset((o) => ({ ...o, y: o.y + 40 }));
      e.preventDefault();
    } else if (k === 'ArrowDown') {
      setOffset((o) => ({ ...o, y: o.y - 40 }));
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      className={s.container}
      style={{ height }}
      tabIndex={0}
      onKeyDown={onKey}
      role="region"
      aria-label={`Zoomovatelný obrázek: ${alt}`}
    >
      <div
        className={s.canvas}
        onMouseDown={onMouseDown}
        style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={s.image}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        />
      </div>
      <div className={s.controls} role="toolbar" aria-label="Ovládání zoomu">
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Oddálit"
          disabled={scale <= minScale}
        >
          <Minus size={16} aria-hidden />
        </button>
        <span className={s.scaleBadge} aria-live="polite">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Přiblížit"
          disabled={scale >= maxScale}
        >
          <Plus size={16} aria-hidden />
        </button>
        <button type="button" onClick={reset} aria-label="Reset zoomu">
          <RefreshCcw size={14} aria-hidden />
        </button>
      </div>
      <div className={s.hint}>
        <Maximize size={12} aria-hidden /> Drag k posunu • +/− zoom • 0 reset
      </div>
    </div>
  );
}
