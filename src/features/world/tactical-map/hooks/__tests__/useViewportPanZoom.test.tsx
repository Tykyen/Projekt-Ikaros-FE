/**
 * 10.2a — testy pro useViewportPanZoom.
 * 10.2c-edit-5 — rozšířeno o per-scéna LS persistence (`ikaros.map.viewport.<sceneId>`).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { useViewportPanZoom, ZOOM_MIN, ZOOM_MAX } from '../useViewportPanZoom';

const TEST_SCENE_ID = 'scene-A';
const TEST_LS_KEY = `ikaros.map.viewport.${TEST_SCENE_ID}`;

function makeViewport(width = 1000, height = 800): HTMLDivElement {
  const el = document.createElement('div');
  // jsdom nedává clientWidth z DOM, mockujeme getBoundingClientRect
  el.getBoundingClientRect = (): DOMRect =>
    ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return el;
}

function setupHook(
  viewport: HTMLDivElement,
  sceneId: string | null = TEST_SCENE_ID,
) {
  return renderHook(
    ({ id }: { id: string | null }) => {
      const ref = useRef<HTMLDivElement | null>(viewport);
      return useViewportPanZoom(ref, id);
    },
    { initialProps: { id: sceneId } },
  );
}

describe('useViewportPanZoom', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('default zoom=1, offset 0/0 pokud localStorage prázdný', () => {
      const { result } = setupHook(makeViewport());
      expect(result.current.zoom).toBe(1);
      expect(result.current.offsetX).toBe(0);
      expect(result.current.offsetY).toBe(0);
    });

    it('hydrate z localStorage (per-scéna JSON klíč)', () => {
      localStorage.setItem(
        TEST_LS_KEY,
        JSON.stringify({ zoom: 1.5, offsetX: 100, offsetY: -50 }),
      );
      const { result } = setupHook(makeViewport());
      expect(result.current.zoom).toBe(1.5);
      expect(result.current.offsetX).toBe(100);
      expect(result.current.offsetY).toBe(-50);
    });

    it('invalid JSON v localStorage → fallback default', () => {
      localStorage.setItem(TEST_LS_KEY, 'not-json');
      const { result } = setupHook(makeViewport());
      expect(result.current.zoom).toBe(1);
      expect(result.current.offsetX).toBe(0);
      expect(result.current.offsetY).toBe(0);
    });

    it('zoom mimo rozsah z LS se clamp-uje na hydrate', () => {
      localStorage.setItem(
        TEST_LS_KEY,
        JSON.stringify({ zoom: 5, offsetX: 0, offsetY: 0 }),
      );
      const { result } = setupHook(makeViewport());
      expect(result.current.zoom).toBe(ZOOM_MAX);
    });

    it('sceneId=null → default state, žádný LS read', () => {
      localStorage.setItem(
        TEST_LS_KEY,
        JSON.stringify({ zoom: 2, offsetX: 50, offsetY: 50 }),
      );
      const { result } = setupHook(makeViewport(), null);
      expect(result.current.zoom).toBe(1);
      expect(result.current.offsetX).toBe(0);
      expect(result.current.offsetY).toBe(0);
    });

    it('cleanup starých globálních klíčů při prvním mountu', () => {
      localStorage.setItem('ikaros.map.zoom', '1.5');
      localStorage.setItem('ikaros.map.offsetX', '100');
      localStorage.setItem('ikaros.map.offsetY', '-50');
      setupHook(makeViewport());
      // Pozn.: legacy cleanup je module-level (1× per session). V testovém
      // prostředí už mohl proběhnout v předchozím testu — kontrolujeme jen že
      // klíče už nejsou v LS, ne že jsme je smazali zrovna teď.
      expect(localStorage.getItem('ikaros.map.zoom')).toBe(null);
      expect(localStorage.getItem('ikaros.map.offsetX')).toBe(null);
      expect(localStorage.getItem('ikaros.map.offsetY')).toBe(null);
    });
  });

  describe('per-scéna re-hydrate', () => {
    it('změna sceneId → načte nový stav z LS', () => {
      localStorage.setItem(
        'ikaros.map.viewport.scene-A',
        JSON.stringify({ zoom: 1.5, offsetX: 100, offsetY: 0 }),
      );
      localStorage.setItem(
        'ikaros.map.viewport.scene-B',
        JSON.stringify({ zoom: 2.5, offsetX: -200, offsetY: 50 }),
      );

      const { result, rerender } = setupHook(makeViewport(), 'scene-A');
      expect(result.current.zoom).toBe(1.5);
      expect(result.current.offsetX).toBe(100);

      rerender({ id: 'scene-B' });
      expect(result.current.zoom).toBe(2.5);
      expect(result.current.offsetX).toBe(-200);
      expect(result.current.offsetY).toBe(50);
    });

    it('změna sceneId na neznámou scénu → default state', () => {
      localStorage.setItem(
        'ikaros.map.viewport.scene-A',
        JSON.stringify({ zoom: 1.5, offsetX: 100, offsetY: 0 }),
      );
      const { result, rerender } = setupHook(makeViewport(), 'scene-A');
      rerender({ id: 'scene-fresh' });
      expect(result.current.zoom).toBe(1);
      expect(result.current.offsetX).toBe(0);
      expect(result.current.offsetY).toBe(0);
    });
  });

  describe('setZoom (imperative)', () => {
    it('clamp na ZOOM_MIN', () => {
      const { result } = setupHook(makeViewport());
      act(() => result.current.setZoom(0.1));
      expect(result.current.zoom).toBe(ZOOM_MIN);
    });

    it('clamp na ZOOM_MAX', () => {
      const { result } = setupHook(makeViewport());
      act(() => result.current.setZoom(10));
      expect(result.current.zoom).toBe(ZOOM_MAX);
    });

    it('center-anchor — offset zachovává střed', () => {
      // viewport 1000×800; default offset 0/0, zoom 1, střed v map-space (500, 400)
      const { result } = setupHook(makeViewport(1000, 800));
      act(() => result.current.setZoom(2));
      expect(result.current.zoom).toBe(2);
      // map-space střed musí zůstat (500, 400):
      // screenStřed (500, 400) = offset + mapStřed * zoom
      // 500 = offsetX + 500 * 2 → offsetX = -500
      expect(result.current.offsetX).toBe(-500);
      expect(result.current.offsetY).toBe(-400);
    });
  });

  describe('resetZoom', () => {
    it('reset zoom=1, offset 0/0', () => {
      const { result } = setupHook(makeViewport());
      act(() => result.current.setZoom(2));
      act(() => result.current.resetZoom());
      expect(result.current.zoom).toBe(1);
      expect(result.current.offsetX).toBe(0);
      expect(result.current.offsetY).toBe(0);
    });
  });

  describe('onWheel zoom (cursor-anchored)', () => {
    it('vyžaduje ctrl/meta key, jinak ignoruje', () => {
      const { result } = setupHook(makeViewport());
      const evt = new WheelEvent('wheel', { deltaY: -100, ctrlKey: false });
      act(() => result.current.onWheel(evt));
      expect(result.current.zoom).toBe(1); // beze změny
    });

    it('Ctrl+wheel scroll up → zoom in', () => {
      const { result } = setupHook(makeViewport(1000, 800));
      const evt = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
        clientX: 500,
        clientY: 400,
      });
      act(() => result.current.onWheel(evt));
      expect(result.current.zoom).toBe(1.1);
    });

    it('Ctrl+wheel scroll down → zoom out', () => {
      const { result } = setupHook(makeViewport());
      const evt = new WheelEvent('wheel', {
        deltaY: 100,
        ctrlKey: true,
        clientX: 100,
        clientY: 100,
      });
      act(() => result.current.onWheel(evt));
      expect(result.current.zoom).toBe(0.9);
    });

    it('zoom toward cursor — map-bod pod kurzorem zůstává stable', () => {
      const { result } = setupHook(makeViewport(1000, 800));
      // Cursor na (100, 100) ve viewportu, zoom z 1 na 1.1
      const evt = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
        clientX: 100,
        clientY: 100,
      });
      act(() => result.current.onWheel(evt));
      // map-space bod pod kurzorem BĚHEM 1.0 = (100 - 0)/1 = 100
      // map-space bod pod kurzorem PO 1.1 musí být stále 100
      // → newOffsetX = 100 - 100 * 1.1 = -10
      expect(result.current.offsetX).toBeCloseTo(-10, 10);
      expect(result.current.offsetY).toBeCloseTo(-10, 10);
    });
  });

  describe('mouse pan', () => {
    it('left-click drag posune offset o delta', () => {
      const viewport = makeViewport();
      const { result } = setupHook(viewport);

      const down = new PointerEvent('pointerdown', {
        button: 0,
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      });
      act(() => result.current.onPointerDown(down));

      const move = new PointerEvent('pointermove', {
        button: 0,
        pointerType: 'mouse',
        clientX: 150,
        clientY: 120,
      });
      act(() => result.current.onPointerMove(move));

      expect(result.current.offsetX).toBe(50);
      expect(result.current.offsetY).toBe(20);
    });

    it('pointerUp ukončí pan', () => {
      const { result } = setupHook(makeViewport());

      act(() =>
        result.current.onPointerDown(
          new PointerEvent('pointerdown', { button: 0, pointerType: 'mouse', clientX: 0, clientY: 0 }),
        ),
      );
      act(() =>
        result.current.onPointerUp(
          new PointerEvent('pointerup', { button: 0, pointerType: 'mouse' }),
        ),
      );
      // Po pointer up další pointermove nemá efekt
      act(() =>
        result.current.onPointerMove(
          new PointerEvent('pointermove', { clientX: 500, clientY: 500, pointerType: 'mouse' }),
        ),
      );
      expect(result.current.offsetX).toBe(0);
    });
  });

  describe('persist', () => {
    it('persist po debounce do per-scéna JSON klíče', async () => {
      vi.useFakeTimers();
      const { result } = setupHook(makeViewport());
      act(() => result.current.setZoom(2));
      // Před debounce ještě nic
      expect(localStorage.getItem(TEST_LS_KEY)).toBe(null);
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      const raw = localStorage.getItem(TEST_LS_KEY);
      expect(raw).not.toBe(null);
      const parsed = JSON.parse(raw!);
      expect(parsed.zoom).toBe(2);
      vi.useRealTimers();
    });

    it('sceneId=null → žádný persist', async () => {
      vi.useFakeTimers();
      const { result } = setupHook(makeViewport(), null);
      act(() => result.current.setZoom(2));
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(localStorage.getItem(TEST_LS_KEY)).toBe(null);
      // Žádný klíč začínající `ikaros.map.viewport.` nesmí existovat
      const keys = Object.keys(localStorage);
      expect(keys.filter((k) => k.startsWith('ikaros.map.viewport.'))).toEqual([]);
      vi.useRealTimers();
    });
  });
});
