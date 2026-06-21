/**
 * 15.3 — stupnice (měřítko) po okraji mapy. „Ohraničí" mapu pravítkem se
 * značkami po buňkách a popiskem v jednotkách scény (`unitsPerCell`/`unitLabel`).
 * Viditelná všem (z `config`), gate `config.showScale !== false` + existující
 * `mapBounds` (bez mapy nemá měřítko smysl).
 *
 * Rozteč značek = rozteč buňky daného typu mřížky (z `GridAdapter.toPixel`):
 * square = `size`, hex flat-top = `√3·size` (X) / `1,5·size` (Y). Jedna buňka =
 * `unitsPerCell` jednotek; popisek po 5 buňkách udává vzdálenost od rohu mapy.
 *
 * Žije uvnitř transform rootu (pan/zoom s mapou) jako vlastní layer.
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.2.
 */
import type { Graphics as PixiGraphics } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { getGridAdapter } from '../grid';
import type { MapBounds } from './HexGrid';
import type { HexConfig, MapThemeColors } from '../types';

interface Props {
  config: HexConfig;
  theme: MapThemeColors;
  mapBounds: MapBounds | null;
}

const MINOR_TICK = 6;
const MAJOR_TICK = 13;
const MAJOR_EVERY = 5;

/** Formát čísla bez zbytečných nul (7.5 → „7,5", 3 → „3"). */
function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}

interface TickAxis {
  /** Indexy major značek (k) + jejich pozice v px a hodnota od rohu. */
  majors: { pos: number; value: number }[];
  /** Pozice všech minor značek v px. */
  minors: number[];
}

/** Spočítá značky podél jedné osy v rozsahu [min,max], rozteč `pitch`, origin. */
function axisTicks(
  min: number,
  max: number,
  pitch: number,
  origin: number,
  unitsPerCell: number,
): TickAxis {
  const majors: { pos: number; value: number }[] = [];
  const minors: number[] = [];
  if (pitch <= 0) return { majors, minors };
  const kStart = Math.ceil((min - origin) / pitch);
  const kEnd = Math.floor((max - origin) / pitch);
  // Bezpečnostní strop (velmi malá buňka × obří mapa).
  if (kEnd - kStart > 2000) return { majors, minors };
  for (let k = kStart; k <= kEnd; k++) {
    const pos = origin + k * pitch;
    minors.push(pos);
    if ((k - kStart) % MAJOR_EVERY === 0) {
      majors.push({ pos, value: (k - kStart) * unitsPerCell });
    }
  }
  return { majors, minors };
}

export function MapScaleFrame({
  config,
  theme,
  mapBounds,
}: Props): React.ReactElement | null {
  const adapter = getGridAdapter(config.gridType);
  const unitsPerCell = config.unitsPerCell ?? 1;
  const unitLabel = config.unitLabel ?? 'm';

  const origin0 = adapter.toPixel(0, 0, config.size);
  const pitchX =
    adapter.toPixel(1, 0, config.size).x - origin0.x || config.size;
  const pitchY =
    adapter.toPixel(0, 1, config.size).y - origin0.y || config.size;

  const { xAxis, yAxis } = useMemo(() => {
    if (!mapBounds) {
      return { xAxis: null as TickAxis | null, yAxis: null as TickAxis | null };
    }
    return {
      xAxis: axisTicks(
        mapBounds.x,
        mapBounds.x + mapBounds.width,
        pitchX,
        config.originX,
        unitsPerCell,
      ),
      yAxis: axisTicks(
        mapBounds.y,
        mapBounds.y + mapBounds.height,
        pitchY,
        config.originY,
        unitsPerCell,
      ),
    };
  }, [mapBounds, pitchX, pitchY, config.originX, config.originY, unitsPerCell]);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!mapBounds || !xAxis || !yAxis) return;
      const top = mapBounds.y;
      const left = mapBounds.x;
      // Horní osa — značky směřují dolů od horní hrany.
      for (const x of xAxis.minors) {
        g.moveTo(x, top);
        g.lineTo(x, top + MINOR_TICK);
      }
      for (const m of xAxis.majors) {
        g.moveTo(m.pos, top);
        g.lineTo(m.pos, top + MAJOR_TICK);
      }
      // Levá osa — značky směřují doprava od levé hrany.
      for (const y of yAxis.minors) {
        g.moveTo(left, y);
        g.lineTo(left + MINOR_TICK, y);
      }
      for (const m of yAxis.majors) {
        g.moveTo(left, m.pos);
        g.lineTo(left + MAJOR_TICK, m.pos);
      }
      // Hraniční linky (samotné „ohraničení").
      g.moveTo(left, top);
      g.lineTo(mapBounds.x + mapBounds.width, top);
      g.moveTo(left, top);
      g.lineTo(left, mapBounds.y + mapBounds.height);
      g.stroke({
        color: theme.gridStroke,
        width: theme.gridStrokeWidth,
        alpha: 0.9,
      });
    },
    [mapBounds, xAxis, yAxis, theme.gridStroke, theme.gridStrokeWidth],
  );

  if (config.showScale === false || !mapBounds || !xAxis || !yAxis) return null;

  const fontSize = Math.max(9, Math.round(config.size * 0.32));
  const labelStyle = {
    fontFamily: 'monospace',
    fontSize,
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 3 },
  } as const;

  return (
    <pixiContainer label="scale-frame">
      <pixiGraphics draw={draw} />
      {/* Popisky horní osy (nad hranou). */}
      {xAxis.majors.map((m, i) => (
        <pixiText
          key={`x${i}`}
          text={i === 0 ? `0` : fmt(m.value)}
          x={m.pos}
          y={mapBounds.y - fontSize * 0.7}
          anchor={0.5}
          resolution={2}
          style={labelStyle}
        />
      ))}
      {/* Popisky levé osy (vlevo od hrany). Poslední na ose nese jednotku.
          Číselný (uniform) anchor 0.5 → centrovaný, posunutý doleva od hrany. */}
      {yAxis.majors.map((m, i) => (
        <pixiText
          key={`y${i}`}
          text={
            i === yAxis.majors.length - 1
              ? `${fmt(m.value)} ${unitLabel}`
              : fmt(m.value)
          }
          x={mapBounds.x - fontSize * 1.8}
          y={m.pos}
          anchor={0.5}
          resolution={2}
          style={labelStyle}
        />
      ))}
    </pixiContainer>
  );
}
