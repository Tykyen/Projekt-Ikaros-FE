/**
 * 15.3 — stupnice (měřítko) jako opravdové PRAVÍTKO kolem mapy.
 *
 * Dílky jsou stupňované po **jednotkách scény** (ne po buňkách) — jako mm/cm na
 * fyzickém pravítku: jemný dílek (krátký), půlený (střední), hlavní s číslem
 * (dlouhý), čísla v kulatých hodnotách (0, 5, 10, …). Lemuje celý okraj mapy
 * (uzavřený rám, dílky + čísla na všech 4 hranách), takže hráč změří délku
 * odkudkoli. Vidí ji všichni (z `config`); gate `showScale !== false`.
 *
 * Měřítko: `pxPerUnit = rozteč buňky / unitsPerCell` (rozteč z `GridAdapter`).
 * Hlavní (číslovaný) dílek se volí tak, aby vyšel na ~70 px a kulaté číslo
 * (1-2-5 řada); jemný dílek = 1/10 hlavního, půlený = 1/2.
 *
 * Žije uvnitř transform rootu (pan/zoom s mapou).
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

/** Cílová rozteč číslovaných dílků v px (jednotka volby „nice" kroku). */
const TARGET_MAJOR_PX = 72;
const MINOR_LEN = 5; // jemný (1/10)
const MID_LEN = 9; // půlený (1/2)
const MAJOR_LEN = 15; // hlavní (s číslem)
const MAX_TICKS = 4000; // strop proti zaseknutí (malá jednotka × obří mapa)

/** Kulatý krok z 1-2-5 řady ≥ raw. */
function niceStep(raw: number): number {
  if (raw <= 0 || !Number.isFinite(raw)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * pow;
}

/** Formát čísla bez zbytečných nul (7.5 → „7,5"). */
function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}

interface RulerTick {
  pos: number;
  level: 0 | 1 | 2; // 0 jemný · 1 půlený · 2 hlavní (číslo)
  value: number;
}

/** Dílky podél jedné osy od `startPx` po délce `lengthPx`, `pxPerUnit`. */
function buildAxis(
  startPx: number,
  lengthPx: number,
  pxPerUnit: number,
): RulerTick[] {
  if (pxPerUnit <= 0 || !Number.isFinite(pxPerUnit) || lengthPx <= 0) return [];
  const majorUnit = niceStep(TARGET_MAJOR_PX / pxPerUnit);
  const minorUnit = majorUnit / 10;
  const maxUnit = lengthPx / pxPerUnit;
  const n = Math.floor(maxUnit / minorUnit + 1e-6);
  if (n > MAX_TICKS) return [];
  const ticks: RulerTick[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i * minorUnit;
    const level: 0 | 1 | 2 = i % 10 === 0 ? 2 : i % 5 === 0 ? 1 : 0;
    ticks.push({ pos: startPx + u * pxPerUnit, level, value: u });
  }
  return ticks;
}

function tickLen(level: 0 | 1 | 2): number {
  return level === 2 ? MAJOR_LEN : level === 1 ? MID_LEN : MINOR_LEN;
}

export function MapScaleFrame({
  config,
  theme,
  mapBounds,
}: Props): React.ReactElement | null {
  const adapter = getGridAdapter(config.gridType);
  const unitsPerCell = config.unitsPerCell ?? 1;
  const unitLabel = config.unitLabel ?? 'm';

  // Rozteč buňky v px (z geometrie mřížky) → px na jednotku scény.
  const origin0 = adapter.toPixel(0, 0, config.size);
  const pitchX =
    adapter.toPixel(1, 0, config.size).x - origin0.x || config.size;
  const pitchY =
    adapter.toPixel(0, 1, config.size).y - origin0.y || config.size;
  const pxPerUnitX = pitchX / unitsPerCell;
  const pxPerUnitY = pitchY / unitsPerCell;

  const { xTicks, yTicks } = useMemo(() => {
    if (!mapBounds) return { xTicks: [], yTicks: [] };
    return {
      xTicks: buildAxis(mapBounds.x, mapBounds.width, pxPerUnitX),
      yTicks: buildAxis(mapBounds.y, mapBounds.height, pxPerUnitY),
    };
  }, [mapBounds, pxPerUnitX, pxPerUnitY]);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!mapBounds) return;
      const top = mapBounds.y;
      const left = mapBounds.x;
      const right = mapBounds.x + mapBounds.width;
      const bottom = mapBounds.y + mapBounds.height;

      // Osa X — dílky na horní (dolů) i dolní (nahoru) hraně.
      for (const t of xTicks) {
        const len = tickLen(t.level);
        g.moveTo(t.pos, top);
        g.lineTo(t.pos, top + len);
        g.moveTo(t.pos, bottom);
        g.lineTo(t.pos, bottom - len);
      }
      // Osa Y — dílky na levé (doprava) i pravé (doleva) hraně.
      for (const t of yTicks) {
        const len = tickLen(t.level);
        g.moveTo(left, t.pos);
        g.lineTo(left + len, t.pos);
        g.moveTo(right, t.pos);
        g.lineTo(right - len, t.pos);
      }
      // Uzavřený rám kolem celé mapy.
      g.moveTo(left, top);
      g.lineTo(right, top);
      g.lineTo(right, bottom);
      g.lineTo(left, bottom);
      g.lineTo(left, top);
      g.stroke({
        color: theme.gridStroke,
        width: theme.gridStrokeWidth,
        alpha: 0.95,
      });
    },
    [mapBounds, xTicks, yTicks, theme.gridStroke, theme.gridStrokeWidth],
  );

  if (config.showScale === false || !mapBounds) return null;

  const fontSize = Math.max(9, Math.round(config.size * 0.3));
  const labelStyle = {
    fontFamily: 'monospace',
    fontSize,
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 3 },
  } as const;
  const right = mapBounds.x + mapBounds.width;
  const bottom = mapBounds.y + mapBounds.height;
  const xMajors = xTicks.filter((t) => t.level === 2);
  const yMajors = yTicks.filter((t) => t.level === 2);

  return (
    <pixiContainer label="scale-frame">
      <pixiGraphics draw={draw} />
      {/* Čísla osy X — nad horní i pod dolní hranou (poslední nese jednotku). */}
      {xMajors.map((t, i) => {
        const text =
          i === xMajors.length - 1
            ? `${fmt(t.value)} ${unitLabel}`
            : fmt(t.value);
        return (
          <pixiContainer key={`x${i}`}>
            <pixiText
              text={text}
              x={t.pos}
              y={mapBounds.y - fontSize * 0.8}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
            <pixiText
              text={text}
              x={t.pos}
              y={bottom + fontSize * 0.8}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
          </pixiContainer>
        );
      })}
      {/* Čísla osy Y — vlevo od levé i vpravo od pravé hrany. */}
      {yMajors.map((t, i) => {
        const text =
          i === yMajors.length - 1
            ? `${fmt(t.value)} ${unitLabel}`
            : fmt(t.value);
        return (
          <pixiContainer key={`y${i}`}>
            <pixiText
              text={text}
              x={mapBounds.x - fontSize * 1.8}
              y={t.pos}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
            <pixiText
              text={text}
              x={right + fontSize * 1.8}
              y={t.pos}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}
