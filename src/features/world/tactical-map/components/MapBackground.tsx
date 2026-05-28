/**
 * 10.2c — pozadí scény jako PixiJS Sprite v `layer-background`.
 *
 * Načte texturu async z `scene.imageUrl` (BE vrací absolutní URL). Při
 * loadu nebo error: nic se nerenderuje (canvas-bg z theme prosvítá).
 *
 * Pozice (0, 0) v map-space (root container drží transform pro pan/zoom).
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.6.
 */
import { Assets, type Texture, Sprite } from 'pixi.js';
import { extend } from '@pixi/react';
import { useEffect, useRef, useState } from 'react';

extend({ Sprite });

interface Props {
  imageUrl: string;
  /** Multiplier rozměrů sprite vůči native (default 1). */
  scale?: number;
  /** Offset v mapa-space (default 0,0). */
  offsetX?: number;
  offsetY?: number;
  /**
   * 10.2c-edit-5 — callback s native rozměry textury po async loadu.
   * Konzument (TacticalMapView) je propaguje do HexGrid pro lem hexů
   * kolem mapy. `null` = textura ne-načtena / load v průběhu / error.
   */
  onLoad?: (size: { width: number; height: number } | null) => void;
}

export function MapBackground({
  imageUrl,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  onLoad,
}: Props): React.ReactElement | null {
  const [texture, setTexture] = useState<Texture | null>(null);

  // Stable ref pro onLoad — useEffect by jinak re-loadoval texture
  // při každém parent re-renderu (nový callback identity).
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTexture(null);
    onLoadRef.current?.(null);
    if (!imageUrl) return;
    let cancelled = false;
    Assets.load<Texture>(imageUrl)
      .then((tex) => {
        if (!cancelled) {
          setTexture(tex);
          // Multiplier `scale` aplikujeme až tady, ať HexGrid dostane
          // skutečné rozměry sprite v map-space (ne native px textury).
          onLoadRef.current?.({
            width: tex.width * scale,
            height: tex.height * scale,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn('[MapBackground] texture load failed', err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, scale]);

  if (!texture) return null;

  return (
    <pixiSprite
      label="map-background"
      texture={texture}
      x={offsetX}
      y={offsetY}
      scale={scale}
      anchor={0}
    />
  );
}
