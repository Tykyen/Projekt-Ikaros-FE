/**
 * 15.4 — renderer anotací (kreseb) na mapě: čára / šipka / kruh / text.
 *
 * Souřadnice v map-space px (`points`), layer žije uvnitř transform rootu
 * (pan/zoom s mapou). Viditelnost: `all` vidí všichni; `pj` jen PJ; vlastní
 * kresbu vidí i její autor. Když je kreslicí nástroj aktivní (`removable`),
 * klik na vlastní/PJ kresbu ji smaže (vzor effect erase).
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.3.
 */
import type {
  Graphics as PixiGraphics,
  FederatedPointerEvent,
} from 'pixi.js';
import { useCallback } from 'react';
import { parseHexColor } from '../hooks/useMapTheme';
import type { MapDrawing, MapThemeColors } from '../types';

const STROKE = 4;

function DrawingView({
  drawing,
  removable,
  onRemove,
}: {
  drawing: MapDrawing;
  removable: boolean;
  onRemove: (id: string) => void;
}): React.ReactElement | null {
  const color = parseHexColor(drawing.color);
  const p = drawing.points;

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (drawing.kind === 'line' || drawing.kind === 'arrow') {
        if (p.length < 4) return;
        g.moveTo(p[0], p[1]);
        g.lineTo(p[2], p[3]);
        g.stroke({ color, width: STROKE, alpha: 0.95 });
        if (drawing.kind === 'arrow') {
          // Hrot šipky na konci (p2,p3).
          const ang = Math.atan2(p[3] - p[1], p[2] - p[0]);
          const head = 16;
          const spread = Math.PI / 7;
          g.moveTo(p[2], p[3]);
          g.lineTo(
            p[2] - head * Math.cos(ang - spread),
            p[3] - head * Math.sin(ang - spread),
          );
          g.moveTo(p[2], p[3]);
          g.lineTo(
            p[2] - head * Math.cos(ang + spread),
            p[3] - head * Math.sin(ang + spread),
          );
          g.stroke({ color, width: STROKE, alpha: 0.95 });
        }
      } else if (drawing.kind === 'circle') {
        if (p.length < 4) return;
        const radius = Math.hypot(p[2] - p[0], p[3] - p[1]);
        g.circle(p[0], p[1], radius);
        g.stroke({ color, width: STROKE, alpha: 0.95 });
      }
    },
    [drawing.kind, p, color],
  );

  const handleTap = (e: FederatedPointerEvent): void => {
    e.stopPropagation();
    onRemove(drawing.id);
  };

  // Text je samostatný case (Graphics nekreslí text).
  if (drawing.kind === 'text') {
    if (p.length < 2) return null;
    return (
      <pixiContainer
        x={p[0]}
        y={p[1]}
        eventMode={removable ? 'static' : 'none'}
        cursor={removable ? 'pointer' : 'default'}
        onPointerTap={removable ? handleTap : undefined}
      >
        <pixiText
          text={drawing.text ?? ''}
          anchor={0.5}
          resolution={2}
          style={{
            fontFamily: 'sans-serif',
            fontSize: 22,
            fill: color,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 4 },
          }}
        />
      </pixiContainer>
    );
  }

  return (
    <pixiContainer
      eventMode={removable ? 'static' : 'none'}
      cursor={removable ? 'pointer' : 'default'}
      onPointerTap={removable ? handleTap : undefined}
    >
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

interface Props {
  drawings: MapDrawing[];
  theme: MapThemeColors;
  isPJ: boolean;
  currentUserId: string | null;
  /** Kreslicí nástroj aktivní → klik na vlastní/PJ kresbu ji smaže. */
  removable: boolean;
  onRemove: (id: string) => void;
}

export function MapDrawingLayer({
  drawings,
  isPJ,
  currentUserId,
  removable,
  onRemove,
}: Props): React.ReactElement {
  return (
    <pixiContainer label="drawings-content">
      {drawings.map((d) => {
        const mine = !!currentUserId && d.createdByUserId === currentUserId;
        // Viditelnost: `all` všichni; `pj` jen PJ; vlastní vidí autor.
        if (d.visibility === 'pj' && !isPJ && !mine) return null;
        const canRemove = isPJ || mine;
        return (
          <DrawingView
            key={d.id}
            drawing={d}
            removable={removable && canRemove}
            onRemove={onRemove}
          />
        );
      })}
    </pixiContainer>
  );
}
