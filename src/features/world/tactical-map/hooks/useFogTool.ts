/**
 * 10.2h — state machine nástroje mlhy (PJ kreslení odhalování / zahalování).
 *
 * `active` = brush tool zapnutý (left-drag kreslí, nepanuje) — session-only.
 * `mode` / `brushSize` persistované v localStorage (pohodlí PJ napříč scénami).
 *
 * Master přepínač „mlha zap/vyp" (scene.fogEnabled) NEpatří sem — je to scéna
 * stav, řeší se `fog.set` mutací. Tento hook je čistě UI stav kreslicího nástroje.
 *
 * Spec: docs/arch/phase-10/spec-10.2h.md.
 */
import { useEffect, useState } from 'react';

export type FogMode = 'reveal' | 'fog';
/** 0 = 1 hex, 1 = r=1 (7 hexů), 2 = r=2 (19 hexů). */
export type FogBrushSize = 0 | 1 | 2;

const LS_PREFIX = 'ikr-map-fog-';

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore (private mode / quota)
  }
}

export interface FogToolState {
  active: boolean;
  setActive: (a: boolean) => void;
  mode: FogMode;
  setMode: (m: FogMode) => void;
  brushSize: FogBrushSize;
  setBrushSize: (s: FogBrushSize) => void;
}

export function useFogTool(): FogToolState {
  const [active, setActive] = useState<boolean>(false);
  const [mode, setMode] = useState<FogMode>(() => load('mode', 'reveal'));
  const [brushSize, setBrushSize] = useState<FogBrushSize>(() =>
    load('size', 0),
  );

  useEffect(() => save('mode', mode), [mode]);
  useEffect(() => save('size', brushSize), [brushSize]);

  return { active, setActive, mode, setMode, brushSize, setBrushSize };
}
