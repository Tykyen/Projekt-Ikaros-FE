/**
 * 10.2d-B — drag&drop tokens (pointer down/move/up).
 *
 * Drag start: pointerdown na sprite. Window-level pointermove/up pro
 * continuous tracking i mimo viewport. pointerup: snap-to-hex → callback
 * `onDrop(tokenId, q, r)`.
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C4.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import type { FederatedPointerEvent } from 'pixi.js';
import { getGridAdapter } from '../grid';
import type { HexConfig, MapToken, Point } from '../types';

interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

interface Args {
  viewport: ViewportState;
  config: HexConfig;
  onDrop: (tokenId: string, q: number, r: number) => void;
  /**
   * 17.4 — sdílený flag „táhne se token" (živý ref). Nastaví se true na
   * pointerdown tokenu, false na drop/cancel. `useViewportPanZoom` ho čte, aby
   * 1-prstový pan mapy NEstartoval na tokenu (gesto patří tokenu, ne posunu).
   * Vlastní ho rodič (`TacticalMapView`), protože panZoom vzniká PŘED tímto
   * hookem — sdílený ref oba propojí bez ohledu na pořadí.
   */
  isDraggingRef?: MutableRefObject<boolean>;
}

interface DragState {
  token: MapToken;
  startQ: number;
  startR: number;
  /** Posun v mapa-space od původní pozice (pro live preview). */
  delta: Point;
}

export function useTokenDrag({
  viewport,
  config,
  onDrop,
  isDraggingRef,
}: Args): {
  dragState: DragState | null;
  handleTokenPointerDown: (e: FederatedPointerEvent, token: MapToken) => void;
} {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<{
    token: MapToken;
    startScreenX: number;
    startScreenY: number;
  } | null>(null);

  const screenToMapaDelta = useCallback(
    (dxScreen: number, dyScreen: number): Point => ({
      x: dxScreen / viewport.zoom,
      y: dyScreen / viewport.zoom,
    }),
    [viewport.zoom],
  );

  // Window pointermove / pointerup pro tracking i mimo Pixi canvas.
  // Listenery jsou trvalé; checkují `dragRef.current` per call (no-op pokud
  // null = žádný aktivní drag).
  useEffect(() => {
    const handleMove = (e: PointerEvent): void => {
      const start = dragRef.current;
      if (!start) return;
      const dx = e.clientX - start.startScreenX;
      const dy = e.clientY - start.startScreenY;
      setDragState({
        token: start.token,
        startQ: start.token.q,
        startR: start.token.r,
        delta: screenToMapaDelta(dx, dy),
      });
    };
    const handleUp = (e: PointerEvent): void => {
      const start = dragRef.current;
      dragRef.current = null;
      if (isDraggingRef) isDraggingRef.current = false;
      if (!start) {
        setDragState(null);
        return;
      }
      const dx = e.clientX - start.startScreenX;
      const dy = e.clientY - start.startScreenY;
      // Pokud minimální posun, treat jako click (no drop).
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        setDragState(null);
        return;
      }
      const delta = screenToMapaDelta(dx, dy);
      // 15.2 — snap přes adaptér mřížky: aktuální buňka → pixel + delta →
      // nejbližší buňka cílového typu mřížky (hex/square/none).
      const adapter = getGridAdapter(config.gridType);
      const cur = adapter.toPixel(start.token.q, start.token.r, config.size);
      const target = adapter.toCell(
        cur.x + delta.x,
        cur.y + delta.y,
        config.size,
      );
      setDragState(null);
      // Pokud cílová buňka shodná s původní → neukládat.
      if (target.q === start.token.q && target.r === start.token.r) return;
      onDrop(start.token.id, target.q, target.r);
    };
    const handleCancel = (): void => {
      dragRef.current = null;
      if (isDraggingRef) isDraggingRef.current = false;
      setDragState(null);
    };
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [config.size, config.gridType, onDrop, screenToMapaDelta, isDraggingRef]);

  const handleTokenPointerDown = useCallback(
    (e: FederatedPointerEvent, token: MapToken): void => {
      // 10.2c-edit-9e fix — `e.client.x/y` (window-relative) místo `e.global`
      // (canvas-relative). Window pointerup používá `e.clientX/Y` (window),
      // takže předchozí porovnání `clientX - global.x` dalo fake delta =
      // canvas window offset (typicky ~200px dolů kvůli headeru) → token
      // skočil dolů při každém kliku.
      dragRef.current = {
        token,
        startScreenX: e.client.x,
        startScreenY: e.client.y,
      };
      // 17.4 — zaber gesto: viewport pan tenhle prst přeskočí.
      if (isDraggingRef) isDraggingRef.current = true;
      setDragState({
        token,
        startQ: token.q,
        startR: token.r,
        delta: { x: 0, y: 0 },
      });
    },
    [isDraggingRef],
  );

  return { dragState, handleTokenPointerDown };
}
