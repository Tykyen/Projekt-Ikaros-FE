import { describe, it, expect } from 'vitest';
import { screenToHex } from '../screenToHex';
import { axialToPixel } from '../../hexUtils';
import type { HexConfig } from '../../types';

const config: HexConfig = { size: 40, originX: 0, originY: 0, showGrid: true };

function rect(left: number, top: number): DOMRect {
  return {
    left,
    top,
    right: left + 1000,
    bottom: top + 800,
    width: 1000,
    height: 800,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('screenToHex', () => {
  it('origin (zoom=1, offset=0) maps (0,0) to hex (0,0)', () => {
    const result = screenToHex(
      0,
      0,
      rect(0, 0),
      { offsetX: 0, offsetY: 0, zoom: 1 },
      config,
    );
    expect(result).toEqual({ q: 0, r: 0 });
  });

  it('round-trip: axialToPixel → screenToHex returns same hex', () => {
    const target = { q: 3, r: -2 };
    const px = axialToPixel(target.q, target.r, config.size);
    const result = screenToHex(
      px.x,
      px.y,
      rect(0, 0),
      { offsetX: 0, offsetY: 0, zoom: 1 },
      config,
    );
    expect(result).toEqual(target);
  });

  it('viewport offset (rect.left/top) je odečten', () => {
    // mouse at clientX=200,200; viewport offset 200,150 → local 0,0 → hex (0,0)
    const result = screenToHex(
      200,
      150,
      rect(200, 150),
      { offsetX: 0, offsetY: 0, zoom: 1 },
      config,
    );
    expect(result).toEqual({ q: 0, r: 0 });
  });

  it('pan offset se odečte před pixelToAxial', () => {
    // map-root posunutý o (100, 50) → mouse at (100,50) v local = (0,0) v map
    const result = screenToHex(
      100,
      50,
      rect(0, 0),
      { offsetX: 100, offsetY: 50, zoom: 1 },
      config,
    );
    expect(result).toEqual({ q: 0, r: 0 });
  });

  it('zoom 2x: pixel coords se dělí 2', () => {
    // hex (1, 0) v map-space = (√3 * 40, 0) ≈ (69.28, 0). Při zoom=2 = (138.56, 0) screen.
    const target = { q: 1, r: 0 };
    const mapPx = axialToPixel(target.q, target.r, config.size);
    const result = screenToHex(
      mapPx.x * 2,
      mapPx.y * 2,
      rect(0, 0),
      { offsetX: 0, offsetY: 0, zoom: 2 },
      config,
    );
    expect(result).toEqual(target);
  });

  it('zoom 0.5x: pixel coords se násobí 2', () => {
    const target = { q: -2, r: 3 };
    const mapPx = axialToPixel(target.q, target.r, config.size);
    const result = screenToHex(
      mapPx.x * 0.5,
      mapPx.y * 0.5,
      rect(0, 0),
      { offsetX: 0, offsetY: 0, zoom: 0.5 },
      config,
    );
    expect(result).toEqual(target);
  });

  it('config.originX/Y se aplikuje (grid offset uvnitř map-space)', () => {
    const customConfig: HexConfig = {
      size: 40,
      originX: 50,
      originY: 30,
      showGrid: true,
    };
    // mouse at (50, 30) screen → po odečtení origin → (0,0) → hex (0,0)
    const result = screenToHex(
      50,
      30,
      rect(0, 0),
      { offsetX: 0, offsetY: 0, zoom: 1 },
      customConfig,
    );
    expect(result).toEqual({ q: 0, r: 0 });
  });

  it('kombinace pan + zoom + viewport offset', () => {
    // Cílový hex (2, -1). map-space pixel:
    const target = { q: 2, r: -1 };
    const mapPx = axialToPixel(target.q, target.r, config.size);
    const panZoom = { offsetX: 100, offsetY: 80, zoom: 1.5 };
    const viewportLeft = 50;
    const viewportTop = 20;
    // screen coords = mapPx * zoom + pan + viewport offset
    const screenX = mapPx.x * panZoom.zoom + panZoom.offsetX + viewportLeft;
    const screenY = mapPx.y * panZoom.zoom + panZoom.offsetY + viewportTop;
    const result = screenToHex(
      screenX,
      screenY,
      rect(viewportLeft, viewportTop),
      panZoom,
      config,
    );
    expect(result).toEqual(target);
  });
});
