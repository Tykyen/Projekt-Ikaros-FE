/**
 * 10.2m — převod window-relative screen souřadnic na **map-space** (content
 * space transform rootu), tj. souřadnicový systém, ve kterém renderují
 * `EffectsLayer`/`TokenLayer`/`PingsLayer` (zahrnuje grid origin).
 *
 * Na rozdíl od `screenToHex` NEodečítá origin a NEzaokrouhluje na hex — vrací
 * přesný bod, kam uživatel klikl (pro ping marker přesně pod kurzorem).
 *
 * Pipeline: window → viewport-local → map-space (inverse pan+zoom).
 */
interface ViewportTransform {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export function screenToMap(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  panZoom: ViewportTransform,
): { x: number; y: number } {
  const localX = clientX - viewportRect.left;
  const localY = clientY - viewportRect.top;
  return {
    x: (localX - panZoom.offsetX) / panZoom.zoom,
    y: (localY - panZoom.offsetY) / panZoom.zoom,
  };
}
