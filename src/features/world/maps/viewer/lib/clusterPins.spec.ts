import { describe, it, expect } from 'vitest';
import { clusterPins } from './clusterPins';
import type { WorldMapPin } from '../../types';

function pin(id: string, x: number, y: number): WorldMapPin {
  return {
    id,
    x,
    y,
    label: id,
    info: '',
    targetType: 'none',
    targetSlug: null,
    targetMapId: null,
    icon: 'marker',
    color: 'cyan',
    isPublic: true,
    visibleToPlayerIds: [],
  };
}

describe('clusterPins', () => {
  const size = { width: 1000, height: 1000 };

  it('blízké piny sloučí do jednoho shluku (nízký zoom)', () => {
    const pins = [pin('a', 0.5, 0.5), pin('b', 0.51, 0.51)];
    const res = clusterPins(pins, { ...size, scale: 1, thresholdPx: 40 });
    expect(res).toHaveLength(1);
    expect(res[0]!.pins).toHaveLength(2);
  });

  it('vzdálené piny zůstanou samostatné', () => {
    const pins = [pin('a', 0.1, 0.1), pin('b', 0.9, 0.9)];
    const res = clusterPins(pins, { ...size, scale: 1, thresholdPx: 40 });
    expect(res).toHaveLength(2);
  });

  it('přiblížení (vyšší scale) rozpadá shluky', () => {
    // Δ=0.01 → 10px při scale 1 (< práh 40 → shluk), 40px při scale 4 (rozpad).
    const pins = [pin('a', 0.5, 0.5), pin('b', 0.51, 0.51)];
    const near = clusterPins(pins, { ...size, scale: 1, thresholdPx: 40 });
    const far = clusterPins(pins, { ...size, scale: 4, thresholdPx: 40 });
    expect(near).toHaveLength(1);
    expect(far).toHaveLength(2);
  });

  it('je deterministický (stejný vstup → stejný výstup)', () => {
    const pins = [pin('a', 0.2, 0.2), pin('b', 0.8, 0.8), pin('c', 0.21, 0.21)];
    const a = clusterPins(pins, { ...size, scale: 1 });
    const b = clusterPins(pins, { ...size, scale: 1 });
    expect(a.map((c) => c.pins.map((p) => p.id))).toEqual(
      b.map((c) => c.pins.map((p) => p.id)),
    );
  });

  it('centroid shluku je průměr pozic', () => {
    const pins = [pin('a', 0.5, 0.5), pin('b', 0.52, 0.5)];
    const res = clusterPins(pins, { ...size, scale: 1, thresholdPx: 60 });
    expect(res).toHaveLength(1);
    expect(res[0]!.x).toBeCloseTo(0.51, 5);
  });
});
