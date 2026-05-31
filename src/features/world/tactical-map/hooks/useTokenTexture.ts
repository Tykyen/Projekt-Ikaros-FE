/**
 * 10.2d — load PixiJS Texture pro token avatar (Assets.load + fallback).
 *
 * Plán: docs/arch/phase-10/plan-10.2d.md C2.
 */
import { useEffect, useState } from 'react';
import { Assets, type Texture } from 'pixi.js';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export function useTokenTexture(imageUrl?: string): {
  texture: Texture | null;
  status: LoadStatus;
} {
  const [state, setState] = useState<{
    texture: Texture | null;
    status: LoadStatus;
  }>({ texture: null, status: 'idle' });

  useEffect(() => {
    if (!imageUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ texture: null, status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ texture: null, status: 'loading' });
    Assets.load(imageUrl)
      .then((tex: Texture) => {
        if (!cancelled) setState({ texture: tex, status: 'loaded' });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ texture: null, status: 'error' });
          console.warn('[useTokenTexture] load failed:', imageUrl);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return state;
}
