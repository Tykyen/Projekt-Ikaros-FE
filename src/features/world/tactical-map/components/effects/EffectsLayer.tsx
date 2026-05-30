/**
 * 10.2g — PixiJS renderer plošných efektů (do `layer-effects` containeru).
 *
 * Port Matrix `MapEffectOverlay.tsx` ze SVG na PixiJS v8. Tři typy:
 *   - `color`     — barevná výplň hexů
 *   - `barrier`   — žlutá výplň + glow + DC text uprostřed
 *   - `explosion` — soustředné rings od středu, barva dle variant tieru,
 *                   per-ring damage text, jemný alpha puls (`useTick`)
 *
 * Klik na efekt (jen `canEdit` = PJ v mazacím režimu) → `onRemoveEffect`.
 *
 * Spec: docs/arch/phase-10/spec-10.2g.md.
 */
import type { Graphics as PixiGraphics, Container as PixiContainer, Ticker } from 'pixi.js';
import { useCallback, useMemo, useRef } from 'react';
import { useTick } from '@pixi/react';
import { axialToPixel, getHexPolyPoints, getHexRing } from '../../hexUtils';
import { getVariantColors } from './effectColors';
import type { HexConfig, MapEffect, MapThemeColors } from '../../types';

interface Props {
  effects: MapEffect[];
  config: HexConfig;
  theme: MapThemeColors;
  /** PJ v mazacím režimu — klik na efekt ho smaže. */
  canEdit: boolean;
  onRemoveEffect: (effectId: string) => void;
}

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Střed hexu v map-space (origin už přičten). */
function hexCenter(q: number, r: number, config: HexConfig): { x: number; y: number } {
  const p = axialToPixel(q, r, config.size);
  return { x: p.x + config.originX, y: p.y + config.originY };
}

// ── Barevná zóna ──────────────────────────────────────────────────────────
function ColorEffect({
  effect,
  config,
  canEdit,
  onRemove,
}: {
  effect: MapEffect;
  config: HexConfig;
  canEdit: boolean;
  onRemove: () => void;
}): React.ReactElement {
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const fill = effect.color ?? 'rgba(255,255,0,0.3)';
      for (const hex of effect.hexes) {
        const c = hexCenter(hex.q, hex.r, config);
        g.poly(getHexPolyPoints(c, config.size * 0.95));
        g.fill({ color: fill, alpha: 0.6 });
      }
    },
    [effect.hexes, effect.color, config],
  );
  // Wrapper container (konzistentní s Barrier/Explosion) — @pixi/react
  // spolehlivě odstraní celý container ze stage při unmountu (smazání efektu);
  // holý <pixiGraphics> mohl po smazání zůstat nakreslený na canvasu.
  return (
    <pixiContainer
      eventMode={canEdit ? 'static' : 'none'}
      cursor={canEdit ? 'pointer' : 'default'}
      onPointerTap={canEdit ? onRemove : undefined}
    >
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

// ── Bariéra ─────────────────────────────────────────────────────────────────
function BarrierEffect({
  effect,
  config,
  theme,
  canEdit,
  onRemove,
}: {
  effect: MapEffect;
  config: HexConfig;
  theme: MapThemeColors;
  canEdit: boolean;
  onRemove: () => void;
}): React.ReactElement | null {
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const hex of effect.hexes) {
        const c = hexCenter(hex.q, hex.r, config);
        // Glow vrstva (širší poly, nízká alpha) — náhrada SVG drop-shadow.
        g.poly(getHexPolyPoints(c, config.size * 1.04));
        g.fill({ color: theme.effectBarrierGlow, alpha: 0.18 });
        g.poly(getHexPolyPoints(c, config.size * 1.01));
        g.fill({ color: theme.effectBarrierFill, alpha: 0.5 });
      }
    },
    [effect.hexes, config, theme.effectBarrierFill, theme.effectBarrierGlow],
  );

  if (effect.hexes.length === 0) return null;

  // DC text uprostřed bariéry (průměr hexů).
  const avgQ = effect.hexes.reduce((s, h) => s + h.q, 0) / effect.hexes.length;
  const avgR = effect.hexes.reduce((s, h) => s + h.r, 0) / effect.hexes.length;
  const center = hexCenter(avgQ, avgR, config);
  const showDC = effect.barrierDC !== undefined && effect.barrierDC > 0;

  return (
    <pixiContainer
      eventMode={canEdit ? 'static' : 'none'}
      cursor={canEdit ? 'pointer' : 'default'}
      onPointerTap={canEdit ? onRemove : undefined}
    >
      <pixiGraphics draw={draw} />
      {showDC && (
        <pixiText
          text={String(effect.barrierDC)}
          x={center.x}
          y={center.y}
          anchor={0.5}
          style={{
            fontFamily: 'monospace',
            fontSize: Math.round(config.size * 0.8),
            fill: 0xffffff,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 4 },
          }}
        />
      )}
    </pixiContainer>
  );
}

// ── Výbuch / oblast ──────────────────────────────────────────────────────────
function ExplosionEffect({
  effect,
  config,
  canEdit,
  onRemove,
}: {
  effect: MapEffect;
  config: HexConfig;
  canEdit: boolean;
  onRemove: () => void;
}): React.ReactElement | null {
  const containerRef = useRef<PixiContainer | null>(null);
  const timeRef = useRef(0);

  // Jemný alpha puls celé skupiny (oheň rychleji, kouř pomaleji). Mutace
  // přímo na containeru — žádný React re-render. Reduced-motion → statická.
  const period =
    effect.variant === 'smoke' ? 2600 : effect.variant === 'gas' ? 2000 : 1300;
  useTick((ticker: Ticker) => {
    if (REDUCED_MOTION || !containerRef.current) return;
    timeRef.current += ticker.deltaMS;
    containerRef.current.alpha = 0.82 + 0.18 * Math.sin(timeRef.current / (period / 6.28));
  });

  // Damage texty (per ring, na prvním hexu). Spočítáno mimo draw (Graphics
  // nekreslí text). Render přes useMemo, ať se nepřepočítává každý frame.
  const labels = useMemo(() => {
    if (!effect.rings || effect.hexes.length === 0) return [];
    const centerHex = effect.hexes[0];
    const excluded = effect.excludedHexes ?? [];
    const out: { key: string; x: number; y: number; damage: number }[] = [];
    for (const ring of effect.rings) {
      const ringHexes = getHexRing(centerHex.q, centerHex.r, ring.radius).filter(
        (h) => !excluded.some((ex) => ex.q === h.q && ex.r === h.r),
      );
      if (ringHexes.length === 0) continue;
      const c = hexCenter(ringHexes[0].q, ringHexes[0].r, config);
      out.push({ key: `r${ring.radius}`, x: c.x, y: c.y, damage: ring.damage });
    }
    return out;
  }, [effect.rings, effect.hexes, effect.excludedHexes, config]);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!effect.rings || effect.hexes.length === 0) return;
      const centerHex = effect.hexes[0];
      const colors = getVariantColors(effect.variant);
      const excluded = effect.excludedHexes ?? [];
      // Od největšího ringu (kreslí se pod menší → překryv jako v Matrixu).
      for (const ring of [...effect.rings].reverse()) {
        const fill = colors[Math.min(ring.radius, colors.length - 1)];
        const ringHexes = getHexRing(centerHex.q, centerHex.r, ring.radius).filter(
          (h) => !excluded.some((ex) => ex.q === h.q && ex.r === h.r),
        );
        for (const hex of ringHexes) {
          const c = hexCenter(hex.q, hex.r, config);
          g.poly(getHexPolyPoints(c, config.size * 0.95));
          g.fill({ color: fill, alpha: 1 });
        }
      }
    },
    [effect.rings, effect.hexes, effect.variant, effect.excludedHexes, config],
  );

  if (!effect.rings || effect.rings.length === 0 || effect.hexes.length === 0)
    return null;

  return (
    <pixiContainer
      ref={containerRef}
      eventMode={canEdit ? 'static' : 'none'}
      cursor={canEdit ? 'pointer' : 'default'}
      onPointerTap={canEdit ? onRemove : undefined}
    >
      <pixiGraphics draw={draw} />
      {labels.map((l) => (
        <pixiText
          key={l.key}
          text={String(l.damage)}
          x={l.x}
          y={l.y}
          anchor={0.5}
          style={{
            fontFamily: 'monospace',
            fontSize: Math.round(config.size * 0.4),
            fill: 0xffffff,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 3 },
          }}
        />
      ))}
    </pixiContainer>
  );
}

export function EffectsLayer({
  effects,
  config,
  theme,
  canEdit,
  onRemoveEffect,
}: Props): React.ReactElement {
  return (
    <pixiContainer label="effects-content">
      {effects.map((effect) => {
        const onRemove = (): void => onRemoveEffect(effect.id);
        switch (effect.type) {
          case 'color':
            return (
              <ColorEffect
                key={effect.id}
                effect={effect}
                config={config}
                canEdit={canEdit}
                onRemove={onRemove}
              />
            );
          case 'barrier':
            return (
              <BarrierEffect
                key={effect.id}
                effect={effect}
                config={config}
                theme={theme}
                canEdit={canEdit}
                onRemove={onRemove}
              />
            );
          case 'explosion':
            return (
              <ExplosionEffect
                key={effect.id}
                effect={effect}
                config={config}
                canEdit={canEdit}
                onRemove={onRemove}
              />
            );
          default:
            return null;
        }
      })}
    </pixiContainer>
  );
}
