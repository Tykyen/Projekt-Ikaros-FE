/**
 * 10.2g — state machine palety efektů (PJ kreslení na mapu).
 *
 * Drží aktivní nástroj + jeho parametry. Parametry persistované v localStorage
 * (pohodlí PJ napříč scénami). `activeBarrierId` je ephemeral (kontinuita brush
 * tahu jedné bariéry) — neukládá se.
 *
 * Render efektů a klik-na-hex logika žijí v `TacticalMapView` / `EffectsLayer`;
 * tento hook je čistě UI stav nástroje.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ExplosionRing } from '../types';
import type { TemplateShape } from '../utils/templateGeometry';
import {
  PALETTE_COLORS,
  type ExplosionVariant,
} from '../components/effects/effectColors';

export type EffectTool =
  | 'color'
  | 'barrier'
  | 'explosion'
  | 'template'
  | 'erase'
  | null;
export type BarrierShape = 'brush' | 'circle';

const LS_PREFIX = 'ikr-map-effect-';

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

export interface EffectToolState {
  activeTool: EffectTool;
  setTool: (tool: EffectTool) => void;

  selectedColor: string;
  setSelectedColor: (c: string) => void;

  barrierDC: number;
  setBarrierDC: (dc: number) => void;
  barrierShape: BarrierShape;
  setBarrierShape: (s: BarrierShape) => void;
  barrierRadius: number;
  setBarrierRadius: (r: number) => void;

  explosionRings: ExplosionRing[];
  setExplosionRings: (rings: ExplosionRing[]) => void;
  explosionVariant: ExplosionVariant;
  setExplosionVariant: (v: ExplosionVariant) => void;

  // 15.3 — šablony oblastí (kužel/linie/koule/čtverec → color effect).
  templateShape: TemplateShape;
  setTemplateShape: (s: TemplateShape) => void;
}

export function useEffectTool(): EffectToolState {
  const [activeTool, setActiveToolRaw] = useState<EffectTool>(null);

  const [selectedColor, setSelectedColorRaw] = useState<string>(() =>
    load('color', PALETTE_COLORS[0].value),
  );
  const [barrierDC, setBarrierDCRaw] = useState<number>(() => load('barrierDC', 10));
  const [barrierShape, setBarrierShapeRaw] = useState<BarrierShape>(() =>
    load('barrierShape', 'brush'),
  );
  const [barrierRadius, setBarrierRadiusRaw] = useState<number>(() =>
    load('barrierRadius', 3),
  );

  const [explosionRings, setExplosionRingsRaw] = useState<ExplosionRing[]>(() =>
    load('rings', [
      { radius: 0, damage: 3 },
      { radius: 1, damage: 1 },
    ]),
  );
  const [explosionVariant, setExplosionVariantRaw] = useState<ExplosionVariant>(
    () => load('variant', 'fire'),
  );
  const [templateShape, setTemplateShapeRaw] = useState<TemplateShape>(() =>
    load('templateShape', 'cone'),
  );

  // Persist (debounce zbytečný — settery běží na user akci, ne ve smyčce).
  useEffect(() => save('color', selectedColor), [selectedColor]);
  useEffect(() => save('barrierDC', barrierDC), [barrierDC]);
  useEffect(() => save('barrierShape', barrierShape), [barrierShape]);
  useEffect(() => save('barrierRadius', barrierRadius), [barrierRadius]);
  useEffect(() => save('rings', explosionRings), [explosionRings]);
  useEffect(() => save('variant', explosionVariant), [explosionVariant]);
  useEffect(() => save('templateShape', templateShape), [templateShape]);

  const setTool = useCallback((tool: EffectTool): void => {
    setActiveToolRaw(tool);
  }, []);

  return {
    activeTool,
    setTool,
    selectedColor,
    setSelectedColor: setSelectedColorRaw,
    barrierDC,
    setBarrierDC: setBarrierDCRaw,
    barrierShape,
    setBarrierShape: setBarrierShapeRaw,
    barrierRadius,
    setBarrierRadius: setBarrierRadiusRaw,
    explosionRings,
    setExplosionRings: setExplosionRingsRaw,
    explosionVariant,
    setExplosionVariant: setExplosionVariantRaw,
    templateShape,
    setTemplateShape: setTemplateShapeRaw,
  };
}
