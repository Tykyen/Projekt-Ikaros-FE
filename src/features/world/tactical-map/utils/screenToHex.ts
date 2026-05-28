/**
 * 10.2c-edit-9a — sjednocený výpočet hexu pod kurzorem z window-relative
 * screen coordinates (`clientX/Y`).
 *
 * Konzumenti: HTML5 drop handler (`React.DragEvent.clientX/Y`) a PixiJS
 * placement-mode pointer handler (po přepočtu `e.global + rect`).
 *
 * Pipeline: window → viewport-local → mapa-space (přes pan+zoom inverse) →
 * `pixelToAxial` → axial hex.
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9a.md §3.1.
 */
import { pixelToAxial } from '../hexUtils';
import type { HexConfig, HexCoord } from '../types';

interface ViewportTransform {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

/**
 * Převede window-relative screen souřadnice na hex pod kurzorem.
 *
 * @param clientX window-relative X (typicky `event.clientX`)
 * @param clientY window-relative Y
 * @param viewportRect bounding rect viewport divu (zachycen `getBoundingClientRect()`)
 * @param panZoom aktuální pan+zoom transform PixiJS root containeru
 * @param config hex grid config (size, originX, originY) ze scény
 */
export function screenToHex(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  panZoom: ViewportTransform,
  config: HexConfig,
): HexCoord {
  const localX = clientX - viewportRect.left;
  const localY = clientY - viewportRect.top;
  const mapX = (localX - panZoom.offsetX) / panZoom.zoom - config.originX;
  const mapY = (localY - panZoom.offsetY) / panZoom.zoom - config.originY;
  return pixelToAxial(mapX, mapY, config.size);
}
