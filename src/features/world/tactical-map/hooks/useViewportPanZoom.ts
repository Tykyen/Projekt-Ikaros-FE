/**
 * 10.2a — pan + zoom + persistence hook pro PixiJS plátno.
 *
 * Vrací viewport state + event handlery (wheel, pointer down/move/up) +
 * imperative setZoom/resetZoom pro UI controls. Konzument volá handlery
 * v `useEffect` (binding na viewportRef element).
 *
 * Pan: middle/left mouse drag, 2-finger touch drag (1-finger pan se ne-řeší
 * — kdyby ano, by koliduje s tap-to-select v dalších podkrocích).
 *
 * Zoom: Ctrl/Cmd+wheel cursor-anchored, pinch (2 touch pointers) midpoint-anchored.
 *
 * Persistence (10.2c-edit-5): per-scéna v localStorage pod klíčem
 * `ikaros.map.viewport.<sceneId>` (JSON `{zoom, offsetX, offsetY}`) s 250ms
 * debounce. Při změně `sceneId` se hydratuje stav pro novou scénu (default
 * `{1, 0, 0}` pokud chybí). `sceneId === null` → in-memory only, žádný write.
 *
 * Spec: docs/arch/phase-10/spec-10.2a.md §3.4, §3.5.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { ViewportState } from '../types';

const LS_PREFIX = 'ikaros.map.viewport.';
// 10.2c-edit-5: staré globální klíče (před per-scéna persistence).
// Jednorázový cleanup při prvním mountu hooku.
const LS_LEGACY_ZOOM = 'ikaros.map.zoom';
const LS_LEGACY_OFFSET_X = 'ikaros.map.offsetX';
const LS_LEGACY_OFFSET_Y = 'ikaros.map.offsetY';

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 3;
const PERSIST_DEBOUNCE_MS = 250;
const DEFAULT_VIEWPORT: ViewportState = { zoom: 1, offsetX: 0, offsetY: 0 };

function clampZoom(value: number): number {
  return Math.min(Math.max(value, ZOOM_MIN), ZOOM_MAX);
}

function lsKey(sceneId: string): string {
  return `${LS_PREFIX}${sceneId}`;
}

function hydrateForScene(sceneId: string | null): ViewportState {
  if (!sceneId) return DEFAULT_VIEWPORT;
  try {
    const raw = localStorage.getItem(lsKey(sceneId));
    if (!raw) return DEFAULT_VIEWPORT;
    const parsed = JSON.parse(raw) as Partial<ViewportState>;
    const z = typeof parsed.zoom === 'number' ? parsed.zoom : 1;
    const x = typeof parsed.offsetX === 'number' ? parsed.offsetX : 0;
    const y = typeof parsed.offsetY === 'number' ? parsed.offsetY : 0;
    return {
      zoom: Number.isFinite(z) ? clampZoom(z) : 1,
      offsetX: Number.isFinite(x) ? x : 0,
      offsetY: Number.isFinite(y) ? y : 0,
    };
  } catch {
    return DEFAULT_VIEWPORT;
  }
}

// Cleanup starých globálních klíčů. removeItem je no-op pokud klíč
// neexistuje, takže opakované volání mezi remounty je neškodné.
function cleanupLegacyKeys(): void {
  try {
    localStorage.removeItem(LS_LEGACY_ZOOM);
    localStorage.removeItem(LS_LEGACY_OFFSET_X);
    localStorage.removeItem(LS_LEGACY_OFFSET_Y);
  } catch {
    /* localStorage unavailable — ignore */
  }
}

export interface UseViewportPanZoomResult extends ViewportState {
  onWheel: (e: WheelEvent) => void;
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  /** Přizpůsobí zoom+offset tak, aby `bounds` (map-space bbox) byl celý vidět
   *  a vycentrovaný ve viewportu (contain fit). `vw`/`vh` = rozměr viewportu
   *  (typicky z useViewportSize, ať fit sedí s canvasem); když chybí, čte se
   *  getBoundingClientRect. No-op pokud chybí rozměry. */
  fitToViewport: (
    bounds: { x: number; y: number; width: number; height: number },
    vw?: number,
    vh?: number,
  ) => void;
  /** 10.2f — vycentruje daný bod (map-space, tj. před transformem) do středu
   *  viewportu; zoom se nemění. Plynulý ease-out tween (`durationMs`, default
   *  250); `0` = okamžitý skok. Použito pro klik na iniciativní liště
   *  (pan-to-token). No-op pokud chybí rozměry viewportu. */
  centerOnPoint: (mapX: number, mapY: number, durationMs?: number) => void;
}

export function useViewportPanZoom(
  viewportRef: RefObject<HTMLElement | null>,
  sceneId: string | null,
  /**
   * 10.2g — když `true`, levé tlačítko myši NEpanuje (PJ kreslí efekty
   * tažením — left-drag patří nástroji, ne posunu mapy). Prostřední tlačítko
   * a 2-prsty panují vždy. Čteno přes ref (živá hodnota bez re-bind handlerů).
   */
  suppressLeftPan = false,
): UseViewportPanZoomResult {
  const [state, setState] = useState<ViewportState>(() => {
    cleanupLegacyKeys();
    return hydrateForScene(sceneId);
  });

  const suppressLeftPanRef = useRef(suppressLeftPan);
  useEffect(() => {
    suppressLeftPanRef.current = suppressLeftPan;
  }, [suppressLeftPan]);

  // Live ref pro callbacks bez re-binding
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 10.2f — pan-to-token tween rAF id (deklarováno nahoře, ať ho user gesta
  // níže umí zrušit). Cancel = další klik / pan / wheel přeruší animaci.
  const panAnimRef = useRef<number | null>(null);
  const cancelPanAnim = useCallback(() => {
    if (panAnimRef.current !== null) {
      cancelAnimationFrame(panAnimRef.current);
      panAnimRef.current = null;
    }
  }, []);

  // Re-hydrate při změně scény (přepnutí mezi aktivními scénami)
  const lastSceneIdRef = useRef<string | null>(sceneId);
  useEffect(() => {
    if (lastSceneIdRef.current === sceneId) return;
    lastSceneIdRef.current = sceneId;
    setState(hydrateForScene(sceneId));
  }, [sceneId]);

  // Persist debounced. Pokud sceneId === null → in-memory only.
  useEffect(() => {
    if (!sceneId) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(lsKey(sceneId), JSON.stringify(state));
      } catch {
        /* localStorage quota / privacy mode — ignore */
      }
    }, PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, sceneId]);

  // Wheel zoom (cursor-anchored). Vyžaduje Ctrl/Cmd.
  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      cancelPanAnim(); // user gesto přeruší pan-to-token tween
      const ratio = e.deltaY < 0 ? 1.1 : 0.9;
      const current = stateRef.current;
      const newZoom = clampZoom(current.zoom * ratio);
      if (newZoom === current.zoom) return;

      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) {
        setState({ ...current, zoom: newZoom });
        return;
      }
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const mapX = (screenX - current.offsetX) / current.zoom;
      const mapY = (screenY - current.offsetY) / current.zoom;
      setState({
        zoom: newZoom,
        offsetX: screenX - mapX * newZoom,
        offsetY: screenY - mapY * newZoom,
      });
    },
    [viewportRef, cancelPanAnim],
  );

  // Pan + pinch state
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{
    dist: number;
    zoom: number;
    cx: number;
    cy: number;
  } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent) => {
    // Touch — sleduj pointers, detekuj 2-finger pinch
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (dist > 0) {
          pinchStart.current = {
            dist,
            zoom: stateRef.current.zoom,
            cx: (pts[0].x + pts[1].x) / 2,
            cy: (pts[0].y + pts[1].y) / 2,
          };
        }
        isPanning.current = false;
      }
      return;
    }
    // Mouse — middle (1) vždy pan; left (0) pan jen když není suppress
    // (10.2g: aktivní effect tool kreslí tažením, nesmí panovat).
    if (e.button === 0 && suppressLeftPanRef.current) return;
    if (e.button === 0 || e.button === 1) {
      cancelPanAnim(); // user pan přeruší pan-to-token tween
      isPanning.current = true;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: stateRef.current.offsetX,
        offsetY: stateRef.current.offsetY,
      };
      if (e.button === 1) e.preventDefault(); // suppress autoscroll icon
    }
  }, [cancelPanAnim]);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Pinch zoom
      if (pinchStart.current && activePointers.current.size >= 2) {
        const pts = Array.from(activePointers.current.values()).slice(0, 2);
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (dist <= 0) return;
        const ratio = dist / pinchStart.current.dist;
        const current = stateRef.current;
        const newZoom = clampZoom(pinchStart.current.zoom * ratio);

        const rect = viewportRef.current?.getBoundingClientRect();
        if (!rect) {
          setState({ ...current, zoom: newZoom });
          return;
        }
        const screenX = pinchStart.current.cx - rect.left;
        const screenY = pinchStart.current.cy - rect.top;
        const mapX = (screenX - current.offsetX) / current.zoom;
        const mapY = (screenY - current.offsetY) / current.zoom;
        setState({
          zoom: newZoom,
          offsetX: screenX - mapX * newZoom,
          offsetY: screenY - mapY * newZoom,
        });
        return;
      }

      // Pan (mouse drag)
      if (!isPanning.current) return;
      setState((s) => ({
        ...s,
        offsetX: panStart.current.offsetX + (e.clientX - panStart.current.x),
        offsetY: panStart.current.offsetY + (e.clientY - panStart.current.y),
      }));
    },
    [viewportRef],
  );

  const onPointerUp = useCallback((e: PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
      pinchStart.current = null;
    }
    isPanning.current = false;
  }, []);

  // Imperative setZoom (centered anchor) pro UI tlačítka +/-
  const setZoom = useCallback(
    (next: number) => {
      const clamped = clampZoom(next);
      const rect = viewportRef.current?.getBoundingClientRect();
      const current = stateRef.current;
      if (!rect) {
        setState({ ...current, zoom: clamped });
        return;
      }
      const screenX = rect.width / 2;
      const screenY = rect.height / 2;
      const mapX = (screenX - current.offsetX) / current.zoom;
      const mapY = (screenY - current.offsetY) / current.zoom;
      setState({
        zoom: clamped,
        offsetX: screenX - mapX * clamped,
        offsetY: screenY - mapY * clamped,
      });
    },
    [viewportRef],
  );

  const resetZoom = useCallback(() => {
    setState({ zoom: 1, offsetX: 0, offsetY: 0 });
  }, []);

  // Contain fit: největší zoom, při kterém je celá mapa vidět, + center offset.
  // map-root container má x=offsetX, y=offsetY, scale=zoom; background sedí na
  // (bounds.x, bounds.y) v map-space → screen střed mapy = offset + (bounds
  // střed)*zoom. Řešíme offset tak, aby = viewport střed.
  const fitToViewport = useCallback(
    (
      bounds: { x: number; y: number; width: number; height: number },
      vw?: number,
      vh?: number,
    ) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      const viewW = vw ?? rect?.width ?? 0;
      const viewH = vh ?? rect?.height ?? 0;
      if (viewW <= 0 || viewH <= 0 || bounds.width <= 0 || bounds.height <= 0)
        return;
      const zoom = clampZoom(
        Math.min(viewW / bounds.width, viewH / bounds.height),
      );
      setState({
        zoom,
        offsetX: viewW / 2 - (bounds.x + bounds.width / 2) * zoom,
        offsetY: viewH / 2 - (bounds.y + bounds.height / 2) * zoom,
      });
    },
    [viewportRef],
  );

  // 10.2f — pan-to-token tween. Cíl: bod (mapX, mapY) v map-space → střed
  // viewportu. panAnimRef/cancelPanAnim deklarováno nahoře.
  const centerOnPoint = useCallback(
    (mapX: number, mapY: number, durationMs = 250) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      const viewW = rect?.width ?? 0;
      const viewH = rect?.height ?? 0;
      if (viewW <= 0 || viewH <= 0) return;
      const start = stateRef.current;
      const zoom = start.zoom;
      const targetX = viewW / 2 - mapX * zoom;
      const targetY = viewH / 2 - mapY * zoom;
      cancelPanAnim();
      if (durationMs <= 0) {
        setState({ zoom, offsetX: targetX, offsetY: targetY });
        return;
      }
      const fromX = start.offsetX;
      const fromY = start.offsetY;
      const t0 =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      const tick = (now: number): void => {
        const p = Math.min(1, (now - t0) / durationMs);
        const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setState((s) => ({
          ...s,
          offsetX: fromX + (targetX - fromX) * e,
          offsetY: fromY + (targetY - fromY) * e,
        }));
        panAnimRef.current = p < 1 ? requestAnimationFrame(tick) : null;
      };
      panAnimRef.current = requestAnimationFrame(tick);
    },
    [viewportRef, cancelPanAnim],
  );

  // Zruš tween na unmount.
  useEffect(() => cancelPanAnim, [cancelPanAnim]);

  return {
    ...state,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    setZoom,
    resetZoom,
    fitToViewport,
    centerOnPoint,
  };
}
