/**
 * 15.4 — state kreslicího nástroje (anotace na mapě). Drží aktivní druh
 * kresby, barvu a viditelnost. Barva + viditelnost persistované v localStorage
 * (pohodlí napříč scénami); `activeKind` ephemeral.
 *
 * Render kreseb + pointer logika žijí v `TacticalMapView` / `MapDrawingLayer`;
 * tento hook je čistě UI stav.
 */
import { useEffect, useState } from 'react';
import { PALETTE_COLORS } from '../components/effects/effectColors';

export type DrawKind = 'line' | 'arrow' | 'circle' | 'text' | null;
export type DrawVisibility = 'pj' | 'all';

const LS_PREFIX = 'ikr-map-draw-';

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export interface DrawingToolState {
  activeKind: DrawKind;
  setKind: (k: DrawKind) => void;
  color: string;
  setColor: (c: string) => void;
  visibility: DrawVisibility;
  setVisibility: (v: DrawVisibility) => void;
}

export function useDrawingTool(): DrawingToolState {
  const [activeKind, setKind] = useState<DrawKind>(null);
  const [color, setColor] = useState<string>(() =>
    load('color', PALETTE_COLORS[0].value),
  );
  const [visibility, setVisibility] = useState<DrawVisibility>(() =>
    load('visibility', 'all'),
  );

  useEffect(() => save('color', color), [color]);
  useEffect(() => save('visibility', visibility), [visibility]);

  return {
    activeKind,
    setKind,
    color,
    setColor,
    visibility,
    setVisibility,
  };
}
