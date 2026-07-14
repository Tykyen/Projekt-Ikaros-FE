/**
 * 21.3a — interaktivní plátno editoru: zoom/pan (wheel + pinch), malování
 * tažením, klik nástroje. Kreslí vektorově přes drawDungeon při každé změně
 * transformace → ostré čáry v každém zoomu (žádné škálování bitmapy).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DrawableDungeon } from '../render/drawDungeon';
import { drawDungeon } from '../render/drawDungeon';
import { EDITOR_HOVER_OUTLINE } from '../render/glyphs';
import { DRAG_TOOLS, type EditorTool } from '../state/editorState';
import styles from './DungeonCanvas.module.css';

/** Základní velikost buňky v map-space px (zoom = scale nad tímhle). */
const CELL_PX = 28;
const MIN_CELL_PX = 5;
const MAX_CELL_PX = 140;
const CLICK_TOLERANCE_PX = 6;

interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
}

export interface DungeonCanvasProps {
  dungeon: DrawableDungeon;
  tool: EditorTool;
  onStrokeStart: () => void;
  onPaint: (x: number, y: number) => void;
  onStrokeEnd: () => void;
  onCellClick: (x: number, y: number) => void;
}

export function DungeonCanvas({
  dungeon,
  tool,
  onStrokeStart,
  onPaint,
  onStrokeEnd,
  onCellClick,
}: DungeonCanvasProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<ViewTransform>({ scale: 1, tx: 0, ty: 0 });
  const rafRef = useRef<number>(0);
  const hoverCellRef = useRef<{ x: number; y: number } | null>(null);
  // Aktivní pointery (pinch = 2 prsty), stav tahu.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{
    mode: 'none' | 'pan' | 'paint' | 'pinch';
    startX: number;
    startY: number;
    moved: boolean;
    lastCell: string | null;
    pinchDist: number;
  }>({ mode: 'none', startX: 0, startY: 0, moved: false, lastCell: null, pinchDist: 0 });
  const [, forceRender] = useState(0);

  const mapW = dungeon.gridWidth * CELL_PX;
  const mapH = dungeon.gridHeight * CELL_PX;

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const { scale, tx, ty } = viewRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tx, dpr * ty);
      drawDungeon(ctx, dungeon, { cellPx: CELL_PX });
      const hover = hoverCellRef.current;
      if (hover) {
        ctx.strokeStyle = EDITOR_HOVER_OUTLINE;
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(hover.x * CELL_PX, hover.y * CELL_PX, CELL_PX, CELL_PX);
      }
    });
  }, [dungeon]);

  /** Přepočet client souřadnic → buňka gridu (nebo null mimo mapu). */
  const cellAt = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const { scale, tx, ty } = viewRef.current;
      const mx = (clientX - rect.left - tx) / scale;
      const my = (clientY - rect.top - ty) / scale;
      const x = Math.floor(mx / CELL_PX);
      const y = Math.floor(my / CELL_PX);
      if (x < 0 || x >= dungeon.gridWidth || y < 0 || y >= dungeon.gridHeight)
        return null;
      return { x, y };
    },
    [dungeon.gridWidth, dungeon.gridHeight],
  );

  /** Fit-to-view (počáteční zobrazení + po změně rozměrů gridu). */
  const fitView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const pad = 24;
    const scale = Math.min(
      (el.clientWidth - pad * 2) / mapW,
      (el.clientHeight - pad * 2) / mapH,
    );
    const clamped = Math.max(
      MIN_CELL_PX / CELL_PX,
      Math.min(MAX_CELL_PX / CELL_PX, scale),
    );
    viewRef.current = {
      scale: clamped,
      tx: (el.clientWidth - mapW * clamped) / 2,
      ty: (el.clientHeight - mapH * clamped) / 2,
    };
    scheduleDraw();
  }, [mapW, mapH, scheduleDraw]);

  // Velikost canvasu dle kontejneru (DPR-aware) + fit při první inicializaci.
  const fittedRef = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(el.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(el.clientHeight * dpr));
      canvas.style.width = `${el.clientWidth}px`;
      canvas.style.height = `${el.clientHeight}px`;
      if (!fittedRef.current) {
        fittedRef.current = true;
        fitView();
      } else {
        scheduleDraw();
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitView, scheduleDraw]);

  // Po změně rozměrů gridu (resize/generátor) přefitni.
  useEffect(() => {
    if (fittedRef.current) fitView();
  }, [mapW, mapH, fitView]);

  useEffect(scheduleDraw, [scheduleDraw]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const v = viewRef.current;
      const next = Math.max(
        MIN_CELL_PX / CELL_PX,
        Math.min(MAX_CELL_PX / CELL_PX, v.scale * factor),
      );
      const k = next / v.scale;
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      viewRef.current = {
        scale: next,
        tx: px - (px - v.tx) * k,
        ty: py - (py - v.ty) * k,
      };
      scheduleDraw();
    },
    [scheduleDraw],
  );

  // Wheel zoom — nativní listener (React onWheel je pasivní, nejde preventDefault).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0012));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const endStrokeIfOpen = useCallback(() => {
    if (gestureRef.current.mode === 'paint') onStrokeEnd();
  }, [onStrokeEnd]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const g = gestureRef.current;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);

    if (pointersRef.current.size === 2) {
      // Druhý prst → pinch; rozmalovaný tah zavři.
      endStrokeIfOpen();
      const [a, b] = [...pointersRef.current.values()];
      g.mode = 'pinch';
      g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      return;
    }
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.moved = false;
    g.lastCell = null;

    const panRequested = tool === 'pan' || e.button === 1;
    if (panRequested) {
      g.mode = 'pan';
      return;
    }
    if (DRAG_TOOLS.has(tool)) {
      g.mode = 'paint';
      onStrokeStart();
      const cell = cellAt(e.clientX, e.clientY);
      if (cell) {
        g.lastCell = `${cell.x},${cell.y}`;
        onPaint(cell.x, cell.y);
      }
    } else {
      // Klik nástroj — vyhodnotí se na pointerup (toleruje drobný pohyb).
      g.mode = 'none';
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const g = gestureRef.current;
    const prev = pointersRef.current.get(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Hover zvýraznění buňky (jen myš, ne touch).
    if (e.pointerType === 'mouse') {
      const cell = cellAt(e.clientX, e.clientY);
      const key = cell ? `${cell.x},${cell.y}` : null;
      const prevKey = hoverCellRef.current
        ? `${hoverCellRef.current.x},${hoverCellRef.current.y}`
        : null;
      if (key !== prevKey) {
        hoverCellRef.current = cell;
        scheduleDraw();
      }
    }

    if (
      Math.hypot(e.clientX - g.startX, e.clientY - g.startY) >
      CLICK_TOLERANCE_PX
    )
      g.moved = true;

    if (g.mode === 'pinch' && pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      if (g.pinchDist > 0) zoomAt(cx, cy, dist / g.pinchDist);
      g.pinchDist = dist;
      return;
    }
    if (g.mode === 'pan' && prev) {
      viewRef.current = {
        ...viewRef.current,
        tx: viewRef.current.tx + (e.clientX - prev.x),
        ty: viewRef.current.ty + (e.clientY - prev.y),
      };
      scheduleDraw();
      return;
    }
    if (g.mode === 'paint') {
      const cell = cellAt(e.clientX, e.clientY);
      if (!cell) return;
      const key = `${cell.x},${cell.y}`;
      if (key !== g.lastCell) {
        g.lastCell = key;
        onPaint(cell.x, cell.y);
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const g = gestureRef.current;
    pointersRef.current.delete(e.pointerId);
    if (g.mode === 'pinch') {
      if (pointersRef.current.size < 2) g.mode = 'none';
      return;
    }
    if (g.mode === 'paint') {
      onStrokeEnd();
      g.mode = 'none';
      return;
    }
    if (g.mode === 'pan') {
      g.mode = 'none';
      return;
    }
    // Klik nástroj (dveře/schody/jáma/dekorace/popisek).
    if (!g.moved && tool !== 'pan') {
      const cell = cellAt(e.clientX, e.clientY);
      if (cell) onCellClick(cell.x, cell.y);
    }
  };

  const onPointerLeave = (): void => {
    if (hoverCellRef.current) {
      hoverCellRef.current = null;
      scheduleDraw();
    }
  };

  const cursor = useMemo(() => {
    if (tool === 'pan') return 'grab';
    return 'crosshair';
  }, [tool]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className={styles.zoomControls}>
        <button
          type="button"
          className={styles.zoomBtn}
          aria-label="Přiblížit"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.25);
            forceRender((n) => n + 1);
          }}
        >
          +
        </button>
        <button
          type="button"
          className={styles.zoomBtn}
          aria-label="Oddálit"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 0.8);
            forceRender((n) => n + 1);
          }}
        >
          −
        </button>
        <button
          type="button"
          className={styles.zoomBtn}
          aria-label="Vycentrovat mapu"
          onClick={fitView}
        >
          ⤢
        </button>
      </div>
    </div>
  );
}
