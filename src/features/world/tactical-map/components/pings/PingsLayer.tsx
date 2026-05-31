/**
 * 10.2m — PixiJS renderer pingů (do `layer-pings` containeru).
 *
 * Ping = ephemeral „blik" na ploše: double-click kohokoli na scéně → rozpínající
 * se prstenec + jméno pingujícího, auto-mizí po `TTL_MS`. Není v operation logu
 * (čistě real-time, jako spotlight z 10.2f-3). Souřadnice jsou v map-space, takže
 * layer žije uvnitř transform rootu a markery se panují/zoomují s mapou.
 *
 * Animace: každý `PingMarker` má vlastní `useTick`, mutuje scale (rozpínání) +
 * alpha (fade) přímo na containeru — žádný per-frame React re-render. Po TTL
 * zavolá `onExpire` (guard `expiredRef`, ať jen jednou). Reduced-motion → statický
 * prstenec, jen čeká na expiraci.
 *
 * Spec: docs/arch/phase-10/spec-10.2m.md (m-1).
 */
import type { Graphics as PixiGraphics, Container as PixiContainer, Ticker } from 'pixi.js';
import { useCallback, useRef } from 'react';
import { useTick } from '@pixi/react';
import type { HexConfig, MapThemeColors } from '../../types';

export interface PingMarker {
  id: string;
  /** map-space střed pingu. */
  x: number;
  y: number;
  userName: string;
  /** `performance.now()` při vzniku. */
  born: number;
}

interface Props {
  pings: PingMarker[];
  config: HexConfig;
  theme: MapThemeColors;
  onExpire: (id: string) => void;
}

/** Doba života pingu (ms). */
export const PING_TTL_MS = 2000;

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function PingMarkerView({
  ping,
  baseRadius,
  color,
  onExpire,
}: {
  ping: PingMarker;
  baseRadius: number;
  color: string;
  onExpire: (id: string) => void;
}): React.ReactElement {
  // Prsten (ringRef) se rozpíná + bledne; popisek (labelRef) drží KONSTANTNÍ
  // velikost i pozici a vybledne až na konci — jinak by se „PJ"/jméno celou
  // dobu zvětšovalo a mizelo a bylo nečitelné.
  const ringRef = useRef<PixiContainer | null>(null);
  const labelRef = useRef<PixiContainer | null>(null);
  const expiredRef = useRef(false);

  useTick((_ticker: Ticker) => {
    if (expiredRef.current) return;
    const age = performance.now() - ping.born;
    const t = Math.min(age / PING_TTL_MS, 1);
    if (t >= 1) {
      expiredRef.current = true;
      onExpire(ping.id);
      return;
    }
    if (REDUCED_MOTION) return;
    const ring = ringRef.current;
    if (ring) {
      ring.scale.set(0.4 + t * 1.2); // 0.4 → 1.6 rozpínání
      ring.alpha = 1 - t * t; // ease-out fade
    }
    // Popisek drží plnou viditelnost do 65 %, pak rychle vybledne.
    const label = labelRef.current;
    if (label) label.alpha = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;
  });

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, baseRadius);
      g.stroke({ width: Math.max(2, baseRadius * 0.08), color });
      g.circle(0, 0, baseRadius * 0.35);
      g.fill({ color, alpha: 0.45 });
    },
    [baseRadius, color],
  );

  const fontSize = Math.max(13, Math.round(baseRadius * 0.6));

  return (
    <pixiContainer x={ping.x} y={ping.y} eventMode="none">
      {/* Animovaný prsten (scale + fade) */}
      <pixiContainer ref={ringRef}>
        <pixiGraphics draw={draw} />
      </pixiContainer>
      {/* Stabilní popisek pod pingem — bez scale, fade až na konci */}
      <pixiContainer ref={labelRef} y={baseRadius + fontSize * 0.7}>
        <pixiText
          text={ping.userName}
          x={0}
          y={0}
          anchor={0.5}
          resolution={2}
          style={{
            fontFamily: 'sans-serif',
            fontSize,
            fill: 0xffffff,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 4 },
          }}
        />
      </pixiContainer>
    </pixiContainer>
  );
}

export function PingsLayer({
  pings,
  config,
  theme,
  onExpire,
}: Props): React.ReactElement {
  const baseRadius = config.size * 0.9;
  return (
    <pixiContainer label="pings-content">
      {pings.map((ping) => (
        <PingMarkerView
          key={ping.id}
          ping={ping}
          baseRadius={baseRadius}
          color={theme.pingColor}
          onExpire={onExpire}
        />
      ))}
    </pixiContainer>
  );
}
