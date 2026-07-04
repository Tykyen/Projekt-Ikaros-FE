import type { WorldMapPin } from '../../types';

export interface PinClusterItem {
  /** Stabilní klíč (id prvního pinu ve shluku). */
  id: string;
  /** Centroid 0..1. */
  x: number;
  y: number;
  pins: WorldMapPin[];
}

interface ClusterOpts {
  /** Zobrazená šířka/výška obrázku v px (bez zoomu). */
  width: number;
  height: number;
  /** Aktuální zoom (1 = bez přiblížení). */
  scale: number;
  /** Prahová vzdálenost na obrazovce v px, pod kterou se piny slučují. */
  thresholdPx?: number;
}

/**
 * 16.5 — shlukování vlaječek pro hustou mapu (~100 pinů). Greedy: pin se přidá
 * do prvního shluku, jehož centroid je na obrazovce blíž než práh; jinak založí
 * nový. Vzdálenost počítá v px displeje (× zoom) → přiblížení shluky rozpadá.
 * Deterministické (pořadí vstupu), bez Math.random.
 */
export function clusterPins(
  pins: WorldMapPin[],
  { width, height, scale, thresholdPx = 40 }: ClusterOpts,
): PinClusterItem[] {
  const clusters: PinClusterItem[] = [];
  const sx = width * scale;
  const sy = height * scale;
  for (const pin of pins) {
    let placed = false;
    for (const c of clusters) {
      const dx = (pin.x - c.x) * sx;
      const dy = (pin.y - c.y) * sy;
      if (Math.hypot(dx, dy) < thresholdPx) {
        c.pins.push(pin);
        // Přepočítej centroid inkrementálně.
        const n = c.pins.length;
        c.x += (pin.x - c.x) / n;
        c.y += (pin.y - c.y) / n;
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push({ id: pin.id, x: pin.x, y: pin.y, pins: [pin] });
    }
  }
  return clusters;
}
